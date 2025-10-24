import axios from 'axios';

const GOOGLE_CSE_API_KEY = process.env.GOOGLE_CSE_API_KEY || '';
const GOOGLE_CSE_CX = process.env.GOOGLE_CSE_CX || '';

function urlEnc(s: string) { return encodeURIComponent(s || ''); }
function str(o: any) { return o == null ? '' : String(o); }

function normalizeDomain(url?: string) {
  if (!url) return '';
  try {
    const u = new URL(url);
    let host = u.hostname || '';
    if (host.startsWith('www.')) host = host.substring(4);
    return host.toLowerCase();
  } catch { return ''; }
}

function normalizeTitleForKey(title: string) {
  let t = title.trim().toLowerCase();
  t = t.replace(/\s+[-|•–—]\s+.*/g, '');
  return t;
}

function buildReason(snippet?: string) {
  let s = snippet ? snippet.trim() : '';
  if (s.length > 180) s = s.substring(0, 177) + '...';
  return s ? (s + ' — found by search') : 'found by search';
}

function excludeSite(host?: string) { return host ? `-site:${host}` : ''; }

function safeJoin(...parts: Array<string|undefined>) {
  return parts.filter((p): p is string => typeof p === 'string' && p.length>0).map(p => p.trim()).join(' ');
}

function firstSentence(text?: string) {
  if (!text) return '';
  const s = text.trim();
  const dot = s.indexOf('.');
  if (dot >= 0 && dot < 400) return s.substring(0, dot+1);
  return s.length > 400 ? s.substring(0,400) : s;
}

function guessLang(_text?: string) { return 'en'; }
function guessRegion(text?: string) { if (!text) return ''; const t = text.toLowerCase(); if (t.includes('india')||t.includes('delhi')||t.includes('punjabi')) return 'IN'; return ''; }

function extractSubjectFromUrl(sourceUrl?: string) {
  if (!sourceUrl) return '';
  try {
    const u = new URL(sourceUrl);
    const path = u.pathname || '';
    if (path.includes('/wiki/')) {
      let slug = path.substring(path.lastIndexOf('/')+1);
      slug = decodeURIComponent(slug).replace(/_/g,' ').trim();
      if (slug.length >= 3) return decodeCase(slug);
    }
    const last = path.substring(path.lastIndexOf('/')+1);
    if (last) return decodeCase(decodeURIComponent(last).replace(/[-_]/g,' '));
  } catch {}
  return '';
}

function decodeCase(s: string) {
  if (!s) return s;
  return s.split(/\s+/).map(w => w.length? (w[0].toUpperCase()+w.slice(1)) : '').join(' ').trim();
}

function extractClaimTokens(text?: string, subject?: string) {
  const ct: any = { core: '', when: '', where: '' };
  if (!text) return ct;
  const t = text;
  const years: string[] = [];
  const yearRe = /\b(18\d{2}|19\d{2}|20\d{2})\b/g;
  let m; while ((m = yearRe.exec(t)) !== null) years.push(m[1]);
  if (years.length) ct.when = years.join(' ');
  const where = new Set<string>();
  const capRe = /\b([A-Z][a-zA-Z]+)\b/g;
  const subjectLower = (subject||'').toLowerCase();
  while ((m = capRe.exec(t)) !== null) {
    const w = m[1];
    if (!subjectLower.includes(w.toLowerCase())) where.add(w);
    if (where.size >= 5) break;
  }
  if (where.size) ct.where = Array.from(where).join(' ');
  const lower = (t||'').toLowerCase();
  if (lower.includes('born')) ct.core = 'born';
  else if (lower.includes('captain')) ct.core = 'captain';
  else if (lower.includes('cricketer')) ct.core = 'cricketer';
  else ct.core = '';
  return ct;
}

function buildQueryPlan(text?: string, subject?: string, host?: string) {
  const first = firstSentence(text);
  const lang = guessLang(text);
  const region = guessRegion(text);
  const t = extractClaimTokens(text, subject);
  const attempts: string[] = [];
  attempts.push(safeJoin(subject, t.core, t.when, t.where, excludeSite(host)));
  attempts.push(safeJoin(subject, t.core, t.when, t.where));
  attempts.push(safeJoin(subject, 'biography', excludeSite(host)));
  attempts.push(safeJoin(subject, 'biography'));
  attempts.push(safeJoin(subject, first, excludeSite(host)));
  attempts.push(safeJoin(subject, first));
  const uniq = Array.from(new Set(attempts.filter(Boolean).map(s => s.trim())));
  return { attempts: uniq, lang, region };
}

export async function findSources(text?: string, sourceUrl?: string, persona?: string, size = 5) {
  if (!GOOGLE_CSE_API_KEY || !GOOGLE_CSE_CX) throw new Error('Search not configured');
  const limit = Math.max(1, Math.min(size, 10));
  const host = normalizeDomain(sourceUrl || '');
  const subject = extractSubjectFromUrl(sourceUrl || '');
  const plan = buildQueryPlan(text, subject, host);
  const dedup = new Map<string, any>();

  for (const q of plan.attempts) {
    if (!q) continue;
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${urlEnc(GOOGLE_CSE_API_KEY)}&cx=${urlEnc(GOOGLE_CSE_CX)}&q=${urlEnc(q)}&num=${limit}` + (plan.lang?`&lr=${urlEnc('lang_'+plan.lang)}`:'') + (plan.region?`&gl=${urlEnc(plan.region)}`:'');
      const resp = await axios.get(url, { timeout: 8000 });
      const items = Array.isArray(resp.data?.items) ? resp.data.items : [];
      mapAndDedup(items, dedup);
      if (dedup.size >= limit) break;
    } catch (e) {
      continue;
    }
  }

  if (dedup.size === 0) {
    const first = firstSentence(text);
    for (const q of [safeJoin(subject, first, excludeSite(host)), safeJoin(subject, first)]) {
      if (!q) continue;
      try {
        const url = `https://www.googleapis.com/customsearch/v1?key=${urlEnc(GOOGLE_CSE_API_KEY)}&cx=${urlEnc(GOOGLE_CSE_CX)}&q=${urlEnc(q)}&num=${limit}`;
        const resp = await axios.get(url, { timeout: 8000 });
        const items = Array.isArray(resp.data?.items) ? resp.data.items : [];
        mapAndDedup(items, dedup);
        if (dedup.size >= limit) break;
      } catch (e) { continue; }
    }
  }

  return Array.from(dedup.values()).slice(0, limit);
}

function mapAndDedup(items: any[], dedup: Map<string, any>) {
  for (const it of items) {
    if (!it || typeof it !== 'object') continue;
    const title = str(it.title);
    const link = str(it.link);
    const snippet = str(it.snippet);
    if (!link || !title) continue;
    const domain = normalizeDomain(link);
    const titleKey = normalizeTitleForKey(title);
    const key = domain + '|' + titleKey;
    if (dedup.has(key)) continue;
    const reason = buildReason(snippet);
    dedup.set(key, { title, url: link, snippet, reason });
  }
}

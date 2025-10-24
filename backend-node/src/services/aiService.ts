import { callGeminiApi } from './cloudAiService';

function safe(s?: string) { return s || ''; }

function normalizePersona(p?: string) {
  if (!p) return 'general';
  const v = p.trim().toLowerCase();
  return ['student','researcher','editor'].includes(v) ? v : 'general';
}

function createPrompt(req: any) {
  const text = safe(req.text);
  const persona = normalizePersona(req.persona);
  const cite = !!req.citeSources;
  const structured = !!req.structured;

  const personaDirectives = persona === 'student' ? 'Persona: Student — explain simply, highlight key ideas, include brief examples when helpful.' :
    persona === 'researcher' ? 'Persona: Researcher — precise, formal tone; include nuance and limitations; prefer technical accuracy.' :
    persona === 'editor' ? 'Persona: Editor — improve clarity, structure, and style; correct grammar and concision.' :
    'Persona: General — balanced tone and clarity.';

  const universal = `Preserve original meaning and intent. Preserve Markdown formatting and code blocks. If the input contains code, do not change identifiers or semantics.`;
  const citeDirective = cite ? 'When possible, include citations or URLs explicitly present in the text. Do NOT fabricate sources.' : 'Do not add citations beyond those explicitly present in the text.';

  const action = req.action;
  const isSummarize = action === 'summarize';
  const isExplain = action === 'explain';

  if (structured && (isSummarize || isExplain)) {
    const task = isSummarize ? 'Summarize the following text into concise bullet points.' : 'Explain the following text clearly and structurally in concise bullet points.';
    const schema = `Output STRICT JSON (no extra text) matching:\n{ "bullets": ["string", "..."], "citations": [{ "url": "string", "title": "string", "note": "string (optional)" }] }`;
    return `${personaDirectives}\n${universal}\n${citeDirective}\nTask:\n${task}\n${schema}\nText:\n${text}`;
  }

  const opInstruction = (function() {
    switch (action) {
      case 'summarize': return 'Summarize the following text in concise bullet points.';
      case 'explain': return 'Explain the following text with clear structure.';
      case 'rewrite': return 'Rewrite the following text to improve clarity and style while preserving meaning and voice.';
      case 'translate': return `Translate the following text to ${safe(req.targetLang)}. Preserve formatting, tone, and any Markdown or code blocks.`;
      case 'proofread': return 'Proofread and correct grammatical errors while preserving meaning and voice. Return ONLY the corrected text.';
      case 'comment_code': return `Add clear, helpful explanatory comments to the following code without changing its behavior.`;
      default: return 'Perform the requested operation on the text.';
    }
  })();

  const citeBlock = (isSummarize || isExplain) ? citeDirective : 'Do not add external references beyond what appears in the text.';

  return `${personaDirectives}\n${universal}\n${citeBlock}\nTask:\n${opInstruction}\nText:\n${text}`;
}

export async function processAiRequest(req: any) {
  const prompt = createPrompt(req);
  try {
    const output = await callGeminiApi(prompt);
    return { result: output, fromLocal: false };
  } catch (e) {
    console.log('[aiService] Gemini call failed, returning fallback result:', (e as any)?.message);
    return { result: { text: 'Fallback response: AI unavailable' }, fromLocal: true };
  }
}

export async function generateQuizJson(title: string, text: string) {
  const prompt = `You are a quiz generator. Create 5 multiple-choice questions (MCQs) based on the article below. Output STRICT JSON matching schema... Title: ${title} Article: ${text}`;
  try {
    const raw = await callGeminiApi(prompt);
    const j = extractFirstJsonObject(raw);
    return j;
  } catch (e) {
    console.log('[aiService] generateQuizJson fallback due to error:', (e as any)?.message);
    // Return a tiny sample quiz JSON
    return {
      title: title || 'Sample Quiz',
      questions: [
        { question: 'What is 2+2?', options: ['3', '4', '5'], correctIndex: 1, explanation: '2+2 equals 4' }
      ]
    };
  }
}

export async function selectSuggestionsJson(baseSummary: string, candidatesJson: string) {
  const prompt = `You are a reading list curator. From the candidate list, pick the 3 most relevant items for the user. Return STRICT JSON:{"suggestions":[{ "url":"string","title":"string","reason":"string" }]}\nBase Summary:\n${baseSummary}\nCandidates:\n${candidatesJson}`;
  const raw = await callGeminiApi(prompt);
  const parsed = typeof raw === 'string' ? extractFirstJsonObject(raw) : raw;
  return parsed;
}

function extractFirstJsonObject(text: string) {
  try { return JSON.parse(text); } catch {}
  const i = text.indexOf('{');
  let brace = 0;
  for (let start = i; start >= 0; start = text.indexOf('{', start + 1)) {
    brace = 0;
    for (let j = start; j < text.length; j++) {
      const c = text[j];
      if (c === '{') brace++;
      if (c === '}') brace--;
      if (brace === 0) {
        const candidate = text.substring(start, j + 1);
        try { return JSON.parse(candidate); } catch {}
        break;
      }
    }
    if (start === -1) break;
  }
  throw new Error('AI did not return valid JSON');
}

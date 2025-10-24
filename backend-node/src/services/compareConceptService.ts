import { findSources } from './cloudSearchService';
import { processAiRequest } from './aiService';

/**
 * Minimal CompareConceptService: Given a concept A and concept B (text),
 * it will call cloud search to fetch supporting sources and then call AI to
 * generate a comparison summary.
 */
export async function compareConcepts(baseConcept: string, compareTo: string) {
  const query = `${baseConcept} vs ${compareTo}`.trim();
  let sources: any[] = [];
  try {
    sources = await findSources(query, undefined, undefined, 5);
  } catch (e) {
    sources = [];
  }

  const sourcesText = sources.map((r: any) => r.url || r.link || r.title || '').join('\n');

  const prompt = `Compare the following concepts.\nBase concept: ${baseConcept}\nCompare to: ${compareTo}\n\nUse these sources:\n${sourcesText}\n\nProvide: 1) Short comparison summary (3-4 sentences), 2) Key differences bullet list, 3) Recommendation.`;

  const aiResp = await processAiRequest({ prompt, maxTokens: 800 });

  return { ai: aiResp, sources };
}

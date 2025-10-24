import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = process.env.GEMINI_API_URL;

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables');
}

export async function callGeminiApi(prompt: string): Promise<string> {
  try {
    // Build request body similar to Java implementation
    const requestBody = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    };

    const headers: Record<string,string> = {
      'Content-Type': 'application/json'
    };
    // Prefer Authorization header if key looks like a bearer, otherwise send key as query param
    if (GEMINI_API_KEY && GEMINI_API_KEY.startsWith('ya29')) {
      headers['Authorization'] = `Bearer ${GEMINI_API_KEY}`;
    }

    const url = GEMINI_API_URL + (GEMINI_API_KEY && !GEMINI_API_KEY.startsWith('ya29') ? `?key=${GEMINI_API_KEY}` : '');

    const resp = await axios.post(url, requestBody, { headers, timeout: 30000 });
    const data = resp.data;
    // Try to extract text similarly to Java: candidates[0].content.parts[0].text
    const candidates = data?.candidates || data?.candidates || null;
    if (Array.isArray(candidates) && candidates.length > 0) {
      const text = candidates[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    }
    // Fallback: if generativelanguage returns 'output' or 'items'
    if (typeof data === 'string') return data;
    if (data?.outputText) return data.outputText;
    // As a last resort stringify whole response
    return JSON.stringify(data);
  } catch (err: any) {
    const msg = err?.response?.data || err.message || String(err);
    throw new Error('Gemini call failed: ' + JSON.stringify(msg));
  }
}

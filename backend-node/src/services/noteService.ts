import Note from '../models/note';
import { processAiRequest } from './aiService';

export async function listNotes(limit = 100) {
  return Note.find().sort({ createdAt: -1 }).limit(limit).exec();
}

export async function createNote(data: { text: string; url?: string; createdBy?: any }) {
  const n = new Note({ text: data.text, url: data.url, createdBy: data.createdBy });
  return n.save();
}

// Create note with AI-based categorization
export async function createNoteWithCategories(data: { text: string; url?: string; createdBy?: any }) {
  let categoriesJson = '[]';
  
  // Try to categorize using AI
  try {
    const prompt = `Analyze this note and suggest 2-3 relevant categories as a JSON array of strings: "${data.text.substring(0, 200)}"`;
    const aiResponse = await processAiRequest({
      action: 'summarize',
      text: prompt,
      targetLang: undefined,
      persona: 'general',
      citeSources: false,
      structured: true
    });
    
    // Parse AI response to extract categories
    const resultText = typeof aiResponse.result === 'string' ? aiResponse.result : JSON.stringify(aiResponse.result);
    const match = resultText.match(/\[.*?\]/);
    if (match) {
      categoriesJson = match[0];
      JSON.parse(categoriesJson); // Validate it's proper JSON
    }
  } catch (err) {
    console.log('[noteService] categorization fallback', (err as any)?.message);
    categoriesJson = '["General"]';
  }
  
  const n = new Note({ 
    text: data.text, 
    url: data.url, 
    categoriesJson,
    createdBy: data.createdBy 
  });
  return n.save();
}

export async function getNote(id: string) {
  return Note.findById(id).exec();
}

export async function updateNote(id: string, patch: any) {
  return Note.findByIdAndUpdate(id, patch, { new: true }).exec();
}

export async function deleteNote(id: string) {
  return Note.findByIdAndDelete(id).exec();
}

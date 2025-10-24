import Quiz from '../models/quiz';
import QuizAttempt from '../models/quizAttempt';
import { generateQuizJson } from './aiService';
import axios from 'axios';

export async function generateFromUrl(url: string, userId: any) {
  // Fetch content from URL (simplified - in production you'd use a proper scraper)
  let text = '';
  let title = url;
  
  try {
    const response = await axios.get(url, { 
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 PageGenie Bot' }
    });
    
    // Extract text from HTML (basic extraction)
    const html = response.data;
    // Remove script and style tags
    text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
               .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
               .replace(/<[^>]+>/g, ' ')
               .replace(/\s+/g, ' ')
               .trim();
    
    // Try to extract title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }
    
    // Limit text length
    if (text.length > 5000) {
      text = text.substring(0, 5000);
    }
  } catch (err) {
    throw new Error(`Failed to fetch content from URL: ${(err as any)?.message}`);
  }
  
  if (!text || text.length < 50) {
    throw new Error('Insufficient content extracted from URL');
  }
  
  return generateAndSaveQuiz(title, text, url, userId);
}

export async function generateAndSaveQuiz(title: string, text: string, sourceUrl: string | undefined, userId: any) {
  const raw = await generateQuizJson(title || '', text || '');
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const questions = parsed.questions || [];
  const quiz = new Quiz({ title, sourceUrl, questions, createdBy: userId });
  await quiz.save();
  return quiz;
}

export async function generateTransientQuiz(title: string, text: string) {
  const raw = await generateQuizJson(title || '', text || '');
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return parsed;
}

export async function submitAnswers(quizId: string, userId: any, answers: any[]) {
  const quiz = await Quiz.findById(quizId).lean().exec();
  if (!quiz) throw new Error('Not found');
  const questions = quiz.questions || [];
  let score = 0;
  
  // answers format: [{ questionIndex: 0, selectedAnswer: 'A' }, ...]
  for (const ans of answers) {
    const questionIndex = ans.questionIndex;
    const selectedAnswer = ans.selectedAnswer;
    
    if (questionIndex >= 0 && questionIndex < questions.length) {
      const q = questions[questionIndex];
      const selectedIndex = selectedAnswer.charCodeAt(0) - 'A'.charCodeAt(0); // Convert 'A', 'B', 'C', 'D' to 0, 1, 2, 3
      if (selectedIndex === q.correctIndex) {
        score++;
      }
    }
  }
  
  const attempt = new QuizAttempt({ quiz: quiz._id, user: userId, answers, score });
  await attempt.save();
  return { score, attemptId: attempt._id };
}

export async function getQuizById(id: string) {
  return Quiz.findById(id).lean().exec();
}

export async function listQuizzes(limit = 100) {
  return Quiz.find().sort({ createdAt: -1 }).limit(limit).lean().exec();
}

export async function listQuizzesByUser(userId: any, limit = 100) {
  return Quiz.find({ createdBy: userId }).sort({ createdAt: -1 }).limit(limit).lean().exec();
}

export async function listAttemptsForQuiz(quizId: string, limit = 100) {
  return QuizAttempt.find({ quiz: quizId }).sort({ createdAt: -1 }).limit(limit).lean().exec();
}

export async function listAttemptsByUser(userId: any, limit = 100) {
  return QuizAttempt.find({ user: userId }).sort({ createdAt: -1 }).limit(limit).lean().exec();
}

export async function getAttemptById(attemptId: string) {
  return QuizAttempt.findById(attemptId).lean().exec();
}

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/authMiddleware';
import * as quizService from '../services/quizService';

const router = Router();

// Generate quiz from URL (fetch content from URL first) - protected
router.post('/generate-from-url',
  authMiddleware,
  [
    body('url').notEmpty().withMessage('URL is required').isURL().withMessage('Invalid URL')
  ],
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { url } = req.body;
      const quiz = await quizService.generateFromUrl(url, req.user?._id);
      res.status(201).json({ id: quiz._id, openUrl: `/quiz/${quiz._id}` });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error generating quiz from URL' });
    }
  });

// Generate quiz from text (creates and stores a Quiz document) - protected
router.post('/generate-from-text', 
  authMiddleware,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('text').notEmpty().withMessage('Text is required').isLength({ min: 50 }).withMessage('Text must be at least 50 characters'),
    body('sourceUrl').optional().isURL().withMessage('Invalid URL')
  ],
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { title, text, sourceUrl } = req.body;
      const quiz = await quizService.generateAndSaveQuiz(title, text, sourceUrl, req.user?._id);
      res.status(201).json({ quizId: quiz._id });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error generating quiz' });
    }
  });

// Quick generate (non-persistent) - protected
router.post('/generate', 
  authMiddleware,
  [
    body('title').optional().isString(),
    body('text').notEmpty().withMessage('Text is required').isLength({ min: 50 }).withMessage('Text must be at least 50 characters')
  ],
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { title, text } = req.body;
      const parsed = await quizService.generateTransientQuiz(title || '', text);
      res.json(parsed);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error' });
    }
  });

// Get quiz by id (protected)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const q = await quizService.getQuizById(req.params.id);
    if (!q) return res.status(404).json({ message: 'Not found' });
    res.json(q);
  } catch (err: any) { res.status(500).json({ message: err.message || 'Error' }); }
});

// Public list of quizzes
router.get('/', async (_req, res) => {
  try {
    const list = await quizService.listQuizzes(100);
    res.json(list);
  } catch (err: any) { res.status(500).json({ message: err.message || 'Error' }); }
});

// Get quizzes created by the authenticated user
router.get('/user/me', authMiddleware, async (req: any, res) => {
  try {
    const list = await quizService.listQuizzesByUser(req.user?._id, 100);
    res.json(list);
  } catch (err: any) { res.status(500).json({ message: err.message || 'Error' }); }
});

// Submit answers
router.post('/:id/submit', 
  authMiddleware,
  [
    body('answers').isArray().withMessage('Answers must be an array'),
    body('answers.*.questionIndex').isInt({ min: 0 }).withMessage('Invalid questionIndex'),
    body('answers.*.selectedAnswer').isString().withMessage('selectedAnswer must be a string')
  ],
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { answers } = req.body;
      const result = await quizService.submitAnswers(req.params.id, req.user?._id, answers);
      res.json({ score: result.score });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error' });
    }
  });

// List attempts for a quiz (protected)
router.get('/:id/attempts', authMiddleware, async (req: any, res) => {
  try {
    const attempts = await quizService.listAttemptsForQuiz(req.params.id, 200);
    res.json(attempts);
  } catch (err: any) { res.status(500).json({ message: err.message || 'Error' }); }
});

// Get a specific attempt by id (protected)
router.get('/attempt/:attemptId', authMiddleware, async (req: any, res) => {
  try {
    const a = await quizService.getAttemptById(req.params.attemptId);
    if (!a) return res.status(404).json({ message: 'Not found' });
    res.json(a);
  } catch (err: any) { res.status(500).json({ message: err.message || 'Error' }); }
});

// List attempts by user
router.get('/attempts/user/me', authMiddleware, async (req: any, res) => {
  try {
    const attempts = await quizService.listAttemptsByUser(req.user?._id, 200);
    res.json(attempts);
  } catch (err: any) { res.status(500).json({ message: err.message || 'Error' }); }
});

// Alias for recent attempts (same as attempts/user/me)
router.get('/attempts/recent', authMiddleware, async (req: any, res) => {
  try {
    const attempts = await quizService.listAttemptsByUser(req.user?._id, 200);
    res.json(attempts);
  } catch (err: any) { res.status(500).json({ message: err.message || 'Error' }); }
});

export default router;

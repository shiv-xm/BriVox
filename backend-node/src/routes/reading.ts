import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/authMiddleware';
import Suggestion from '../models/suggestion';
import { selectSuggestionsJson } from '../services/aiService';

const router = Router();

// POST /api/v1/reading/suggest
router.post('/suggest', 
  authMiddleware,
  [
    body('baseSummary').notEmpty().withMessage('baseSummary is required').isString(),
    body('candidatesJson').notEmpty().withMessage('candidatesJson is required').isString()
  ],
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { baseSummary, candidatesJson } = req.body;
      const parsed = await selectSuggestionsJson(baseSummary, candidatesJson);
      const suggestions = parsed?.suggestions || [];
      const docs: any[] = [];
      for (const s of suggestions) {
        const doc = new Suggestion({ url: s.url, title: s.title, reason: s.reason, createdBy: req.user?._id });
        await doc.save();
        docs.push(doc);
      }
      res.json({ suggestions: docs });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error' });
    }
  });

// GET /api/v1/reading/recent
router.get('/recent', authMiddleware, async (req: any, res) => {
  try {
    const list = await Suggestion.find({ createdBy: req.user?._id }).sort({ createdAt: -1 }).limit(50).lean().exec();
    res.json(list);
  } catch (err: any) { res.status(500).json({ message: err.message || 'Error' }); }
});

export default router;

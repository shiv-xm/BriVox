import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { findSources } from '../services/cloudSearchService';
const router = Router();

// POST /api/v1/sources/find
// body: { text, sourceUrl, persona, size }
router.post('/find',
  [
    body('text').notEmpty().withMessage('text is required').isString(),
    body('sourceUrl').optional().isString(),
    body('persona').optional().isString(),
    body('size').optional().isInt({ min: 1, max: 20 }).withMessage('size must be between 1 and 20')
  ],
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const body = req.body;
      const results = await findSources(body.text, body.sourceUrl, body.persona, body.size || 5);
      res.json({ query: body.text, results });
    } catch (err: any) {
      console.error('sources/find error', err?.message || err);
      res.status(503).json({ message: err?.message || 'Search not configured' });
    }
  });

export default router;

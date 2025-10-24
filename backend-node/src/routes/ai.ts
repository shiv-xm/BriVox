import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { processAiRequest } from '../services/aiService';
import { compareConcepts } from '../services/compareConceptService';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// ExecuteRequest: { action, text, targetLang, persona, citeSources, structured }
router.post('/',
  [
    body('action').notEmpty().withMessage('Action is required')
      .isIn(['summarize','rewrite','explain','translate','proofread','comment_code'])
      .withMessage('Invalid action. Must be one of: summarize, rewrite, explain, translate, proofread, comment_code'),
    body('text').notEmpty().withMessage('Text is required'),
    body('targetLang').optional().isString(),
    body('persona').optional().isString(),
    body('citeSources').optional().isBoolean(),
    body('structured').optional().isBoolean()
  ],
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const body = req.body;
      const action = body.action.toLowerCase();
      const persona = body.persona || 'general';
      const citeSources = !!body.citeSources;
      const structured = !!body.structured;

      const reqObj = {
        action,
        text: body.text,
        targetLang: body.targetLang,
        persona,
        citeSources,
        structured
      };

      const aiResponse = await processAiRequest(reqObj);
      return res.json({ output: aiResponse.result });
    } catch (err: any) {
      console.error('AI error', err);
      return res.status(500).json({ message: err.message || 'AI error' });
    }
  });

// POST /api/v1/ai/compare-concept - Compare concepts (legacy path)
router.post('/compare-concept',
  authMiddleware,
  [
    body('selection_text').optional().isString(),
    body('page_url').optional().isString()
  ],
  async (req: any, res: any) => {
    try {
      const { selection_text, page_url } = req.body;
      // For now, return a basic comparison structure
      // You can enhance this with actual AI comparison logic
      const result = await compareConcepts(selection_text || 'concept', page_url || 'context');
      return res.json(result);
    } catch (err: any) {
      console.error('Compare concept error', err);
      return res.status(500).json({ message: err.message || 'Compare error' });
    }
  });

export default router;

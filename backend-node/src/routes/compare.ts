import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/authMiddleware';
import { compareConcepts } from '../services/compareConceptService';

const router = Router();

// POST /api/v1/compare - { baseConcept, compareTo }
router.post('/', 
  authMiddleware,
  [
    body('baseConcept').notEmpty().withMessage('baseConcept is required').isString(),
    body('compareTo').notEmpty().withMessage('compareTo is required').isString()
  ],
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { baseConcept, compareTo } = req.body;
      const result = await compareConcepts(baseConcept, compareTo);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error' });
    }
  });

export default router;

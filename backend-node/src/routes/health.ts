import { Router } from 'express';

const router = Router();

// GET /api/health
router.get('/', (_req, res) => {
  res.status(200).send('OK');
});

export default router;

import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import OperationLog from '../models/operationLog';

const router = Router();

// POST /api/v1/ops or /api/ops/log - create an operation log
router.post('/', authMiddleware, async (req: any, res) => {
  try {
    const { action, details } = req.body || {};
    if (!action) return res.status(400).json({ message: 'action required' });
    const log = new OperationLog({ action, details, createdBy: req.user?._id });
    await log.save();
    res.status(201).json(log);
  } catch (err: any) { res.status(500).json({ message: err.message || 'Error' }); }
});

// Alias for legacy calls
router.post('/log', authMiddleware, async (req: any, res) => {
  try {
    const { action, details } = req.body || {};
    if (!action) return res.status(400).json({ message: 'action required' });
    const log = new OperationLog({ action, details, createdBy: req.user?._id });
    await log.save();
    res.status(201).json(log);
  } catch (err: any) { res.status(500).json({ message: err.message || 'Error' }); }
});

// GET /api/v1/ops/recent - list recent logs for user
router.get('/recent', authMiddleware, async (req: any, res) => {
  try {
    const logs = await OperationLog.find({ createdBy: req.user?._id }).sort({ createdAt: -1 }).limit(50).lean().exec();
    res.json(logs);
  } catch (err: any) { res.status(500).json({ message: err.message || 'Error' }); }
});

export default router;

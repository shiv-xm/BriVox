import { Router } from 'express';
import User from '../models/user';
import { sign } from '../services/jwtService';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });
    const existing = await User.findOne({ email }).exec();
    if (existing) return res.status(409).json({ message: 'Email already in use' });
    const u = new User({ email, password, name });
    await u.save();
    const token = sign({ id: u._id, email: u.email });
    res.status(201).json({ token, user: { id: u._id, email: u.email, name: u.name } });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });
    const user = await User.findOne({ email }).exec();
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = sign({ id: user._id, email: user.email });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error' });
  }
});

router.get('/me', authMiddleware, async (req: any, res) => {
  res.json(req.user);
});

export default router;

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';

export async function authMiddleware(req: Request & { user?: any }, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  const token = auth.substring(7);
  try {
    const payload: any = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const user = await User.findById(payload.id).select('-password').exec();
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

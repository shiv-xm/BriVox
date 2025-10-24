import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import aiRouter from './routes/ai';
import notesRouter from './routes/notes';
import sourcesRouter from './routes/sources';
import readingRouter from './routes/reading';
import quizRouter from './routes/quiz';
import authRouter from './routes/auth';
import opsRouter from './routes/ops';
import compareRouter from './routes/compare';
import healthRouter from './routes/health';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8098;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/genie_project';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Mongo connection error', err));

app.use('/api/v1/ai', aiRouter);
app.use('/api/notes', notesRouter);
app.use('/api/v1/sources', sourcesRouter);
app.use('/api/v1/reading', readingRouter);
app.use('/api/v1/quiz', quizRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/ops', opsRouter);
app.use('/api/ops', opsRouter);  
app.use('/api/v1/compare', compareRouter);
app.use('/api/health', healthRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

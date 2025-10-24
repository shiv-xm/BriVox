import mongoose from 'mongoose';

export interface IQuizAttempt extends mongoose.Document {
  quiz: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  answers: number[];
  score: number;
}

const QuizAttemptSchema = new mongoose.Schema<IQuizAttempt>({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  answers: { type: [Number], default: [] },
  score: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema);

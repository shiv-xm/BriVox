import mongoose from 'mongoose';

export interface IQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface IQuiz extends mongoose.Document {
  title?: string;
  sourceUrl?: string;
  questions: IQuestion[];
  createdBy?: mongoose.Types.ObjectId;
}

const QuestionSchema = new mongoose.Schema<IQuestion>({
  question: { type: String, required: true },
  options: { type: [String], default: [] },
  correctIndex: { type: Number, required: true },
  explanation: { type: String }
});

const QuizSchema = new mongoose.Schema<IQuiz>({
  title: { type: String },
  sourceUrl: { type: String },
  questions: { type: [QuestionSchema], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model<IQuiz>('Quiz', QuizSchema);

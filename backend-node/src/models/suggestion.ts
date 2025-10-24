import mongoose from 'mongoose';

export interface ISuggestion extends mongoose.Document {
  url: string;
  title: string;
  reason?: string;
  createdBy?: mongoose.Types.ObjectId;
}

const SuggestionSchema = new mongoose.Schema<ISuggestion>({
  url: { type: String, required: true },
  title: { type: String, required: true },
  reason: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model<ISuggestion>('Suggestion', SuggestionSchema);

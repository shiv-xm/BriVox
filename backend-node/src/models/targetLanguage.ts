import mongoose from 'mongoose';

export interface ITargetLanguage extends mongoose.Document {
  code: string;
  name?: string;
}

const TargetLanguageSchema = new mongoose.Schema<ITargetLanguage>({
  code: { type: String, required: true },
  name: { type: String }
}, { timestamps: true });

export default mongoose.model<ITargetLanguage>('TargetLanguage', TargetLanguageSchema);

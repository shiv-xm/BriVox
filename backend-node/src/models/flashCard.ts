import mongoose from 'mongoose';

export interface IFlashCard extends mongoose.Document {
  front: string;
  back: string;
  createdBy?: mongoose.Types.ObjectId;
}

const FlashCardSchema = new mongoose.Schema<IFlashCard>({
  front: { type: String, required: true },
  back: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model<IFlashCard>('FlashCard', FlashCardSchema);

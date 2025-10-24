import mongoose from 'mongoose';

const { Schema } = mongoose;

export interface INote extends mongoose.Document {
  text: string;
  url?: string;
  categoriesJson?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
}

const NoteSchema = new Schema<INote>({
  text: { type: String, required: true },
  url: { type: String },
  categoriesJson: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<INote>('Note', NoteSchema);

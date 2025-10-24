import mongoose from 'mongoose';

export interface IAction extends mongoose.Document {
  type: string;
  payload?: any;
  createdBy?: mongoose.Types.ObjectId;
}

const ActionSchema = new mongoose.Schema<IAction>({
  type: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model<IAction>('Action', ActionSchema);

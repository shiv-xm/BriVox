import mongoose from 'mongoose';

export interface IOperationLog extends mongoose.Document {
  action: string;
  details?: any;
  createdBy?: mongoose.Types.ObjectId;
}

const OperationLogSchema = new mongoose.Schema<IOperationLog>({
  action: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model<IOperationLog>('OperationLog', OperationLogSchema);

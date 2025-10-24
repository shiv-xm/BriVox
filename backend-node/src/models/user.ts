import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends mongoose.Document {
  email: string;
  password: string;
  name?: string;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new mongoose.Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String }
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  const user = this as IUser;
  if (!user.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);

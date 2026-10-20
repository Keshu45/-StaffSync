import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'HR' | 'MANAGER' | 'EMPLOYEE';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  employeeId?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: Schema.Types.Mixed },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['HR', 'MANAGER', 'EMPLOYEE'], default: 'EMPLOYEE', required: true },
    employeeId: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Never expose passwordHash in JSON serialization
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as any).passwordHash;
    return ret;
  },
});

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

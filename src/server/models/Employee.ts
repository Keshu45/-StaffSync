import mongoose, { Document, Schema } from 'mongoose';

export type EmploymentStatus = 'Active' | 'On Leave' | 'Terminated' | 'Probation';

export interface IEmployee extends Document {
  employeeId: string;
  userId: mongoose.Types.ObjectId | string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  dateOfJoining: string; // ISO date string YYYY-MM-DD
  employmentStatus: EmploymentStatus;
  managerId?: mongoose.Types.ObjectId | string | null;
  salary?: number;
  address?: string;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    _id: { type: Schema.Types.Mixed },
    employeeId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    userId: { type: Schema.Types.Mixed, ref: 'User', required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    dateOfJoining: { type: String, required: true },
    employmentStatus: { 
      type: String, 
      enum: ['Active', 'On Leave', 'Terminated', 'Probation'], 
      default: 'Active' 
    },
    managerId: { type: Schema.Types.Mixed, ref: 'Employee', default: null },
    salary: { type: Number, default: 0 },
    address: { type: String, default: '' },
    profileImage: { type: String, default: '' },
  },
  { timestamps: true }
);

export const EmployeeModel = mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);

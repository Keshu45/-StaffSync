import mongoose, { Document, Schema } from 'mongoose';

export type LeaveType = 'Casual Leave' | 'Sick Leave' | 'Earned Leave' | 'Unpaid Leave';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface ILeave extends Document {
  employeeId: string;
  employeeName?: string;
  department?: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  numberOfDays: number;
  reason: string;
  status: LeaveStatus;
  reviewedBy?: string | null;
  reviewedByName?: string | null;
  reviewComment?: string | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema = new Schema<ILeave>(
  {
    _id: { type: Schema.Types.Mixed },
    employeeId: { type: String, required: true, ref: 'Employee' },
    employeeName: { type: String },
    department: { type: String },
    leaveType: { 
      type: String, 
      enum: ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Unpaid Leave'], 
      required: true 
    },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    numberOfDays: { type: Number, required: true, min: 1 },
    reason: { type: String, required: true, trim: true },
    status: { 
      type: String, 
      enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], 
      default: 'Pending' 
    },
    reviewedBy: { type: String, default: null },
    reviewedByName: { type: String, default: null },
    reviewComment: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const LeaveModel = mongoose.models.Leave || mongoose.model<ILeave>('Leave', LeaveSchema);

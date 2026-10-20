import mongoose, { Document, Schema } from 'mongoose';

export type AttendanceStatus = 'Present' | 'Absent' | 'Half Day' | 'Leave';

export interface IAttendance extends Document {
  employeeId: string; // Employee ID string (e.g. EMP-1001) or ObjectId
  attendanceDate: string; // YYYY-MM-DD
  checkIn?: string; // ISO timestamp
  checkOut?: string; // ISO timestamp
  status: AttendanceStatus;
  totalWorkingMinutes: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    _id: { type: Schema.Types.Mixed },
    employeeId: { type: String, required: true, ref: 'Employee' },
    attendanceDate: { type: String, required: true }, // Format YYYY-MM-DD
    checkIn: { type: String, default: null },
    checkOut: { type: String, default: null },
    status: { 
      type: String, 
      enum: ['Present', 'Absent', 'Half Day', 'Leave'], 
      default: 'Present' 
    },
    totalWorkingMinutes: { type: Number, default: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

AttendanceSchema.index({ employeeId: 1, attendanceDate: 1 }, { unique: true });

export const AttendanceModel = mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);

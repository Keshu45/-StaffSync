import mongoose, { Document, Schema } from 'mongoose';

export type TrainingStatus = 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled';

export interface ITraining extends Document {
  title: string;
  description: string;
  trainer: string;
  category: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  capacity: number;
  enrolledEmployees: string[]; // List of employeeId strings
  createdBy: string;
  createdByName?: string;
  targetAudience: string;
  status: TrainingStatus;
  locationOrUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TrainingSchema = new Schema<ITraining>(
  {
    _id: { type: Schema.Types.Mixed },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    trainer: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    capacity: { type: Number, required: true, min: 1 },
    enrolledEmployees: [{ type: String }],
    createdBy: { type: String, required: true },
    createdByName: { type: String, default: '' },
    targetAudience: { type: String, default: 'All Departments' },
    status: { 
      type: String, 
      enum: ['Upcoming', 'In Progress', 'Completed', 'Cancelled'], 
      default: 'Upcoming' 
    },
    locationOrUrl: { type: String, default: 'Virtual Conference Room A' },
  },
  { timestamps: true }
);

export const TrainingModel = mongoose.models.Training || mongoose.model<ITraining>('Training', TrainingSchema);

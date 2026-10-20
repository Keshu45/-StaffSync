import mongoose, { Document, Schema } from 'mongoose';

export type AnnouncementAudience = 'All' | 'HR' | 'Managers' | 'Employees';
export type AnnouncementCategory = 'General' | 'Policy' | 'Holiday' | 'Event' | 'Health & Safety';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  category: AnnouncementCategory;
  authorId: string;
  authorName: string;
  audience: AnnouncementAudience;
  publishedAt: Date;
  expiryDate?: string | null;
  isPublished: boolean;
  isArchived: boolean;
  priority: 'Low' | 'Medium' | 'High';
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    _id: { type: Schema.Types.Mixed },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    category: { 
      type: String, 
      enum: ['General', 'Policy', 'Holiday', 'Event', 'Health & Safety'], 
      default: 'General' 
    },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    audience: { 
      type: String, 
      enum: ['All', 'HR', 'Managers', 'Employees'], 
      default: 'All' 
    },
    publishedAt: { type: Date, default: Date.now },
    expiryDate: { type: String, default: null },
    isPublished: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  },
  { timestamps: true }
);

export const AnnouncementModel = mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);

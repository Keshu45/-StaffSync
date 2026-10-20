import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 'Leave' | 'Attendance' | 'Announcement' | 'Training' | 'System' | 'Profile';

export interface INotification extends Document {
  recipientId: string; // userId or employeeId or 'ALL'
  title: string;
  message: string;
  type: NotificationType;
  relatedEntityId?: string;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    _id: { type: Schema.Types.Mixed },
    recipientId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { 
      type: String, 
      enum: ['Leave', 'Attendance', 'Announcement', 'Training', 'System', 'Profile'], 
      default: 'System' 
    },
    relatedEntityId: { type: String, default: null },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const NotificationModel = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

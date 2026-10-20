import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  performedBy: string;
  performedByName: string;
  targetEntity: string;
  targetId?: string;
  details: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    _id: { type: Schema.Types.Mixed },
    action: { type: String, required: true },
    performedBy: { type: String, required: true },
    performedByName: { type: String, required: true },
    targetEntity: { type: String, required: true },
    targetId: { type: String, default: null },
    details: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLogModel = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

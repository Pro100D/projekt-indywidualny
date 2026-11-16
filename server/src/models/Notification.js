import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase', required: true },
    type: { type: String, enum: ['warranty_expiring', 'warranty_expired', 'reminder'], required: true },
    message: { type: String, required: true },
    daysLeft: Number,
    threshold: Number,
    warrantyUntil: Date,
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index(
  { purchaseId: 1, threshold: 1, warrantyUntil: 1 },
  { unique: true, partialFilterExpression: { threshold: { $exists: true } } },
);
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);

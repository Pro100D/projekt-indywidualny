import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase', required: true },
    type: { type: String, enum: ['warranty_expiring', 'warranty_expired', 'reminder'], required: true },
    message: { type: String, required: true },
    daysLeft: Number, // 30, 7, 1 — żeby nie tworzyć tego samego powiadomienia dwa razy
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model('Notification', notificationSchema);

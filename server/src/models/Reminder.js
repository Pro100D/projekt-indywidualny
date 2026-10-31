import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase' },
    type: { type: String, enum: ['service', 'filter', 'insurance', 'other'], default: 'other' },
    title: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    isDone: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model('Reminder', reminderSchema);

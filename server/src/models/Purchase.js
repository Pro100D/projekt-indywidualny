import mongoose from 'mongoose';

// Metadane pliku — sam plik leży w AWS S3
const documentSchema = new mongoose.Schema({
  type: { type: String, enum: ['receipt', 'invoice', 'warranty_card', 'photo', 'other'], default: 'other' },
  fileName: { type: String, required: true },
  s3Key: { type: String, required: true },
  mimeType: String,
  size: Number,
  uploadedAt: { type: Date, default: Date.now },
});

const purchaseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    addressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    purchaseDate: { type: Date, required: true },
    price: { type: Number, min: 0 },
    currency: { type: String, default: 'PLN' },
    store: { type: String, trim: true },
    serialNumber: { type: String, trim: true },
    warrantyUntil: Date,
    notes: String,
    documents: [documentSchema],
  },
  { timestamps: true },
);

purchaseSchema.index({ userId: 1, addressId: 1, purchaseDate: -1 });

export default mongoose.model('Purchase', purchaseSchema);

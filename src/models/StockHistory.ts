import mongoose from 'mongoose';

const StockHistorySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true }, // Cache name for easier display
  sku: { type: String, required: true },
  adminUser: { type: String, required: true }, // Who made the change
  changeAmount: { type: Number, required: true }, // e.g. +10 or -5
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  reason: { type: String, enum: ['Restock', 'Correction', 'Damage', 'Order', 'Return', 'Other'], default: 'Restock' },
  note: { type: String }, // Optional comment
}, { timestamps: true });

export default mongoose.models.StockHistory || mongoose.model('StockHistory', StockHistorySchema);
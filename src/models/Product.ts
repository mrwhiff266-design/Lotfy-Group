import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  sku: { type: String, required: true, unique: true },
  stock: { type: Number, default: 0 },
  category: { type: String },
  collection: { type: String }, // New Collection Field
  imageUrl: { type: String }, // Single main image for now
  features: [{ type: String }], // Array of feature strings
  isVisible: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
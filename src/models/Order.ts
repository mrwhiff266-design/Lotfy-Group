import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  companyName: { type: String },
  email: { type: String }, // Optional now
  phone: { type: String }, // <--- NEW: Stores the phone number
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      sku: String,
      quantity: Number,
      price: Number,
      discountPercent: Number,
      discountAmount: Number,
    }
  ],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], 
    default: 'Pending' 
  },
  // Global Discount / Tax fields
  globalDiscountPercent: { type: Number, default: 0 },
  globalDiscountAmount: { type: Number, default: 0 },
  taxPercent: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
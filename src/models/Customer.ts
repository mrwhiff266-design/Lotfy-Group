import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  companyName: { type: String },
  email: { type: String, required: true, unique: true }, // Email is now required for Login
  password: { type: String, required: true }, // New: For logging in
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'], 
    default: 'Pending' // Everyone starts as Pending
  },
  totalOrders: { type: Number, default: 0 },
}, { timestamps: true, collection: 'customers' });

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
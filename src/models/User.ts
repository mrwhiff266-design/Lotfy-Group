import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true }, // 👈 Fixes the error in image_c1f045.png
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'team', 'warehouse_manager', 'customer'], 
    default: 'customer' 
  },
  approvalStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  warehouseAccess: [{ type: String }], // For the 2-warehouse logic (e.g., ['W1', 'W2'])
}, { 
  timestamps: true,
  collection: 'users' // 👈 FORCES both apps to look at the same "users" table
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
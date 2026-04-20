import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  adminName: { type: String, required: true }, // The "Who"
  action: { type: String, required: true },    // The "What" (Created, Deleted, Updated)
  details: { type: String },                   // Extra info (Order ID, etc.)
  status: { type: String },                    // Success or Failed
}, { timestamps: true }); // Automatically adds "createdAt" (The "When")

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
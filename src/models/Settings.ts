import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  storeName: { type: String, default: 'LotfyGroup AdminPannel' },
  storeLogo: { type: String }, // URL or path to logo image
  logoHeight: { type: Number, default: 40 }, // Logo height in pixels
  address: { type: String, default: 'Cairo, Egypt' },
  taxId: { type: String, default: '123-456-789' },
  phone: { type: String },
  email: { type: String },
  favicon: { type: String },
  primaryColor: { type: String, default: '#000000' },
  secondaryColor: { type: String, default: '#ffffff' },
}, { timestamps: true });

// Singleton pattern: We really only need one settings doc
export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

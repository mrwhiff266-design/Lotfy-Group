import mongoose from 'mongoose';

const PermissionSchema = new mongoose.Schema({
  view: { type: Boolean, default: false },
  create: { type: Boolean, default: false },
  edit: { type: Boolean, default: false },
  delete: { type: Boolean, default: false },
}, { _id: false });

const AdminUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  name: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['SuperAdmin', 'Custom'], // Simplified: Either God Mode or Custom Checkboxes
    default: 'Custom' 
  },
  permissions: {
    dashboard: { type: Boolean, default: true }, // Dashboard is special, usually just view access
    products: { type: PermissionSchema, default: () => ({}) },
    inventory: { type: PermissionSchema, default: () => ({}) }, // New Inventory Module
    orders: { type: PermissionSchema, default: () => ({}) },
    customers: { type: PermissionSchema, default: () => ({}) },
    team: { type: PermissionSchema, default: () => ({}) },
    settings: { type: PermissionSchema, default: () => ({}) },
  },
  active: { type: Boolean, default: true },
}, { timestamps: true, collection: 'adminusers' });

export default mongoose.models.AdminUser || mongoose.model('AdminUser', AdminUserSchema);
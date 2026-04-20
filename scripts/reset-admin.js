const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' }); // Load .env.local

// Define Schema Inline (since importing TS model is tricky in plain JS script)
const AdminUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  name: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['SuperAdmin', 'Manager', 'Editor', 'Viewer'], 
    default: 'Viewer' 
  },
  active: { type: Boolean, default: true },
}, { timestamps: true });

// Prevent error if model already exists
const AdminUser = mongoose.models.AdminUser || mongoose.model('AdminUser', AdminUserSchema);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-ecommerce';

const resetAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB:', MONGODB_URI);

    // 1. Delete ALL existing admins (Start Fresh)
    const result = await AdminUser.deleteMany({});
    console.log(`Deleted ${result.deletedCount} old admin users.`);

    // 2. Create the NEW Master Admin
    await AdminUser.create({
      username: 'admin',
      password: 'password123', // This is the one you want
      name: 'Super Admin',
      role: 'SuperAdmin',
      active: true
    });

    console.log('✅ SUCCESS: All old admins deleted.');
    console.log('✅ SUCCESS: New Super Admin created.');
    console.log('👉 Login: admin / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error resetting admin:', error);
    process.exit(1);
  }
};

resetAdmin();
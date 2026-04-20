const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcryptjs');

// Define Schema Inline
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

const AdminUser = mongoose.models.AdminUser || mongoose.model('AdminUser', AdminUserSchema);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-ecommerce';

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB:', MONGODB_URI);

    const hashedPassword = await bcrypt.hash('password123', 10);
    
    let adminUser = await AdminUser.findOne({ username: 'admin' });
    
    if (adminUser) {
      console.log('Admin exists. Updating password...');
      adminUser.password = hashedPassword;
      await adminUser.save();
      console.log('Admin password reset to: password123');
    } else {
      await AdminUser.create({
        username: 'admin',
        password: hashedPassword,
        name: 'Super Admin',
        role: 'SuperAdmin',
        active: true
      });
      console.log('Super Admin created. Login: admin / password123');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seed();
import mongoose from 'mongoose';
import AdminUser from '../src/models/AdminUser';
import connectDB from '../src/lib/db';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' }); // Load .env.local

const seed = async () => {
  await connectDB();
  
  try {
    const admin = await AdminUser.findOne({ username: 'admin' });
    if (admin) {
      console.log('Admin already exists');
      process.exit(0);
    }

    await AdminUser.create({
      username: 'admin',
      password: 'password123',
      name: 'Super Admin',
      role: 'SuperAdmin',
      active: true
    });

    console.log('Super Admin created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seed();
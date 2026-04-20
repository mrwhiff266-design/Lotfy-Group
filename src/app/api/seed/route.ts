import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import AdminUser from '@/models/AdminUser';

export async function GET() {
  await connectDB();
  
  try {
    const adminExists = await AdminUser.findOne({ username: 'admin' });
    if (adminExists) {
      return NextResponse.json({ message: 'Admin already exists' });
    }

    await AdminUser.create({
      username: 'admin',
      password: 'password123', // Change this immediately!
      name: 'Super Admin',
      role: 'SuperAdmin',
      active: true
    });

    return NextResponse.json({ message: 'Super Admin created. Login with admin / password123' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to seed admin' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import AdminUser from '@/models/AdminUser';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const conn = await connectDB();
    console.log('[Setup] Connected to database:', conn.connection.name);
    console.log('[Setup] DB Host:', conn.connection.host);
    
    // Delete existing admin if present (to recreate)
    const deleted = await AdminUser.deleteMany({ username: 'admin' });
    console.log('[Setup] Deleted existing admin users:', deleted.deletedCount);

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('[Setup] Password hashed');

    // Create the First Master Admin
    const masterAdmin = await AdminUser.create({
      username: 'admin',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SuperAdmin',
      active: true
    });

    console.log('[Setup] Admin created:', masterAdmin.username, 'in database:', conn.connection.name);

    return NextResponse.json({ 
      message: "Master Admin Created!", 
      user: masterAdmin.username,
      database: conn.connection.name,
      host: conn.connection.host
    });
  } catch (error) {
    console.error("[Setup Error]:", error);
    return NextResponse.json({ error: "Setup failed", details: String(error) }, { status: 500 });
  }
}
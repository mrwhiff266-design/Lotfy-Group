import { NextResponse } from 'next/server';
import AdminUser from '@/models/AdminUser';
import connectDB from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  await connectDB();
  try {
    const users = await AdminUser.find({}).select('-password').sort({ createdAt: -1 });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connectDB();
  try {
    const body = await req.json();
    const { username, password, name, role, permissions } = body;

    // Basic validation
    if (!username || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await AdminUser.create({ 
      username, 
      password: hashedPassword, 
      name, 
      role,
      permissions // Save the custom permissions object
    });
    
    // Don't return password
    const userObj = newUser.toObject();
    delete userObj.password;

    return NextResponse.json(userObj, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
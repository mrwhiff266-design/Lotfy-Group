import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import AdminUser from '@/models/AdminUser';

export async function GET() {
  await connectDB();
  // Don't send passwords back!
  const users = await AdminUser.find({}).select('-password'); 
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  await connectDB();
  const body = await request.json();

  const newUser = await AdminUser.create({
    name: body.name,
    username: body.username,
    password: body.password, // Ideally hash this
    permissions: body.permissions,
    isSuperAdmin: false // Only you are Super Admin
  });

  return NextResponse.json(newUser);
}

export async function DELETE(request: Request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  // Prevent deleting Super Admin
  const user = await AdminUser.findById(id);
  if (user.isSuperAdmin) {
    return NextResponse.json({ error: "Cannot delete Super Admin" }, { status: 403 });
  }

  await AdminUser.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
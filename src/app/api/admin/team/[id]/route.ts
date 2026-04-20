import { NextResponse } from 'next/server';
import AdminUser from '@/models/AdminUser';
import connectDB from '@/lib/db';
import bcrypt from 'bcryptjs';

type Props = {
  params: Promise<{ id: string }>;
};

export async function DELETE(req: Request, props: Props) {
  await connectDB();
  try {
    const params = await props.params;
    const { id } = params;
    
    // Prevent deleting the last SuperAdmin
    const userToDelete = await AdminUser.findById(id);
    const superAdminCount = await AdminUser.countDocuments({ role: 'SuperAdmin' });

    if (userToDelete?.role === 'SuperAdmin' && superAdminCount <= 1) {
      return NextResponse.json({ error: 'Cannot delete the last SuperAdmin' }, { status: 400 });
    }

    await AdminUser.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

export async function PUT(req: Request, props: Props) {
  await connectDB();
  try {
    const params = await props.params;
    const { id } = params;
    const body = await req.json(); 

    // Prevent demoting the last SuperAdmin
    if (body.role && body.role !== 'SuperAdmin') {
       const user = await AdminUser.findById(id);
       const count = await AdminUser.countDocuments({ role: 'SuperAdmin' });
       if (user?.role === 'SuperAdmin' && count <= 1) {
         return NextResponse.json({ error: 'Cannot demote the last SuperAdmin' }, { status: 400 });
       }
    }

    // If password is provided, hash it
    if (body.password) {
      body.password = await bcrypt.hash(body.password, 10);
    } else {
      delete body.password;
    }

    const updatedUser = await AdminUser.findByIdAndUpdate(id, body, { new: true }).select('-password');
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
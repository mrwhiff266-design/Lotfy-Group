import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Customer from '@/models/Customer';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    
    // Check duplicates
    const existing = await Customer.findOne({ 
      $or: [
        { email: body.email }, 
        { phone: body.phone }
      ] 
    });
    
    if (existing) {
      // If found, return exactly WHICH one matched for better debugging
      const matchType = existing.email === body.email ? 'Email' : 'Phone';
      return NextResponse.json({ 
        error: `Customer with this ${matchType} already exists.`,
        details: existing
      }, { status: 400 });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(body.password, 10);

    const newCustomer = await Customer.create({
      ...body,
      password: hashedPassword,
      status: 'Approved' 
    });

    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error) {
    console.error("Create Customer Error:", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
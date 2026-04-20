import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Customer from '@/models/Customer';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { customers } = await req.json();

    if (!Array.isArray(customers) || customers.length === 0) {
      return NextResponse.json({ success: 0, errors: ["No data found"] });
    }

    let success = 0;
    const errors: string[] = [];

    for (const row of customers) {
      try {
        if (!row.name || !row.phone || !row.email) {
          throw new Error(`Row missing Name, Phone, or Email (${row.name || 'Unknown'})`);
        }

        // Check duplicates (Phone OR Email)
        const existing = await Customer.findOne({ 
          $or: [{ phone: row.phone }, { email: row.email }] 
        });
        
        if (existing) {
          throw new Error(`Customer already exists (Phone: ${row.phone})`);
        }

        await Customer.create({
          name: row.name,
          email: row.email,
          phone: row.phone,
          companyName: row.companyName || '',
          password: 'password123', // Default password for bulk import (User must change it)
          status: row.status || 'Approved', // Auto-approve imported users by default
        });

        success++;
      } catch (err: any) {
        errors.push(err.message);
      }
    }

    return NextResponse.json({ success, errors });

  } catch (error) {
    return NextResponse.json({ success: 0, errors: ["Server Error"] }, { status: 500 });
  }
}
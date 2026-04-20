import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Customer from '@/models/Customer';

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, props: Props) {
  await connectDB();
  try {
    const params = await props.params;
    const { id } = params;
    const customer = await Customer.findById(id);

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

export async function PUT(req: Request, props: Props) {
  await connectDB();
  try {
    const params = await props.params;
    const { id } = params;
    const { status } = await req.json(); 
    
    const customer = await Customer.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    );

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch {
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: Props) {
  await connectDB();
  try {
    const params = await props.params;
    const { id } = params;
    await Customer.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';

// In Next.js 15+, params is a Promise
type Props = {
  params: Promise<{ id: string }>;
};

// Get Single Product
export async function GET(req: Request, props: Props) {
  await connectDB();
  try {
    const params = await props.params; // Await params!
    const { id } = params;
    
    if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

// Update Single Product
export async function PUT(req: Request, props: Props) {
  await connectDB();
  try {
    const params = await props.params; // Await params!
    const { id } = params;
    
    const body = await req.json();
    
    const product = await Product.findByIdAndUpdate(id, body, { new: true });
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// Delete Single Product
export async function DELETE(req: Request, props: Props) {
  await connectDB();
  try {
    const params = await props.params; // Await params!
    const { id } = params;
    
    await Product.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
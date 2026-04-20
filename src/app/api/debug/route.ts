import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';

export async function GET() {
  try {
    await connectDB();

    // 1. Find a product to put in the order (so it looks real)
    const product = await Product.findOne();

    if (!product) {
      return NextResponse.json({ error: "Please create at least one product first!" }, { status: 400 });
    }

    // 2. Create a Fake B2B Order
    const newOrder = await Order.create({
      customerName: "Ahmed Mohamed",
      companyName: "Tech Solutions Egypt", // B2B Company
      email: "ahmed@tech-eg.com",
      products: [
        {
          productId: product._id,
          name: product.name,
          quantity: 10, // Buying in bulk
          price: product.price,
        }
      ],
      totalAmount: product.price * 10,
      status: "Processing",
    });

    return NextResponse.json({ message: "✅ Test Order Created!", order: newOrder });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create order", details: error }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import StockHistory from '@/models/StockHistory';

export async function GET() {
  await connectDB();
  try {
    const products = await Product.find({}, 'name sku stock price imageUrl').sort({ name: 1 });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connectDB();
  try {
    const { productId, changeAmount, reason, adminUser, note } = await req.json();

    if (!productId || changeAmount === undefined || !adminUser) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const product = await Product.findById(productId);
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const previousStock = product.stock;
    const newStock = previousStock + Number(changeAmount);

    if (newStock < 0) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
    }

    // 1. Update Product
    product.stock = newStock;
    await product.save();

    // 2. Create History Log
    await StockHistory.create({
      productId,
      productName: product.name,
      sku: product.sku,
      adminUser,
      changeAmount,
      previousStock,
      newStock,
      reason,
      note
    });

    return NextResponse.json({ 
      success: true, 
      newStock,
      message: `Stock updated for ${product.name}` 
    });

  } catch (error) {
    console.error("Inventory Error:", error);
    return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 });
  }
}
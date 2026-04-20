import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    console.log("📝 Attempting to create product:", body.name);

    if (!body.name || !body.price || !body.sku) {
      return NextResponse.json(
        { error: "Missing required fields (Name, Price, or SKU)" },
        { status: 400 }
      );
    }

    const newProduct = await Product.create(body);
    
    console.log("✅ Product Created Successfully!");
    return NextResponse.json(newProduct, { status: 201 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('❌ Error creating product:', error); // Using 'error' fixes the unused var warning

    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A product with this SKU already exists." }, 
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Server Error" }, 
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await connectDB();
    
    // Parse Query Params
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');
    const limit = parseInt(searchParams.get('limit') || '0');

    console.log(`🔍 API Product Fetch: collection='${collection}', limit=${limit}`);

    // Build Filter
    const filter: any = {};
    if (collection && collection !== 'all') {
      filter.collection = collection;
    }
    
    console.log("🔍 Mongo Filter:", JSON.stringify(filter));

    // Execute Query
    let query = Product.find(filter).sort({ createdAt: -1 });
    
    if (limit > 0) {
      query = query.limit(limit);
    }

    const products = await query;
    return NextResponse.json(products);
  } catch (error) {
    console.error("Fetch Error:", error); 
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
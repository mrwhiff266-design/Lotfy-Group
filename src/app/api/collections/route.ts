import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Collection from '@/models/Collection';

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Collection Name is required" },
        { status: 400 }
      );
    }

    // Auto-generate slug if missing
    if (!body.slug) {
      body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const newCollection = await Collection.create(body);
    return NextResponse.json(newCollection, { status: 201 });

  } catch (error: any) {
    console.error('Create Collection Error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: "Collection name/slug already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const collections = await Collection.find({}).sort({ createdAt: -1 });
    return NextResponse.json(collections);
  } catch (error) {
    console.error("Fetch Collections Error:", error);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}

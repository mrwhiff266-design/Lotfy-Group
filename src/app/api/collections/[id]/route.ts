import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Collection from '@/models/Collection';

type Props = {
  params: Promise<{ id: string }>;
};

// GET Single Collection (Optional, but good to have)
export async function GET(req: Request, props: Props) {
  await connectDB();
  try {
    const params = await props.params;
    const { id } = params;
    
    if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const collection = await Collection.findById(id);
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }
    return NextResponse.json(collection);
  } catch (error) {
    console.error("GET Collection Error:", error);
    return NextResponse.json({ error: 'Failed to fetch collection' }, { status: 500 });
  }
}

// UPDATE Collection (PUT)
export async function PUT(req: Request, props: Props) {
  await connectDB();
  try {
    const params = await props.params;
    const { id } = params;
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json({ error: "Collection Name is required" }, { status: 400 });
    }

    // Update slug if name changes (optional, but good practice)
    if (body.name && !body.slug) {
        body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const updatedCollection = await Collection.findByIdAndUpdate(id, body, { new: true });

    if (!updatedCollection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    return NextResponse.json(updatedCollection);
  } catch (error: any) {
    console.error("Update Collection Error:", error);
    if (error.code === 11000) {
        return NextResponse.json({ error: "Collection name/slug already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// DELETE Collection
export async function DELETE(req: Request, props: Props) {
  await connectDB();
  try {
    const params = await props.params;
    const { id } = params;
    
    const deleted = await Collection.findByIdAndDelete(id);
    
    if (!deleted) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Collection Error:", error);
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 });
  }
}

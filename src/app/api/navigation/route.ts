import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Menu from '@/models/Menu';

export async function GET() {
  try {
    await connectDB();
    const menus = await Menu.find({});
    return NextResponse.json(menus);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch menus' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    // Auto-generate handle if missing
    if (!body.handle && body.title) {
        body.handle = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    if (!body.title || !body.handle) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const newMenu = await Menu.create(body);
    return NextResponse.json(newMenu, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
        return NextResponse.json({ error: "Handle already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create menu' }, { status: 500 });
  }
}

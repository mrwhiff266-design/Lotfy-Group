import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Menu from '@/models/Menu';

type Props = { params: Promise<{ id: string }> };

export async function GET(req: Request, props: Props) {
  try {
    await connectDB();
    const params = await props.params;
    const menu = await Menu.findById(params.id);
    if (!menu) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(menu);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(req: Request, props: Props) {
  try {
    await connectDB();
    const params = await props.params;
    const body = await req.json();
    
    // We update the whole menu structure (title, items)
    const updated = await Menu.findByIdAndUpdate(params.id, body, { new: true });
    
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: Props) {
  try {
    await connectDB();
    const params = await props.params;
    await Menu.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

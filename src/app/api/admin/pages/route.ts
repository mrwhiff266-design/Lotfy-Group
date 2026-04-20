import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Page from '@/models/Page';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const conn = await connectDB();
  console.log('[GET pages] Database:', conn.connection.name);
  try {
    const pages = await Page.find({}).sort({ title: 1 });
    console.log('[GET pages] count', pages.length, 'DB:', conn.connection.name);
    return NextResponse.json(pages);
  } catch (error) {
    console.error('[GET pages] error', error);
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const conn = await connectDB();
  console.log('[POST] Creating page in database:', conn.connection.name);
  try {
    const body = await req.json();
    console.log('[POST] Creating page:', body.title, body.slug);
    const newPage = await Page.create(body);
    console.log('[POST] Page created with ID:', newPage._id, 'in DB:', conn.connection.name);
    return NextResponse.json(newPage, { status: 201 });
  } catch (error: any) {
    console.error('[POST] Create page error:', error);
    if (error.code === 11000) return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 });
  }
}
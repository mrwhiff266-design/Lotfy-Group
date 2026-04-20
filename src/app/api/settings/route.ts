import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Settings from '@/models/Settings';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  await connectDB();
  try {
    // Find the first (and usually only) settings document
    let settings = await Settings.findOne();
    
    // If none exists, return defaults (or create one)
    if (!settings) {
      settings = await Settings.create({});
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  await connectDB();
  try {
    const body = await req.json();
    // Coerce numeric fields
    if (body.logoHeight !== undefined) {
      const n = Number(body.logoHeight);
      body.logoHeight = Number.isFinite(n) ? n : 40;
    }
    
    // Update the first found document, or create if missing (upsert logic basically)
    const settings = await Settings.findOneAndUpdate({}, body, { 
      new: true, 
      upsert: true, // Create if not exists
      setDefaultsOnInsert: true 
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings Update Error:", error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
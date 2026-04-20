import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import AuditLog from '@/models/AuditLog';

export async function GET() {
  try {
    await connectDB();
    // Fetch logs, newest first, limit to last 100 entries
    const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(100);
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
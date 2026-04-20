import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import StockHistory from '@/models/StockHistory';

export async function GET() {
  await connectDB();
  try {
    const history = await StockHistory.find({})
      .sort({ createdAt: -1 })
      .limit(20);

    return NextResponse.json(history);
  } catch (error) {
    console.error('Inventory history error:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory history' }, { status: 500 });
  }
}

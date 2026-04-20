import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Customer from '@/models/Customer';

export async function GET(req: Request) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('status'); // e.g. ?status=Pending
    const searchQuery = searchParams.get('query')?.trim();

    const query: {
      status?: string;
      $or?: Array<Record<string, { $regex: string; $options: string }>>;
    } = {};

    if (filter && filter !== 'All') {
      query.status = filter;
    }

    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { phone: { $regex: searchQuery, $options: 'i' } },
        { companyName: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    const customers = await Customer.find(query)
      .select('name phone companyName email status totalOrders createdAt')
      .sort({ createdAt: -1 })
      .limit(searchQuery ? 10 : 200);
    return NextResponse.json(customers);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

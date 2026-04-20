import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import AuditLog from '@/models/AuditLog';
import Customer from '@/models/Customer';

interface OrderProductInput {
  productId?: string;
  name?: string;
  sku?: string;
  quantity?: number | string;
  price?: number | string;
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.customerName || !body.products) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const safeProducts = body.products
      .filter((p: OrderProductInput) => p && p.productId && Number(p.quantity) > 0)
      .map((p: OrderProductInput) => ({
        productId: (p.productId && p.productId.length === 24) ? p.productId : null,
        name: p.name || "Unknown",
        sku: p.sku || "N/A",
        quantity: Number(p.quantity) || 1,
        price: Number(p.price) || 0,
        discountPercent: 0,
        discountAmount: 0
      }));

    if (safeProducts.length === 0) {
      return NextResponse.json({ error: "Please add at least one valid product." }, { status: 400 });
    }

    const newOrder = await Order.create({
      customerName: body.customerName,
      companyName: body.companyName || "",
      phone: body.phone || "",
      products: safeProducts,
      totalAmount: body.totalAmount,
      status: "Pending",
    });

    await Customer.findOneAndUpdate(
      {
        $or: [
          { phone: body.phone || '__none__' },
          { name: body.customerName, companyName: body.companyName || '' },
        ],
      },
      { $inc: { totalOrders: 1 } }
    );

    // Logging
    const adminWhoDidThis = body.adminUser || "Unknown System User";
    
    try {
      await AuditLog.create({
        adminName: adminWhoDidThis,
        action: "Created Order",
        details: `Created Order #${newOrder._id} for ${body.customerName} (Total: ${body.totalAmount})`,
        status: "Success"
      });
    } catch (logError) {
      console.error("Failed to save log:", logError);
    }

    return NextResponse.json(newOrder, { status: 201 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  await connectDB();
  const orders = await Order.find({}).sort({ createdAt: -1 });
  return NextResponse.json(orders);
}

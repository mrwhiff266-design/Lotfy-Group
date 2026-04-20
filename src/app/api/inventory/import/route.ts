import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import StockHistory from '@/models/StockHistory';

const allowedReasons = new Set(['Restock', 'Correction', 'Damage', 'Order', 'Return', 'Other']);

export async function POST(req: Request) {
  try {
    await connectDB();
    const { rows, adminUser } = await req.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: 0, updated: 0, unchanged: 0, errors: ['No inventory data found in file.'] });
    }

    let updated = 0;
    let unchanged = 0;
    const errors: string[] = [];

    for (const [index, row] of rows.entries()) {
      try {
        const sku = String(row.sku ?? row.SKU ?? '').trim();
        const rawQuantity = row.quantity ?? row.qty ?? row.stock ?? row.Quantity ?? row.Qty ?? row.Stock;
        const parsedQuantity = Number(rawQuantity);

        if (!sku) {
          throw new Error(`Row ${index + 2}: missing SKU.`);
        }

        if (rawQuantity === undefined || rawQuantity === null || rawQuantity === '' || Number.isNaN(parsedQuantity)) {
          throw new Error(`Row ${index + 2}: invalid quantity for SKU ${sku}.`);
        }

        if (parsedQuantity < 0) {
          throw new Error(`Row ${index + 2}: quantity cannot be negative for SKU ${sku}.`);
        }

        const product = await Product.findOne({ sku });
        if (!product) {
          throw new Error(`Row ${index + 2}: product not found for SKU ${sku}.`);
        }

        const previousStock = Number(product.stock) || 0;
        const newStock = parsedQuantity;

        if (previousStock === newStock) {
          unchanged++;
          continue;
        }

        product.stock = newStock;
        await product.save();

        const requestedReason = String(row.reason ?? '').trim();
        const reason = allowedReasons.has(requestedReason) ? requestedReason : 'Correction';

        await StockHistory.create({
          productId: product._id,
          productName: product.name,
          sku: product.sku,
          adminUser: adminUser || 'Bulk Import',
          changeAmount: newStock - previousStock,
          previousStock,
          newStock,
          reason,
          note: String(row.note ?? 'Bulk inventory import').trim() || 'Bulk inventory import',
        });

        updated++;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Unknown inventory import error.');
      }
    }

    return NextResponse.json({
      success: updated + unchanged,
      updated,
      unchanged,
      errors,
    });
  } catch (error) {
    console.error('Inventory import error:', error);
    return NextResponse.json(
      { success: 0, updated: 0, unchanged: 0, errors: ['Server crashed during inventory import.'] },
      { status: 500 }
    );
  }
}

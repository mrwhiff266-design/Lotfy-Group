import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { products } = await req.json();

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ success: 0, errors: ["No product data found in CSV."] });
    }

    let createdCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    // Process each row
    for (const row of products) {
      try {
        // Validation: Ensure mandatory fields exist
        if (!row.name || !row.sku || !row.price) {
          throw new Error(`Row missing Name, SKU, or Price. (Data: ${JSON.stringify(row)})`);
        }

        // Collect Features dynamically (feature1, feature2, etc.)
        const features: string[] = [];
        Object.keys(row).forEach(key => {
          if (key.toLowerCase().startsWith('feature') && row[key]) {
            features.push(row[key].trim());
          }
        });

        // Check if SKU exists
        const existing = await Product.findOne({ sku: row.sku });
        
        if (existing) {
          // UPDATE Existing Product
          existing.name = row.name;
          existing.price = Number(row.price);
          // Only update stock/category/etc if provided in CSV (or overwrite? usually overwrite for bulk edit)
          if (row.stock !== undefined && row.stock !== '') existing.stock = Number(row.stock);
          if (row.category !== undefined) existing.category = row.category;
          if (row.description !== undefined) existing.description = row.description;
          if (row.imageUrl !== undefined) existing.imageUrl = row.imageUrl;
          
          // If features are provided in CSV, overwrite them. If columns are missing, maybe keep old? 
          // Usually bulk edit implies "state of CSV is truth". 
          // If features array has items, update it.
          if (features.length > 0) {
             existing.features = features;
          }

          await existing.save();
          updatedCount++;
        } else {
          // CREATE New Product
          await Product.create({
            name: row.name,
            sku: row.sku,
            price: Number(row.price),
            stock: Number(row.stock) || 0,
            category: row.category || '',
            description: row.description || '',
            imageUrl: row.imageUrl || '',
            features: features,
          });
          createdCount++;
        }

      } catch (err: any) {
        // Collect errors but don't stop the whole process
        errors.push(err.message || "Unknown error");
      }
    }

    return NextResponse.json({ 
      success: createdCount + updatedCount, 
      created: createdCount, 
      updated: updatedCount, 
      errors 
    });

  } catch (error) {
    console.error("Bulk Import Error:", error);
    return NextResponse.json({ success: 0, errors: ["Server crashed during import."] }, { status: 500 });
  }
}
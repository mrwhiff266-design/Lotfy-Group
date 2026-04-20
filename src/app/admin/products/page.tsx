import React from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Package, Edit } from "lucide-react";
import DeleteProductButton from "@/components/admin/DeleteProductButton";
import ImportProductsButton from "@/components/admin/ImportProductsButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import connectDB from "@/lib/db";
import Product from "@/models/Product";

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  await connectDB();
  const products = await Product.find({}).sort({ createdAt: -1 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Products</h1>
        <div className="flex flex-wrap gap-2">
          {/* Import Button */}
          <ImportProductsButton />
          
          <Link href="/admin/products/new">
            <Button className="bg-slate-900 text-white hover:bg-slate-800">
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-md border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Price (EGP)</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                  No products found. Click &quot;Add Product&quot; to create one.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="h-10 w-10 object-cover rounded-md border" 
                      />
                    ) : (
                      <div className="h-10 w-10 bg-slate-100 rounded-md flex items-center justify-center border">
                        <Package className="h-4 w-4 text-slate-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {product.name}
                    {product.features && product.features.length > 0 && (
                      <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[200px]">
                        {product.features.join(' • ')}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>
                    <span className={product.stock < 10 ? "text-red-600 font-bold" : "text-slate-600"}>
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {product.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {/* EDIT BUTTON */}
                    <Link href={`/admin/products/${product._id}`}>
                      <Button variant="ghost" size="icon" className="hover:bg-blue-50 text-blue-600">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    {/* DELETE BUTTON */}
                    <DeleteProductButton id={product._id.toString()} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
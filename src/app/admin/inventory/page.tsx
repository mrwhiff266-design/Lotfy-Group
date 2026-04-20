"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Fixed missing import
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Minus, Search, AlertTriangle } from "lucide-react";
import { usePermission } from '@/lib/permissions';
import InventoryImportButton from '@/components/admin/InventoryImportButton';

interface Product {
  _id: string;
  name: string;
  sku: string;
  stock: number;
}

interface StockActivity {
  _id: string;
  productName: string;
  sku: string;
  adminUser: string;
  changeAmount: number;
  previousStock: number;
  newStock: number;
  reason: string;
  createdAt: string;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [recentActivity, setRecentActivity] = useState<StockActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal State
  const [adjustItem, setAdjustItem] = useState<Product | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState("Restock");
  const [processing, setProcessing] = useState(false);

  // Permissions
  const canView = usePermission('inventory', 'view');
  const canEdit = usePermission('inventory', 'edit');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const [inventoryRes, historyRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/inventory/history'),
      ]);

      const inventoryData = await inventoryRes.json();
      const historyData = await historyRes.json();
      setProducts(inventoryData);
      setRecentActivity(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem || adjustAmount === 0) return;
    
    setProcessing(true);
    const adminUser = localStorage.getItem('adminUser') || 'Unknown';

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: adjustItem._id,
          changeAmount: adjustAmount,
          reason: adjustReason,
          adminUser
        }),
      });

      if (res.ok) {
        await fetchInventory(); // Refresh
        setAdjustItem(null); // Close modal
        setAdjustAmount(0);
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch {
      alert("Network Error");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Inventory...</div>;
  if (!canView) return <div className="p-10 text-center text-red-500">Access Denied</div>;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );
  const lowStockProducts = products.filter((product) => product.stock <= 5);
  const outOfStockProducts = products.filter((product) => product.stock <= 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inventory</h1>
        <div className="flex items-center gap-3">
          {canEdit && <InventoryImportButton products={products} onComplete={fetchInventory} />}
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search products..." 
              className="pl-8" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-slate-500 uppercase">Products Tracked</CardTitle></CardHeader>
          <div className="px-6 pb-6 text-3xl font-black text-slate-900">{products.length}</div>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-red-600 uppercase">Low Stock</CardTitle></CardHeader>
          <div className="px-6 pb-6 text-3xl font-black text-red-700">{lowStockProducts.length}</div>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-slate-500 uppercase">Out of Stock</CardTitle></CardHeader>
          <div className="px-6 pb-6 text-3xl font-black text-slate-900">{outOfStockProducts.length}</div>
        </Card>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-center">Stock Level</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product._id}>
                <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-center">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
                    ${product.stock <= 5 
                      ? 'bg-red-50 text-red-700 border-red-200' 
                      : product.stock <= 20 
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
                        : 'bg-green-50 text-green-700 border-green-200'}
                  `}>
                    {product.stock <= 5 && <AlertTriangle className="h-3 w-3" />}
                    {product.stock} Units
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {canEdit && (
                    <Button variant="outline" size="sm" onClick={() => setAdjustItem(product)}>
                      Adjust Stock
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Stock Activity</CardTitle>
        </CardHeader>
        <div className="px-6 pb-6">
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500">No stock activity recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <div key={item._id} className="rounded-lg border px-4 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{item.productName}</p>
                    <p className="text-xs text-slate-500">{item.sku} • {item.reason} • {item.adminUser}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${item.changeAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.changeAmount >= 0 ? '+' : ''}{item.changeAmount}
                    </p>
                    <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* ADJUSTMENT MODAL */}
      {adjustItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <CardHeader>
              <CardTitle>Adjust Stock: {adjustItem.name}</CardTitle>
            </CardHeader>
            <div className="p-6 pt-0 space-y-4">
              <div className="flex gap-4 items-center justify-center p-4 bg-slate-50 rounded-lg">
                <div className="text-center">
                  <div className="text-xs text-slate-500 uppercase">Current</div>
                  <div className="text-2xl font-bold">{adjustItem.stock}</div>
                </div>
                <div className="text-slate-300">→</div>
                <div className="text-center">
                  <div className="text-xs text-slate-500 uppercase">New</div>
                  <div className={`text-2xl font-bold ${adjustItem.stock + adjustAmount < 0 ? 'text-red-500' : 'text-blue-600'}`}>
                    {adjustItem.stock + adjustAmount}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Adjustment Amount</Label>
                <div className="flex gap-2">
                  <Button 
                    type="button" variant="outline" size="icon" 
                    onClick={() => setAdjustAmount(prev => prev - 1)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input 
                    type="number" 
                    className="text-center font-mono font-bold"
                    value={adjustAmount} 
                    onChange={(e) => setAdjustAmount(Number(e.target.value))} 
                  />
                  <Button 
                    type="button" variant="outline" size="icon" 
                    onClick={() => setAdjustAmount(prev => prev + 1)}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500 text-center">Use negative numbers to remove stock.</p>
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                >
                  <option value="Restock">Restock (Purchase)</option>
                  <option value="Correction">Inventory Count Correction</option>
                  <option value="Damage">Damaged / Expired</option>
                  <option value="Return">Customer Return</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => { setAdjustItem(null); setAdjustAmount(0); }}>
                  Cancel
                </Button>
                <Button onClick={handleAdjustSubmit} disabled={processing || adjustAmount === 0} className="flex-1 bg-slate-900 text-white hover:bg-slate-800">
                  {processing ? "Saving..." : "Update Stock"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

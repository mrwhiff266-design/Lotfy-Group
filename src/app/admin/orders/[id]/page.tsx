"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Printer, ArrowLeft, Loader2, Phone, Trash2 } from "lucide-react";
import Link from 'next/link';

// --- Types ---
interface OrderItem {
  _id?: string;
  name: string;
  sku?: string;
  quantity: number;
  price: number;
  discountPercent: number; 
  discountAmount: number; 
}

interface OrderData {
  _id: string;
  customerName: string;
  companyName: string;
  phone?: string;
  createdAt: string;
  products: OrderItem[];
  subtotal: number;
  globalDiscountPercent: number;
  globalDiscountAmount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
}

interface StoreSettings {
  storeName?: string;
  storeLogo?: string;
  logoHeight?: number;
  address?: string;
  taxId?: string;
  phone?: string;
  email?: string;
}

interface AvailableProduct {
  _id: string;
  name: string;
  sku: string;
  price: number;
}

interface ApiOrderProduct {
  _id?: string;
  name?: string;
  sku?: string;
  quantity?: number;
  price?: number;
  discountPercent?: number;
  discountAmount?: number;
}

interface ApiOrderResponse {
  _id: string;
  customerName: string;
  companyName: string;
  phone?: string;
  createdAt: string;
  products: ApiOrderProduct[];
  globalDiscountPercent?: number;
  globalDiscountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  status?: string;
}

type PrintMode = 'full' | 'qty';

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  
  const [order, setOrder] = useState<OrderData | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [printMode, setPrintMode] = useState<PrintMode>('full');
  const [printTitle, setPrintTitle] = useState('invoice');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // --- New Product State ---
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showProductResults, setShowProductResults] = useState(false);

  // --- Calculation Engine ---
  const recalculateOrder = useCallback((currentOrder: OrderData) => {
    const newSubtotal = currentOrder.products.reduce((sum, item) => {
      const gross = item.price * item.quantity;
      return sum + Math.max(0, gross - item.discountAmount);
    }, 0);

    const netAfterGlobalDiscount = Math.max(0, newSubtotal - Math.abs(currentOrder.globalDiscountAmount));
    const newTaxAmount = (netAfterGlobalDiscount * Math.abs(currentOrder.taxPercent)) / 100;
    const newTotal = netAfterGlobalDiscount + newTaxAmount;

    return { ...currentOrder, subtotal: newSubtotal, taxAmount: newTaxAmount, totalAmount: newTotal };
  }, []);

  const calculateRowTotal = (item: OrderItem) => {
    const gross = item.price * item.quantity;
    return Math.max(0, gross - item.discountAmount);
  };

  // --- Handlers ---
  const handleRowChange = (index: number, field: string, value: number) => {
    if (!order) return;
    const cleanValue = Math.abs(value); 
    const updatedProducts = [...order.products];
    const item = { ...updatedProducts[index] };

    if (field === 'quantity') item.quantity = cleanValue;
    if (field === 'price') item.price = cleanValue;

    const gross = item.price * item.quantity;

    if (field === 'discountPercent') {
      item.discountPercent = cleanValue;
      item.discountAmount = (gross * cleanValue) / 100;
    } else if (field === 'discountAmount') {
      item.discountAmount = cleanValue;
      item.discountPercent = gross > 0 ? (cleanValue / gross) * 100 : 0;
    } else if (field === 'price' || field === 'quantity') {
       item.discountAmount = (gross * item.discountPercent) / 100;
    }

    updatedProducts[index] = item;
    setOrder(recalculateOrder({ ...order, products: updatedProducts }));
  };

  const handleGlobalDiscount = (type: 'percent' | 'amount', value: number) => {
    if (!order) return;
    const cleanValue = Math.abs(value);
    let newPercent = order.globalDiscountPercent;
    let newAmount = order.globalDiscountAmount;

    if (type === 'percent') {
      newPercent = Math.min(cleanValue, 100);
      newAmount = (order.subtotal * newPercent) / 100;
    } else {
      newAmount = Math.min(cleanValue, order.subtotal);
      newPercent = order.subtotal > 0 ? (newAmount / order.subtotal) * 100 : 0;
    }

    setOrder(recalculateOrder({ ...order, globalDiscountPercent: newPercent, globalDiscountAmount: newAmount }));
  };

  const handleTaxChange = (percent: number) => {
    if (!order) return;
    setOrder(recalculateOrder({ ...order, taxPercent: Math.abs(percent) }));
  };

  const handleStatusChange = (newStatus: string) => {
    if (!order) return;
    setOrder({ ...order, status: newStatus });
  };

  const handleAddProduct = (product: AvailableProduct) => {
    if (!order) return;
    const newItem: OrderItem = {
      name: product.name,
      sku: product.sku,
      quantity: 1,
      price: product.price,
      discountPercent: 0,
      discountAmount: 0,
    };
    const updatedProducts = [...order.products, newItem];
    setOrder(recalculateOrder({ ...order, products: updatedProducts }));
    setProductSearch("");
    setShowProductResults(false);
  };

  const handleRemoveRow = (index: number) => {
    if (!order) return;
    if (!confirm("Remove this item?")) return;
    const updatedProducts = order.products.filter((_, i) => i !== index);
    setOrder(recalculateOrder({ ...order, products: updatedProducts }));
  };

  const sendWhatsApp = () => {
    if (!order || !order.phone) return;
    let formattedPhone = order.phone.replace(/\D/g,''); 
    if (formattedPhone.startsWith('01')) formattedPhone = '2' + formattedPhone;
    const store = storeSettings?.storeName || 'LotfyGroup AdminPannel';
    const message = `Hello ${order.customerName}, here is your invoice for order #${order._id.substring(0,6)} from ${store}. Status: ${order.status}. Total: EGP ${order.totalAmount.toLocaleString()}`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handlePrint = (mode: PrintMode) => {
    if (!order) return;
    const safeCustomerName = order.customerName.trim().replace(/[\\/:*?"<>|]/g, '-');
    const nextTitle = mode === 'qty'
      ? `${safeCustomerName || 'customer'}-qty`
      : `${safeCustomerName || 'customer'}-invoice`;
    setPrintTitle(nextTitle);
    setPrintMode(mode);
    window.setTimeout(() => window.print(), 50);
  };

  // --- Load & Save ---
  useEffect(() => {
    // 1. Fetch Store Settings
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        setStoreSettings(data);
      } catch (e) { console.error("Settings load failed", e); }
    };
    fetchSettings();

    // 2. Fetch Order
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${params.id}`);
        const data: ApiOrderResponse = await res.json();
        
        const normalizedProducts = data.products.map((p: ApiOrderProduct) => ({
            name: p.name || 'Unknown Product',
            sku: p.sku || "", 
            quantity: p.quantity || 0,
            price: p.price || 0,
            discountPercent: p.discountPercent || 0,
            discountAmount: p.discountAmount || 0,
            _id: p._id
        }));

        const normalizedOrder: OrderData = {
          _id: data._id,
          customerName: data.customerName,
          companyName: data.companyName,
          phone: data.phone,
          createdAt: data.createdAt,
          products: normalizedProducts,
          subtotal: 0, 
          globalDiscountPercent: data.globalDiscountPercent || 0,
          globalDiscountAmount: data.globalDiscountAmount || 0,
          taxPercent: data.taxPercent || 0,
          taxAmount: data.taxAmount || 0,
          totalAmount: 0,
          status: data.status || 'Pending'
        };

        setOrder(recalculateOrder(normalizedOrder));
      } catch (error) {
        console.error("Failed to load", error);
      } finally {
        setLoading(false);
      }
    };
    
    // 3. Fetch Products List
    const fetchProducts = async () => {
       try {
         const res = await fetch('/api/products');
         const data = await res.json();
         setAvailableProducts(data);
       } catch (error) {
         console.error("Failed to load products", error);
       }
    };

    if (params.id) {
       fetchOrder();
       fetchProducts();
    }
  }, [params.id, recalculateOrder]);

  useEffect(() => {
    const resetPrintMode = () => setPrintMode('full');
    window.addEventListener('afterprint', resetPrintMode);
    return () => window.removeEventListener('afterprint', resetPrintMode);
  }, []);

  useEffect(() => {
    document.title = printTitle;
  }, [printTitle]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      alert("✅ Invoice & Status updated!");
    } catch (error) {
      console.error(error); 
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>;
  if (!order) return <div className="p-10 text-center text-red-500">Order not found</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between mb-6 no-print">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="text-2xl font-bold">Order Editor</h1>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="mr-4">
              <select 
                value={order.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`h-10 px-3 rounded-md border font-bold text-sm outline-none focus:ring-2 focus:ring-slate-400
                  ${order.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                  ${order.status === 'Processing' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                  ${order.status === 'Shipped' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                  ${order.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                  ${order.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                `}
              >
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
           </div>

           {order.phone && (
            <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={sendWhatsApp}>
              <Phone className="mr-2 h-4 w-4" /> WhatsApp
            </Button>
          )}

          <Button variant="outline" onClick={() => handlePrint('full')}>
             <Printer className="mr-2 h-4 w-4" /> PDF Full
          </Button>
          <Button variant="outline" onClick={() => handlePrint('qty')}>
             <Printer className="mr-2 h-4 w-4" /> PDF Qty Only
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div
        className="bg-white p-12 shadow-lg border rounded-xl print:shadow-none print:border-none print:p-0"
        id="invoice"
        data-print-mode={printMode}
      >
        <div className="flex justify-between border-b pb-8 mb-8">
          <div>
            {storeSettings?.storeLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={storeSettings.storeLogo}
                alt={storeSettings?.storeName || 'LotfyGroup AdminPannel'}
                className="object-contain mb-4"
                style={{ height: `${Math.max(storeSettings?.logoHeight || 48, 84)}px`, maxWidth: '280px', width: 'auto' }}
              />
            ) : (
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                {storeSettings?.storeName || 'LotfyGroup AdminPannel'}
              </h2>
            )}
            <p className="text-slate-500 mt-2 text-sm">{storeSettings?.address || 'Cairo, Egypt'}</p>
            <p className="text-slate-500 text-sm">Tax ID: {storeSettings?.taxId || '123-456-789'}</p>
            {storeSettings?.phone && <p className="text-slate-500 text-sm">Phone: {storeSettings.phone}</p>}
            {storeSettings?.email && <p className="text-slate-500 text-sm">Email: {storeSettings.email}</p>}

            <div className="mt-8 text-sm p-4 rounded text-left border border-slate-100 min-w-[240px]">
              <p className="font-bold text-slate-700 uppercase text-xs mb-1">Bill To:</p>
              <p className="font-bold text-slate-900 text-lg">{order.companyName}</p>
              <p className="text-slate-500">{order.customerName}</p>
              {order.phone && <p className="text-slate-400 mt-1">{order.phone}</p>}
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-2xl font-bold text-slate-800">{printMode === 'qty' ? 'QTY SHEET' : 'INVOICE'}</h3>
            <p className="text-slate-600 font-mono mt-1">#{order._id.substring(0, 8)}</p>
            <p className="text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</p>
            
            <div className={`inline-block px-3 py-1 rounded text-xs font-bold uppercase mt-2 border
               ${order.status === 'Delivered' ? 'text-green-700 border-green-200 bg-green-50' : 'text-slate-500 border-slate-200'}
            `}>
              {order.status}
            </div>
          </div>
        </div>

        <table className="w-full text-left mb-8">
          <thead>
            <tr className="border-b-2 border-slate-800 text-sm uppercase tracking-wider">
              <th className="py-4 font-bold text-slate-900 w-[35%]">SKU</th>
              <th className="py-4 text-center w-[15%]">Qty</th>
              <th className="py-4 text-center w-[20%] qty-print-hidden">Price (EGP)</th>
              <th className="py-4 text-center w-[15%] qty-print-hidden">Discount</th>
              <th className="py-4 text-right w-[15%] qty-print-hidden">Total</th>
              <th className="py-4 w-[5%] no-print"></th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {order.products.map((item, index) => (
              <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="py-4 pr-4 align-middle">
                  <div className="font-bold text-slate-900 text-base">{item.sku ? item.sku : item.name}</div>
                </td>
                <td className="py-4 px-2 align-middle">
                  <Input type="number" min="0" value={item.quantity} onChange={(e) => handleRowChange(index, 'quantity', Number(e.target.value))} className="w-full h-10 text-center font-medium text-lg bg-white print:hidden" />
                  <span className="hidden print:block text-center">{item.quantity}</span>
                </td>
                <td className="py-4 px-2 align-middle qty-print-hidden">
                  <Input type="number" min="0" step="0.01" value={item.price} onChange={(e) => handleRowChange(index, 'price', Number(e.target.value))} className="w-full h-10 text-center font-medium bg-white print:hidden" />
                   <span className="hidden print:block text-center">{item.price.toFixed(2)}</span>
                </td>
                <td className="py-4 px-2 align-middle qty-print-hidden">
                  <div className="flex gap-1 items-center justify-center bg-slate-50 p-1 rounded-md border border-slate-100 no-print">
                    <div className="flex-1 relative">
                      <Input type="number" min="0" step="0.1" value={item.discountPercent || ''} placeholder="%" onChange={(e) => handleRowChange(index, 'discountPercent', Number(e.target.value))} className="h-8 text-xs text-center pr-3 border-transparent focus:border-blue-500" />
                      <span className="absolute right-1 top-2 text-[10px] text-slate-400 font-bold">%</span>
                    </div>
                    <span className="text-slate-300">|</span>
                    <div className="flex-1 relative">
                       <Input type="number" min="0" step="0.01" value={item.discountAmount || ''} placeholder="Amt" onChange={(e) => handleRowChange(index, 'discountAmount', Number(e.target.value))} className="h-8 text-xs text-center border-transparent focus:border-blue-500" />
                    </div>
                  </div>
                  <div className="hidden print:block text-center text-slate-500">
                    {item.discountAmount > 0 ? `- ${item.discountAmount.toFixed(2)}` : "-"}
                  </div>
                </td>
                <td className="py-4 text-right align-middle font-bold text-slate-900 text-base qty-print-hidden">
                  {calculateRowTotal(item).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="align-middle text-center no-print">
                   <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8" onClick={() => handleRemoveRow(index)}>
                     <Trash2 className="h-4 w-4" />
                   </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* --- ADD PRODUCT SECTION --- */}
        <div className="mb-8 no-print relative">
           <div className="relative">
             <Input 
               placeholder="Search to add product (Name or SKU)..." 
               className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
               value={productSearch}
               onChange={(e) => {
                 setProductSearch(e.target.value);
                 setShowProductResults(true);
               }}
               onFocus={() => setShowProductResults(true)}
             />
             <div className="absolute left-3 top-3.5 text-slate-400">
               <Loader2 className={`h-5 w-5 ${loading ? 'animate-spin' : 'hidden'}`} />
               {!loading && (
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
               )}
             </div>
           </div>
           
           {showProductResults && productSearch.length > 0 && (
             <div className="absolute z-10 w-full bg-white border rounded-md shadow-xl mt-1 max-h-60 overflow-y-auto">
               {availableProducts
                 .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase()))
                 .slice(0, 10)
                 .map((product) => (
                   <div 
                     key={product._id} 
                     className="p-3 hover:bg-blue-50 cursor-pointer border-b flex justify-between items-center group"
                     onClick={() => handleAddProduct(product)}
                   >
                     <div>
                       <div className="font-bold text-slate-800 group-hover:text-blue-700">{product.name}</div>
                       <div className="text-xs text-slate-500 font-mono">{product.sku}</div>
                     </div>
                     <div className="font-bold text-slate-600 group-hover:text-blue-700">
                       {product.price.toLocaleString()} EGP
                     </div>
                   </div>
               ))}
               {availableProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                  <div className="p-4 text-center text-slate-400 text-sm">No products match your search.</div>
               )}
             </div>
           )}
        </div>

        <div className="flex justify-end mt-4 qty-print-hidden">
          <div className="w-[400px] space-y-4 bg-slate-50 p-8 rounded-xl print:bg-transparent print:p-0">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Subtotal:</span>
              <span>{order.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="space-y-2 border-t border-slate-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">Order Discount:</span>
                <div className="flex gap-2 w-48 justify-end">
                   {/* Inputs for Screen */}
                   <div className="flex gap-2 w-full no-print">
                       <div className="relative w-20">
                          <Input type="number" min="0" step="0.1" value={order.globalDiscountPercent} onChange={(e) => handleGlobalDiscount('percent', Number(e.target.value))} className="h-9 pr-5 text-right text-sm bg-white text-slate-900" />
                          <span className="absolute right-2 top-2.5 text-xs text-slate-400 font-bold">%</span>
                       </div>
                       <div className="relative flex-1">
                          <Input type="number" min="0" step="0.01" value={order.globalDiscountAmount} onChange={(e) => handleGlobalDiscount('amount', Number(e.target.value))} className="h-9 text-right text-sm font-bold bg-white text-slate-900" />
                       </div>
                   </div>
                   {/* Text for Print */}
                   <div className="hidden print:block text-right font-bold text-slate-900">
                      {order.globalDiscountAmount > 0 ? order.globalDiscountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                   </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 pt-4">
              <span className="text-sm font-medium text-slate-700">Tax / VAT:</span>
              <div className="flex gap-2 w-48 justify-end items-center">
                 {/* Input for Screen */}
                 <div className="relative w-20 no-print">
                    <Input type="number" min="0" step="0.1" value={order.taxPercent} onChange={(e) => handleTaxChange(Number(e.target.value))} className="h-9 pr-5 text-right text-sm bg-white text-slate-900" />
                    <span className="absolute right-2 top-2.5 text-xs text-slate-400 font-bold">%</span>
                 </div>
                 
                 {/* Amount Text */}
                 <span className="text-sm font-mono text-slate-600 w-24 text-right">
                   <span className="no-print">
                      {order.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                   </span>
                   <span className="hidden print:block">
                      {order.taxAmount > 0 ? order.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                   </span>
                 </span>
              </div>
            </div>
            <div className="flex justify-between text-2xl font-black text-slate-900 border-t-2 border-slate-900 pt-6">
              <span>Total:</span>
              <span>EGP {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center text-slate-400 text-xs print:mt-24">
          <p>Generated by {storeSettings?.storeName || 'LotfyGroup AdminPannel'}</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { margin: 0; size: auto; }
          body * { visibility: hidden; }
          #invoice, #invoice * { visibility: visible; }
          #invoice { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 40px; border: none; box-shadow: none; }
          .no-print { display: none !important; }
          .no-print-border { border: none !important; background: transparent !important; padding: 0 !important; text-align: right; }
          #invoice[data-print-mode="qty"] .qty-print-hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Save, Plus, Trash2, ArrowLeft, Loader2, Phone, Search, Package } from "lucide-react";
import Link from 'next/link';

// --- Types ---
interface Product {
  _id: string;
  sku: string;
  price: number;
  name: string;
}

interface OrderItem {
  sku: string;
  quantity: number;
  price: number;
  productId: string;
  name: string;
}

interface CustomerResult {
  _id: string;
  name: string;
  phone: string;
  companyName?: string;
  email?: string;
  status?: string;
}

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const productInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const quantityInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  
  // Data Lists
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([]);
  
  // UI States
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [activeProductRow, setActiveProductRow] = useState<number | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  const [items, setItems] = useState<OrderItem[]>([
    { sku: '', quantity: 1, price: 0, productId: '', name: '' }
  ]);

  const createEmptyItem = (): OrderItem => ({ sku: '', quantity: 1, price: 0, productId: '', name: '' });

  // Load Products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProductsList(data);
      } catch (err) {
        console.error("Failed to load products", err);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const presetCustomerName = searchParams.get('customerName');
    const presetPhone = searchParams.get('phone');
    const presetCompanyName = searchParams.get('companyName');

    if (presetCustomerName) setCustomerName(presetCustomerName);
    if (presetPhone) setPhone(presetPhone);
    if (presetCompanyName) setCompanyName(presetCompanyName);
  }, [searchParams]);

  // --- CUSTOMER SEARCH ---
  useEffect(() => {
    const searchCustomers = async () => {
      if (customerName.length < 2) {
        setCustomerResults([]);
        return;
      }
      try {
        const res = await fetch(`/api/admin/customers?query=${encodeURIComponent(customerName)}&status=All`);
        const data = await res.json();
        setCustomerResults(data);
        setShowCustomerResults(true);
      } catch (error) { 
        console.error("Search failed", error); 
      }
    };
    const timeoutId = setTimeout(() => searchCustomers(), 300);
    return () => clearTimeout(timeoutId);
  }, [customerName]);

  const selectCustomer = (cust: CustomerResult) => {
    setCustomerName(cust.name);
    setPhone(cust.phone);
    setCompanyName(cust.companyName || '');
    setShowCustomerResults(false);
  };

  // --- PRODUCT SEARCH HELPER ---
  const getFilteredProducts = (query: string) => {
    if (!query) return productsList;
    const lowerQuery = query.toLowerCase();
    return productsList.filter(p => 
      p.sku.toLowerCase().includes(lowerQuery) || 
      p.name.toLowerCase().includes(lowerQuery)
    ).slice(0, 10);
  };

  const focusProductInput = (index: number) => {
    window.setTimeout(() => {
      productInputRefs.current[index]?.focus();
    }, 0);
  };

  const focusQuantityInput = (index: number) => {
    window.setTimeout(() => {
      quantityInputRefs.current[index]?.focus();
      quantityInputRefs.current[index]?.select();
    }, 0);
  };

  const getValidItems = () => items.filter((item) => item.productId && item.quantity > 0);

  const handleProductSelect = (index: number, product: Product, advanceToNext = false) => {
    setItems((currentItems) => {
      const newItems = [...currentItems];
      newItems[index] = {
        sku: product.sku,
        quantity: newItems[index]?.quantity || 1,
        price: product.price,
        productId: product._id,
        name: product.name
      };

      if (advanceToNext && index === currentItems.length - 1) {
        newItems.push(createEmptyItem());
      }

      return newItems;
    });

    if (advanceToNext) {
      const nextIndex = index + 1;
      setActiveProductRow(nextIndex);
      focusProductInput(nextIndex);
      return;
    }

    setActiveProductRow(null);
    focusQuantityInput(index);
  };

  // --- HANDLERS ---
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    const egyptPhoneRegex = /^01[0125][0-9]{8}$/;
    if (val === "") setPhoneError("");
    else if (!egyptPhoneRegex.test(val)) setPhoneError("Invalid Egyptian Number");
    else setPhoneError("");
  };

  // FIX: Replaced 'any' with 'string | number' to satisfy linter
  const handleItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...items];
    // FIX: Using spread syntax to update cleanly without TS errors
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => setItems([...items, createEmptyItem()]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const calculateTotal = () => getValidItems().reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowCustomerResults(false);
        setActiveProductRow(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneError) return alert("Please fix phone error");
    const validItems = getValidItems();
    if (validItems.length === 0) return alert("Please choose at least one product.");
    setLoading(true);

    const currentAdmin = localStorage.getItem('adminUser') || "Unknown Admin"; 

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUser: currentAdmin, 
          customerName,
          companyName,
          phone, 
          products: validItems,
          totalAmount: validItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        }),
      });

      const result = await res.json();
      if (res.ok) router.push(`/admin/orders/${result._id}`);
      else alert(`Error: ${result.error}`);
    } catch (error) { 
      console.error("Submit error:", error);
      alert("Network Error"); 
    } 
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" ref={wrapperRef}>
      <div className="flex items-center gap-4">
        <Link href="/admin/orders">
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-3xl font-bold">Create Manual Order</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Customer Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-2 relative">
              <Label>Customer Name *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  required 
                  placeholder="Type name..." 
                  value={customerName} 
                  onChange={e => { setCustomerName(e.target.value); setShowCustomerResults(true); }}
                  onFocus={() => setShowCustomerResults(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customerResults.length > 0) {
                      e.preventDefault();
                      selectCustomer(customerResults[0]);
                    }
                  }}
                  className="pl-10"
                />
              </div>
              {showCustomerResults && customerResults.length > 0 && (
                <div className="absolute z-20 w-full bg-white border rounded-md shadow-xl mt-1 max-h-60 overflow-y-auto">
                  {customerResults.map((cust) => (
                    <div key={cust._id} className="p-3 hover:bg-slate-100 cursor-pointer border-b" onClick={() => selectCustomer(cust)}>
                      <div className="font-bold">{cust.name}</div>
                      <div className="text-xs text-slate-500">{cust.phone}{cust.companyName ? ` • ${cust.companyName}` : ''}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Phone *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input required placeholder="01xxxxxxxxx" value={phone} onChange={handlePhoneChange} className="pl-10" />
              </div>
              {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Company</Label>
              <Input placeholder="Tech Corp" value={companyName} onChange={e => setCompanyName(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Items</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 text-sm font-bold text-slate-500 px-1">
              <div className="flex-1">Product (SKU / Name)</div>
              <div className="w-24">Qty</div>
              <div className="w-32">Price</div>
              <div className="w-10"></div>
            </div>

            {items.map((item, index) => (
              <div key={index} className="flex gap-4 items-start relative pb-2">
                <div className="flex-1 relative">
                  <div className="relative">
                    <Package className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Type SKU or Name..."
                      value={item.sku} 
                      ref={(element) => {
                        productInputRefs.current[index] = element;
                      }}
                      onChange={(e) => {
                        handleItemChange(index, 'sku', e.target.value);
                        setActiveProductRow(index);
                      }}
                      onFocus={() => setActiveProductRow(index)}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return;
                        e.preventDefault();

                        const filteredProducts = getFilteredProducts(item.sku);
                        if (filteredProducts.length > 0) {
                          handleProductSelect(index, filteredProducts[0]);
                          return;
                        }

                        if (item.productId) {
                          focusQuantityInput(index);
                        }
                      }}
                      className="pl-10"
                    />
                  </div>
                  
                  {activeProductRow === index && (
                    <div className="absolute z-20 w-full bg-white border rounded-md shadow-xl mt-1 max-h-60 overflow-y-auto">
                      {getFilteredProducts(item.sku).length === 0 ? (
                         <div className="p-3 text-sm text-slate-400">No products found</div>
                      ) : (
                        getFilteredProducts(item.sku).map((p) => (
                          <div 
                            key={p._id} 
                            className="p-2 hover:bg-slate-100 cursor-pointer border-b flex justify-between items-center"
                            onClick={() => handleProductSelect(index, p)}
                          >
                            <div>
                              <div className="font-bold text-sm text-slate-900">{p.sku}</div>
                              <div className="text-xs text-slate-500">{p.name}</div>
                            </div>
                            <div className="font-mono text-sm font-bold text-slate-700">
                              {p.price.toLocaleString()}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="w-24">
                  <Input 
                    type="number" min="1" 
                    ref={(element) => {
                      quantityInputRefs.current[index] = element;
                    }}
                    value={item.quantity} 
                    onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} 
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      e.preventDefault();
                      if (!item.productId) return;

                      const nextIndex = index + 1;
                      if (index === items.length - 1) {
                        addItem();
                      }
                      setActiveProductRow(nextIndex);
                      focusProductInput(nextIndex);
                    }}
                  />
                </div>

                <div className="w-32">
                  <Input disabled value={item.price} className="bg-slate-50 font-mono" />
                </div>

                <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeItem(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addItem} className="w-full border-dashed">
              <Plus className="mr-2 h-4 w-4" /> Add Another Item
            </Button>
            
            <div className="flex justify-end text-xl font-bold pt-4 text-slate-900">
              Total: EGP {calculateTotal().toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full bg-slate-900 text-white hover:bg-slate-800" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Create Order & Generate Invoice
        </Button>
      </form>
    </div>
  );
}

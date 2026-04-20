"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronLeft, Save, Loader2, Plus, X, Image as ImageIcon } from "lucide-react";
import Link from 'next/link';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    stock: '',
    category: '',
    collection: '', // New Collection Field
    description: '',
    imageUrl: ''
  });

  // Features List State
  const [features, setFeatures] = useState<string[]>(['']);

  // State for available collections
  const [collections, setCollections] = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => {
    // Fetch collections on mount
    fetch('/api/collections')
      .then(res => res.json())
      .then(data => setCollections(data))
      .catch(err => console.error("Failed to load collections", err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- Features Logic ---
  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  const addFeature = () => {
    setFeatures([...features, '']);
  };

  const removeFeature = (index: number) => {
    const newFeatures = features.filter((_, i) => i !== index);
    setFeatures(newFeatures);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Filter out empty features
    const cleanFeatures = features.filter(f => f.trim() !== '');

    const payload = {
      ...formData,
      features: cleanFeatures
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push('/admin/products');
        router.refresh();
      } else {
        const err = await res.json();
        alert(`Failed: ${err.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(error);
      alert("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="outline" size="icon" type="button">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">New Product</h1>
            <p className="text-slate-500 text-sm">Create a new item for your B2B catalog</p>
          </div>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
           <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800 text-white min-w-[140px]">
             {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
             Save Product
           </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* LEFT COLUMN (2/3 width) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Main Info */}
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>Basic information about the item.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" name="name" placeholder="e.g. Logitech Wireless Mouse M185" required onChange={handleChange} className="text-lg font-medium" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" placeholder="e.g. 2.4GHz with Mini USB Receiver..." onChange={handleChange} />
              </div>
            </CardContent>
          </Card>

          {/* Features Builder */}
          <Card>
            <CardHeader>
              <CardTitle>Features & Specs</CardTitle>
              <CardDescription>
                Add bullet points that will appear on the customer&apos;s product page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <span className="text-slate-400 text-xs w-4">{index + 1}.</span>
                  <Input 
                    placeholder="e.g. 1 Year Warranty" 
                    value={feature} 
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                  />
                  {features.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFeature(index)} className="text-slate-400 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addFeature} className="mt-2 border-dashed">
                <Plus className="h-3 w-3 mr-2" /> Add Feature
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN (1/3 width) */}
        <div className="space-y-6">
          
          {/* Pricing & Stock */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU (Unique ID) *</Label>
                <Input id="sku" name="sku" placeholder="e.g. MS-001" required onChange={handleChange} className="font-mono uppercase" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (EGP) *</Label>
                  <Input id="price" name="price" type="number" placeholder="0.00" required onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Qty *</Label>
                  <Input id="stock" name="stock" type="number" placeholder="0" required onChange={handleChange} />
                </div>
              </div>
              
              <div className="space-y-2 pt-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" placeholder="e.g. Accessories" onChange={handleChange} />
              </div>
              
              <div className="space-y-2 pt-2">
                <Label htmlFor="collection">Collection</Label>
                <select 
                  id="collection" 
                  name="collection" 
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  onChange={(e) => setFormData({...formData, collection: e.target.value})}
                  value={formData.collection}
                >
                  <option value="">None</option>
                  {collections.map((c: any) => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Image Upload (URL for now) */}
          <Card>
            <CardHeader>
              <CardTitle>Product Image</CardTitle>
              <CardDescription>Paste a direct image URL.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                 <Label htmlFor="imageUrl">Image Link</Label>
                 <Input id="imageUrl" name="imageUrl" placeholder="https://..." onChange={handleChange} />
              </div>
              
              {/* Image Preview */}
              <div className="aspect-square rounded-md border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden relative">
                {formData.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={formData.imageUrl} 
                    alt="Preview" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = ""; 
                      // If error, maybe show icon again? For now simpler to just break.
                    }}
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <span className="text-xs">Preview will appear here</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </form>
  );
}
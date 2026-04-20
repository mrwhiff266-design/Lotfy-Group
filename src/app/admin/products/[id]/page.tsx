"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronLeft, Save, Loader2, Plus, X, Image as ImageIcon } from "lucide-react";
import Link from 'next/link';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
  const [collections, setCollections] = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => {
    // Fetch collections
    fetch('/api/collections')
      .then(res => res.json())
      .then(data => setCollections(data))
      .catch(err => console.error("Failed to load collections", err));
    
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${params.id}`);
        // FIX: Error was checking !res.ok which is correct, BUT the page might be receiving an error object
        if (!res.ok) {
           const errData = await res.json();
           throw new Error(errData.error || 'Product not found');
        }
        const data = await res.json();
        
        setFormData({
          name: data.name,
          sku: data.sku,
          price: data.price,
          stock: data.stock,
          category: data.category || '',
          collection: data.collection || '',
          description: data.description || '',
          imageUrl: data.imageUrl || ''
        });
        
        if (data.features && data.features.length > 0) {
          setFeatures(data.features);
        }
      } catch (error) {
        console.error(error);
        alert("Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchProduct();
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  const addFeature = () => setFeatures([...features, '']);
  const removeFeature = (index: number) => setFeatures(features.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const cleanFeatures = features.filter(f => f.trim() !== '');

    try {
      const res = await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, features: cleanFeatures }),
      });

      if (res.ok) {
        alert("Product updated!");
        router.push('/admin/products');
        router.refresh();
      } else {
        alert("Failed to update product");
      }
    } catch (error) {
      console.error(error);
      alert("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>;

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="outline" size="icon" type="button">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Edit Product</h1>
            <p className="text-slate-500 text-sm">Update details for {formData.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
           <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800 text-white min-w-[140px]">
             {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
             Update Product
           </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Product Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" name="name" value={formData.name} required onChange={handleChange} className="text-lg font-medium" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" value={formData.description} onChange={handleChange} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features & Specs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <span className="text-slate-400 text-xs w-4">{index + 1}.</span>
                  <Input value={feature} onChange={(e) => handleFeatureChange(index, e.target.value)} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeFeature(index)} className="text-slate-400 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addFeature} className="mt-2 border-dashed">
                <Plus className="h-3 w-3 mr-2" /> Add Feature
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Inventory</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input id="sku" name="sku" value={formData.sku} required onChange={handleChange} className="font-mono uppercase" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (EGP) *</Label>
                  <Input id="price" name="price" type="number" value={formData.price} required onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Qty *</Label>
                  <Input id="stock" name="stock" type="number" value={formData.stock} required onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" value={formData.category} onChange={handleChange} />
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

          <Card>
            <CardHeader><CardTitle>Product Image</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                 <Label htmlFor="imageUrl">Image Link</Label>
                 <Input id="imageUrl" name="imageUrl" value={formData.imageUrl} onChange={handleChange} />
              </div>
              <div className="aspect-square rounded-md border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden relative">
                {formData.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-contain" onError={(e) => (e.target as HTMLImageElement).src = ""} />
                ) : (
                  <div className="text-center text-slate-400">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <span className="text-xs">Preview</span>
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
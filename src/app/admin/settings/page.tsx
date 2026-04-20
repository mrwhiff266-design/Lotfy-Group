"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Save, Loader2, Store } from "lucide-react";
import { usePermission } from '@/lib/permissions';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // PERMISSIONS CHECK
  const canView = usePermission('settings', 'view');
  const canEdit = usePermission('settings', 'edit');

  const [formData, setFormData] = useState({
  storeName: 'LotfyGroup AdminPannel',
    storeLogo: '',
    logoHeight: 40,
    address: 'Cairo, Egypt',
    taxId: '123-456-789',
    phone: '',
    email: ''
  });

  useEffect(() => {
    // If user has no view permission, we might redirect or just show "Access Denied"
    // The sidebar usually handles hiding the link, but direct access needs protection too.
    if (!canView && !loading) {
       // Optional: Redirect
    }

    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        setFormData({
          storeName: data.storeName ?? '',
          storeLogo: data.storeLogo ?? '',
          logoHeight: data.logoHeight ?? 40,
          address: data.address ?? 'Cairo, Egypt',
          taxId: data.taxId ?? '123-456-789',
          phone: data.phone ?? '',
          email: data.email ?? ''
        });
      } catch (error) {
        console.error("Failed to load settings", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [canView]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? Number(value) : value;
    setFormData({ ...formData, [name]: val });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return alert("You do not have permission to edit settings.");
    
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        alert("Settings Saved!");
      } else {
        alert("Failed to save settings");
      }
    } catch (error) {
      alert("Network Error");
    } finally {
      setSaving(false);
    }
  };

  if (!canView && !loading) {
    return <div className="p-8 text-center text-red-500 font-bold">Access Denied. You do not have permission to view settings.</div>;
  }

  if (loading) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Store Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            General Information
          </CardTitle>
          <CardDescription>
            These details will appear on your invoices and documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <fieldset disabled={!canEdit} className="space-y-4">
              <div className="space-y-2">
                <Label>Store Name</Label>
                    <Input name="storeName" value={formData.storeName} onChange={handleChange} placeholder="e.g. LotfyGroup AdminPannel" />
              </div>

              <div className="space-y-2">
                <Label>Store Logo URL</Label>
                <Input name="storeLogo" value={formData.storeLogo} onChange={handleChange} placeholder="https://example.com/logo.png" />
                {formData.storeLogo && (
                  <div className="mt-2 p-2 border rounded bg-slate-50">
                    <p className="text-xs text-slate-500 mb-2">Preview:</p>
                    <img src={formData.storeLogo} alt="Logo preview" className="object-contain" style={{ height: `${formData.logoHeight}px` }} />
                  </div>
                )}
                <p className="text-xs text-slate-500">Enter a URL for your logo, or upload to a service like Imgur and paste the link here.</p>
              </div>

              <div className="space-y-2">
                <Label>Logo Height (pixels)</Label>
                <Input 
                  name="logoHeight" 
                  type="number" 
                  value={formData.logoHeight} 
                  onChange={handleChange} 
                  placeholder="40"
                  min="20"
                  max="200"
                />
                <p className="text-xs text-slate-500">Recommended: 40-80px. Default is 40px.</p>
              </div>

              <div className="space-y-2">
                <Label>Address / Location</Label>
                <Input name="address" value={formData.address} onChange={handleChange} placeholder="e.g. 123 Street, Cairo" />
              </div>

              <div className="space-y-2">
                <Label>Tax ID / Registration Number</Label>
                <Input name="taxId" value={formData.taxId} onChange={handleChange} placeholder="e.g. 123-456-789" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label>Support Phone (Optional)</Label>
                  <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="+20..." />
                </div>
                <div className="space-y-2">
                  <Label>Support Email (Optional)</Label>
                  <Input name="email" value={formData.email} onChange={handleChange} placeholder="support@..." />
                </div>
              </div>
            </fieldset>

            {canEdit && (
              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Settings
              </Button>
            )}

          </form>
        </CardContent>
      </Card>
    </div>
  );
}

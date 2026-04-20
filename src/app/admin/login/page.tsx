"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lock, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('adminUser', data.username); 
        localStorage.setItem('adminName', data.name);
        localStorage.setItem('adminRole', data.role);
        localStorage.setItem('adminPermissions', JSON.stringify(data.permissions)); 
        
        window.dispatchEvent(new Event('permissionsUpdated'));

        // alert("Login successful! Redirecting..."); // Debug
        router.push('/admin/orders');
        router.refresh(); // Ensure middleware/layout re-runs
      } else {
        setError(data.error || "Login failed");
        alert("Login failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("Network error");
      alert("Network Error: check console");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-sm border-slate-800 bg-slate-950 text-slate-100">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Lock className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">LotfyGroup AdminPannel</CardTitle>
          <p className="text-center text-slate-400 text-sm">Authorized Personnel Only</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input 
                placeholder="admin" 
                className="bg-slate-900 border-slate-800 text-white"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                className="bg-slate-900 border-slate-800 text-white"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Access Dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

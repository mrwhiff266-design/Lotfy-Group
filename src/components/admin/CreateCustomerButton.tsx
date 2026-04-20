"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function CreateCustomerButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // FIX: Only call the admin create endpoint. 
      // Previously we were calling BOTH /register AND /admin/customers/create
      // The first one succeeded (creating the user), so the second one failed saying "User exists".
      
      const res = await fetch('/api/admin/customers/create', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(formData)
      });

      if (res.ok) {
        setOpen(false);
        setFormData({ name: '', email: '', phone: '', companyName: '', password: '' });
        window.location.reload(); 
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) {
      alert("Network Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-slate-900 text-white hover:bg-slate-800">
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New B2B Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label>Full Name</Label>
            <Input name="name" required value={formData.name} onChange={handleChange} />
          </div>
          <div className="grid gap-2">
            <Label>Company Name</Label>
            <Input name="companyName" value={formData.companyName} onChange={handleChange} />
          </div>
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input name="email" type="email" required value={formData.email} onChange={handleChange} />
          </div>
          <div className="grid gap-2">
            <Label>Phone</Label>
            <Input name="phone" required value={formData.phone} onChange={handleChange} />
          </div>
          <div className="grid gap-2">
            <Label>Initial Password</Label>
            <Input name="password" type="password" required value={formData.password} onChange={handleChange} />
          </div>
          <Button type="submit" className="w-full bg-slate-900" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, CheckCircle, XCircle, Clock, Trash2, ArrowRight } from "lucide-react";
import { usePermission } from '@/lib/permissions';
import ImportCustomersButton from '@/components/admin/ImportCustomersButton';
import CreateCustomerButton from '@/components/admin/CreateCustomerButton';
import Link from 'next/link';

interface Customer {
  _id: string;
  name: string;
  email: string;
  companyName: string;
  phone: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  totalOrders?: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All"); // All, Pending, Approved

  // Permissions
  const canView = usePermission('customers', 'view');
  const canEdit = usePermission('customers', 'edit');
  const canCreate = usePermission('customers', 'create');
  const canDelete = usePermission('customers', 'delete');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === 'All' 
        ? '/api/admin/customers' 
        : `/api/admin/customers?status=${filter}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchCustomers(); // Wait for fetch
        alert(`Status updated to ${newStatus}`);
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'Failed to update'}`);
      }
    } catch {
      alert("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this customer permanently?")) return;
    try {
      const res = await fetch(`/api/admin/customers/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCustomers();
    } catch {
      alert("Failed to delete");
    }
  };

  if (!canView && !loading) return <div className="p-10 text-center text-red-500">Access Denied</div>;

  const filteredList = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) // Added Phone Search
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">B2B Customers</h1>
        
        <div className="flex gap-2">
          {canCreate && (
            <>
              <ImportCustomersButton />
              <CreateCustomerButton />
            </>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row justify-between gap-4 border-b pb-4 items-center">
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap
                ${filter === status 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
              `}
            >
              {status}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search customers..." 
            className="pl-8 bg-white" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center h-24">Loading...</TableCell></TableRow>
            ) : filteredList.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center h-24 text-slate-500">No customers found.</TableCell></TableRow>
            ) : (
              filteredList.map((customer) => (
                <TableRow key={customer._id}>
                  <TableCell>
                    <Link href={`/admin/customers/${customer._id}`} className="font-bold text-slate-900 hover:text-blue-600">
                      {customer.name}
                    </Link>
                    <div className="text-xs text-slate-500">{customer.companyName || 'No Company'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{customer.email}</div>
                    <div className="text-xs text-slate-400">{customer.phone}</div>
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-slate-700">
                    {customer.totalOrders ?? 0}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border
                      ${customer.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                        customer.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-yellow-50 text-yellow-700 border-yellow-200'}
                    `}>
                      {customer.status === 'Approved' && <CheckCircle className="h-3 w-3" />}
                      {customer.status === 'Rejected' && <XCircle className="h-3 w-3" />}
                      {customer.status === 'Pending' && <Clock className="h-3 w-3" />}
                      {customer.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {canEdit && customer.status === 'Pending' && (
                      <>
                        <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleStatusChange(customer._id, 'Approved')}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleStatusChange(customer._id, 'Rejected')}>
                          Reject
                        </Button>
                      </>
                    )}
                    {canEdit && customer.status !== 'Pending' && (
                       <Button size="sm" variant="ghost" className="text-slate-400" onClick={() => handleStatusChange(customer._id, 'Pending')}>
                         Reset
                       </Button>
                    )}
                    {canDelete && (
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600" onClick={() => handleDelete(customer._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Link href={`/admin/customers/${customer._id}`}>
                      <Button size="sm" variant="ghost" className="text-slate-500 hover:text-slate-900">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

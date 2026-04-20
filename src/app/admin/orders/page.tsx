import React from 'react';
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button"; 
import { Plus } from "lucide-react"; 
import connectDB from "@/lib/db";
import Order from "@/models/Order";
// --- NEW IMPORT ---
import DeleteOrderButton from "@/components/DeleteOrderButton";

export const dynamic = 'force-dynamic';

type OrdersPageProps = {
  searchParams?: Promise<{ customer?: string }>;
};

export default async function AdminOrdersPage(props: OrdersPageProps) {
  await connectDB();
  const searchParams = await props.searchParams;
  const customerQuery = searchParams?.customer?.trim();
  const query = customerQuery
    ? {
        $or: [
          { customerName: { $regex: customerQuery, $options: 'i' } },
          { companyName: { $regex: customerQuery, $options: 'i' } },
        ],
      }
    : {};

  const orders = await Order.find(query).sort({ createdAt: -1 });

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase italic tracking-tighter">Orders</h1>
          {customerQuery && <p className="text-sm text-slate-500 mt-1">Filtered for customer: {customerQuery}</p>}
        </div>
        
        <Link href="/admin/orders/new">
          <Button className="bg-slate-900 text-white hover:bg-slate-800">
            <Plus className="mr-2 h-4 w-4" /> Create New Order
          </Button>
        </Link>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total (EGP)</TableHead>
              {/* --- NEW HEADER CELL --- */}
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                  No orders found yet.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order._id.toString()}>
                  <TableCell className="font-mono text-xs font-bold">
                    <Link 
                      href={`/admin/orders/${order._id}`} 
                      className="text-blue-600 hover:underline hover:text-blue-800"
                    >
                      #{order._id.toString().substring(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-xs text-slate-400 italic">{order.companyName}</div>
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border
                      ${order.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                      ${order.status === 'Processing' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                      ${order.status === 'Shipped' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                      ${order.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                      ${order.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                    `}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-black text-slate-900">
                    EGP {order.totalAmount.toLocaleString()}
                  </TableCell>
                  {/* --- NEW ACTION CELL --- */}
                  <TableCell className="text-right">
                    <DeleteOrderButton orderId={order._id.toString()} />
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

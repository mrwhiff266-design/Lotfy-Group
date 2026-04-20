import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Building2, Mail, Phone, ShoppingCart, Calendar, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import connectDB from '@/lib/db';
import Customer from '@/models/Customer';
import Order from '@/models/Order';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailsPage(props: Props) {
  const params = await props.params;
  await connectDB();

  const customer = await Customer.findById(params.id).lean();
  if (!customer) notFound();

  const orderQuery = customer.phone
    ? { $or: [{ phone: customer.phone }, { customerName: customer.name, companyName: customer.companyName || '' }] }
    : { customerName: customer.name, companyName: customer.companyName || '' };

  const orders = await Order.find(orderQuery).sort({ createdAt: -1 }).lean();

  const totalSpent = orders
    .filter((order) => order.status !== 'Cancelled')
    .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

  const deliveredOrders = orders.filter((order) => order.status === 'Delivered').length;
  const lastOrder = orders[0];
  const prefillUrl = `/admin/orders/new?customerName=${encodeURIComponent(customer.name)}&phone=${encodeURIComponent(customer.phone)}&companyName=${encodeURIComponent(customer.companyName || '')}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/customers">
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{customer.name}</h1>
            <p className="text-sm text-slate-500">{customer.companyName || 'No company registered'}</p>
          </div>
        </div>

        <Link href={prefillUrl}>
          <Button className="bg-slate-900 text-white hover:bg-slate-800">
            <ShoppingCart className="mr-2 h-4 w-4" /> Create Order
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-slate-500 uppercase">Total Orders</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-black text-slate-900">{orders.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-slate-500 uppercase">Delivered</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-black text-slate-900">{deliveredOrders}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-slate-500 uppercase">Total Spend</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-black text-slate-900">EGP {totalSpent.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-slate-500 uppercase">Last Order</CardTitle></CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-slate-900">{lastOrder ? new Date(lastOrder.createdAt).toLocaleDateString() : 'None yet'}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Customer Details</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Building2 className="h-4 w-4 mt-0.5 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-900">Company</p>
                <p className="text-slate-500">{customer.companyName || 'No company'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 mt-0.5 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-900">Phone</p>
                <p className="text-slate-500">{customer.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 mt-0.5 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-900">Email</p>
                <p className="text-slate-500">{customer.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 mt-0.5 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-900">Joined</p>
                <p className="text-slate-500">{new Date(customer.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Wallet className="h-4 w-4 mt-0.5 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-900">Status</p>
                <p className="text-slate-500">{customer.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Order History</CardTitle>
            <Link href={`/admin/orders?customer=${encodeURIComponent(customer.name)}`} className="text-sm font-medium text-blue-600 hover:underline">
              Open in Orders
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-sm text-slate-500">No orders yet for this customer.</p>
            ) : orders.map((order) => (
              <Link
                key={String(order._id)}
                href={`/admin/orders/${order._id}`}
                className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-slate-900">#{String(order._id).substring(0, 8)}</p>
                  <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">EGP {Number(order.totalAmount).toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{order.status}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

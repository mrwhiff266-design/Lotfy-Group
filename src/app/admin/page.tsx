import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, ShoppingCart, Users, Clock, TriangleAlert, Activity, ArrowUpRight } from 'lucide-react';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Customer from '@/models/Customer';
import StockHistory from '@/models/StockHistory';
import AuditLog from '@/models/AuditLog';

export default async function AdminDashboard() {
  await connectDB();

  const totalCustomers = await Customer.countDocuments();
  const pendingApprovals = await Customer.countDocuments({ status: 'Pending' });
  const totalOrders = await Order.countDocuments();
  const totalProducts = await Product.countDocuments();
  const lowStockCount = await Product.countDocuments({ stock: { $lte: 5 } });
  const outOfStockCount = await Product.countDocuments({ stock: { $lte: 0 } });

  const revenueData = await Order.aggregate([
    { $match: { status: { $ne: 'Cancelled' } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);
  const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

  const recentOrders = await Order.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .select('customerName companyName totalAmount status createdAt');

  const lowStockProducts = await Product.find({ stock: { $lte: 5 } })
    .sort({ stock: 1, name: 1 })
    .limit(5)
    .select('name sku stock');

  const topCustomers = await Order.aggregate([
    { $match: { status: { $ne: 'Cancelled' } } },
    {
      $group: {
        _id: '$phone',
        customerName: { $first: '$customerName' },
        companyName: { $first: '$companyName' },
        totalSpent: { $sum: '$totalAmount' },
        totalOrders: { $sum: 1 },
      },
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 5 },
  ]);

  const recentActivity = await Promise.all([
    AuditLog.find({}).sort({ createdAt: -1 }).limit(4).lean(),
    StockHistory.find({}).sort({ createdAt: -1 }).limit(4).lean(),
  ]).then(([auditLogs, stockLogs]) =>
    [
      ...auditLogs.map((log) => ({
        id: `audit-${log._id}`,
        title: log.action,
        description: log.details || log.status || 'System activity',
        createdAt: log.createdAt,
      })),
      ...stockLogs.map((log) => ({
        id: `stock-${log._id}`,
        title: `Stock ${log.changeAmount > 0 ? 'increased' : 'decreased'}`,
        description: `${log.productName} (${log.sku}) by ${log.changeAmount}`,
        createdAt: log.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">Command Center</h1>
        <div className="flex items-center space-x-2">
          <Link href="/admin/orders/new">
            <button className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition flex items-center gap-2">
              Create Order <ArrowUpRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {Number(totalRevenue).toLocaleString()} <span className="text-sm font-normal text-slate-500">EGP</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Gross sales from {totalOrders} orders
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Lifetime transactions
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase">B2B Clients</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium text-purple-600">
              Registered wholesale accounts
            </p>
          </CardContent>
        </Card>

        <Link href="/admin/customers" className="transition-transform hover:scale-[1.02]">
          <Card className={`border-l-4 shadow-md transition-colors ${pendingApprovals > 0 ? 'border-l-orange-500 bg-orange-50/30' : 'border-l-slate-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase">Pending Approvals</CardTitle>
              <Clock className={`h-4 w-4 ${pendingApprovals > 0 ? 'text-orange-600 animate-pulse' : 'text-slate-400'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{pendingApprovals}</div>
              <p className={`text-xs mt-1 font-bold ${pendingApprovals > 0 ? 'text-orange-600' : 'text-slate-500'}`}>
                {pendingApprovals > 0 ? 'Action Required' : 'All caught up'}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800 uppercase flex items-center gap-2">
              <Package className="h-5 w-5" /> Product Inventory
            </CardTitle>
          </CardHeader>
          <CardContent className="border-t border-slate-50">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="text-center py-6">
                <div className="text-4xl font-black text-slate-900">{totalProducts}</div>
                <p className="text-slate-500 font-bold text-sm uppercase">Total Products in Catalog</p>
                <Link href="/admin/products">
                  <button className="mt-4 text-xs font-bold text-blue-600 hover:underline">Manage Products →</button>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 self-center">
                <div className="rounded-lg border bg-red-50 px-3 py-4">
                  <div className="text-xs font-bold uppercase text-red-600">Low Stock</div>
                  <div className="text-2xl font-black text-red-700">{lowStockCount}</div>
                </div>
                <div className="rounded-lg border bg-slate-50 px-3 py-4">
                  <div className="text-xs font-bold uppercase text-slate-500">Out of Stock</div>
                  <div className="text-2xl font-black text-slate-900">{outOfStockCount}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-sm bg-slate-900 text-white">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase text-[#D4AF37]">Admin Shortcuts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/orders" className="block p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <p className="text-sm font-bold">Manage Orders</p>
              <p className="text-xs text-slate-400">Update status, invoices, and shipments</p>
            </Link>
            <Link href="/admin/inventory" className="block p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <p className="text-sm font-bold">Warehouse Stocks</p>
              <p className="text-xs text-slate-400">Bulk update and monitor low stock</p>
            </Link>
            <Link href="/admin/customers" className="block p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <p className="text-sm font-bold">Customer Profiles</p>
              <p className="text-xs text-slate-400">Review account status and order history</p>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-800">Recent Orders</CardTitle>
            <Link href="/admin/orders" className="text-sm font-medium text-blue-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-slate-500">No recent orders yet.</p>
            ) : recentOrders.map((order) => (
              <Link
                key={order._id.toString()}
                href={`/admin/orders/${order._id}`}
                className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-slate-900">{order.customerName}</p>
                  <p className="text-xs text-slate-500">{order.companyName || 'No company'} • {new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">EGP {order.totalAmount.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{order.status}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-red-500" /> Low Stock
            </CardTitle>
            <Link href="/admin/inventory" className="text-sm font-medium text-blue-600 hover:underline">Open</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-slate-500">No low-stock items right now.</p>
            ) : lowStockProducts.map((product) => (
              <div key={product._id.toString()} className="rounded-lg border px-3 py-2">
                <p className="font-semibold text-slate-900">{product.name}</p>
                <p className="text-xs text-slate-500">{product.sku}</p>
                <p className={`mt-1 text-sm font-bold ${product.stock <= 0 ? 'text-red-600' : 'text-amber-600'}`}>
                  {product.stock} left
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="h-5 w-5" /> Top Customers
            </CardTitle>
            <Link href="/admin/customers" className="text-sm font-medium text-blue-600 hover:underline">Customers</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {topCustomers.length === 0 ? (
              <p className="text-sm text-slate-500">No customer spend data yet.</p>
            ) : topCustomers.map((customer) => (
              <div key={`${customer._id}-${customer.customerName}`} className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div>
                  <p className="font-semibold text-slate-900">{customer.customerName}</p>
                  <p className="text-xs text-slate-500">{customer.companyName || 'No company'} • {customer.totalOrders} orders</p>
                </div>
                <div className="text-right font-bold text-slate-900">
                  EGP {Number(customer.totalSpent).toLocaleString()}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Activity className="h-5 w-5" /> Recent Activity
            </CardTitle>
            <Link href="/admin/logs" className="text-sm font-medium text-blue-600 hover:underline">Logs</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-slate-500">No activity recorded yet.</p>
            ) : recentActivity.map((item) => (
              <div key={item.id} className="rounded-lg border px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <p className="mt-1 text-sm text-slate-500">{item.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import React, { useCallback } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import useAdminData from '../hooks/useAdminData';
import { fetchDashboard } from '../services/adminApi';

import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#161521] border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">{label}</p>
                <p className="text-indigo-400 text-lg font-extrabold">
                    {formatCurrency(payload[0].value)}
                </p>
            </div>
        );
    }
    return null;
};

export default function DashboardPage() {
  const loadDashboard = useCallback(() => fetchDashboard(), []);
  const { data, setData, loading, error, refresh } = useAdminData(loadDashboard, null);
  const socket = useSocket();

  React.useEffect(() => {
    if (socket) {
      const handleNewOrder = () => refresh();
      const handleStockUpdate = () => refresh();

      socket.on('orderCreated', handleNewOrder);
      socket.on('stockUpdate', handleStockUpdate);

      return () => {
        socket.off('orderCreated', handleNewOrder);
        socket.off('stockUpdate', handleStockUpdate);
      };
    }
  }, [socket, refresh]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [refresh]);

  if (loading || !data) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-gray-400 font-medium animate-pulse">Loading dashboard insights...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <PageHeader
        title="Dashboard"
        subtitle="Track silk saree performance across products, orders, and customer demand."
      />
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium">
            {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Products" value={data.stats.totalProducts} hint="Active catalogue items" color="indigo" />
        <StatCard title="Total Orders" value={data.stats.totalOrders} hint="All-time orders" color="purple" />
        <StatCard title="Total Customers" value={data.stats.totalCustomers} hint="Registered buyers" color="emerald" />
        <StatCard title="Total Revenue" value={formatCurrency(data.stats.totalRevenue)} hint="Gross sales value" color="amber" />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="silk-card p-6 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Daily Sales</h3>
            <div className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded uppercase">Real-time</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={data.dailySales}>
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.3)', fontSize: 10}} axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.3)', fontSize: 10}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar 
                   dataKey="sales" 
                   fill="url(#colorBar)" 
                   radius={[6, 6, 0, 0]} 
                   animationBegin={100} 
                   animationDuration={1500} 
                   activeBar={{ fill: '#a5b4fc' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="silk-card p-6 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Weekly Performance</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={data.weeklySales}>
                <defs>
                  <linearGradient id="colorAreaWeekly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.3)', fontSize: 10}} axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.3)', fontSize: 10}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                   type="monotone" 
                   dataKey="sales" 
                   stroke="#a855f7" 
                   strokeWidth={3} 
                   fillOpacity={1}
                   fill="url(#colorAreaWeekly)"
                   dot={{ r: 4, fill: '#a855f7', strokeWidth: 2, stroke: '#0c0b14' }} 
                   activeDot={{ r: 6, fill: '#fff', stroke: '#a855f7', strokeWidth: 2 }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="silk-card p-6 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Monthly Growth</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={data.monthlySales}>
                <defs>
                  <linearGradient id="colorAreaMonthly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.3)', fontSize: 10}} axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.3)', fontSize: 10}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                   type="monotone" 
                   dataKey="sales" 
                   stroke="#6366f1" 
                   strokeWidth={3}
                   fillOpacity={1}
                   fill="url(#colorAreaMonthly)" 
                   dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#0c0b14' }} 
                   activeDot={{ r: 6, fill: '#fff', stroke: '#6366f1', strokeWidth: 2 }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="silk-card">
        <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Recent Orders</h3>
            <Link to="/orders" className="text-xs text-indigo-400 font-bold hover:underline">View All Orders</Link>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-white/5">
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Order ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Customer</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Amount</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {data.recentOrders.map((order) => (
                    <tr key={order.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-bold text-white">{order.orderId}</td>
                        <td className="px-6 py-4 text-gray-400 font-medium">{order.customerName}</td>
                        <td className="px-6 py-4 text-white font-bold">{formatCurrency(order.amount)}</td>
                        <td className="px-6 py-4">
                            <StatusBadge status={order.status} />
                        </td>
                    </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}

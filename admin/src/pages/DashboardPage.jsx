import React, { useCallback, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Area, AreaChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import useAdminData from '../hooks/useAdminData';
import { fetchDashboard } from '../services/adminApi';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { RefreshCw, TrendingUp, ShoppingBag, Clock, AlertTriangle } from 'lucide-react';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

/* ── Custom Chart Tooltip ─────────────────────────────────────────────────── */
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

const CategoryTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#161521] border border-white/10 p-3 rounded-xl shadow-2xl">
        <p className="text-gray-400 text-xs font-bold mb-1">{label}</p>
        <p className="text-purple-400 font-extrabold">{payload[0].value} products</p>
        {payload[1] && <p className="text-emerald-400 text-sm">{payload[1].value} in stock</p>}
      </div>
    );
  }
  return null;
};

/* ── Order Status Donut ───────────────────────────────────────────────────── */
const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function DashboardPage() {
  const loadDashboard = useCallback(() => fetchDashboard(), []);
  const { data, loading, error, refresh } = useAdminData(loadDashboard, null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const socket = useSocket();

  // Track last updated time separately
  React.useEffect(() => {
    if (data) setLastUpdated(new Date());
  }, [data]);

  // Socket-driven refresh
  React.useEffect(() => {
    if (socket) {
      const trigger = () => {
        setIsRefreshing(true);
        refresh();
        setTimeout(() => setIsRefreshing(false), 1000);
      };
      socket.on('orderCreated', trigger);
      socket.on('orderStatusUpdated', trigger);
      socket.on('stockUpdate', trigger);
      socket.on('productCreated', trigger);
      socket.on('productDeleted', trigger);
      return () => {
        socket.off('orderCreated', trigger);
        socket.off('orderStatusUpdated', trigger);
        socket.off('stockUpdate', trigger);
        socket.off('productCreated', trigger);
        socket.off('productDeleted', trigger);
      };
    }
  }, [socket, refresh]);

  // Auto-refresh every 30 s
  React.useEffect(() => {
    const id = setInterval(() => {
      setIsRefreshing(true);
      refresh();
      setTimeout(() => setIsRefreshing(false), 1000);
    }, 30000);
    return () => clearInterval(id);
  }, [refresh]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    refresh();
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  if (loading || !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-gray-400 font-medium animate-pulse">Loading dashboard insights...</p>
      </div>
    );
  }

  const hasCategories = data.categoryBreakdown && data.categoryBreakdown.length > 0;
  const hasMonthlySales = data.monthlySales && data.monthlySales.length > 0;
  const totalOrdersForDonut = data.orderStatusSummary.reduce((s, i) => s + i.value, 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <PageHeader
          title="Dashboard"
          subtitle="Track silk saree performance across products, orders, and customer demand."
        />
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Live pulse */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Live
          </div>
          {/* Last updated */}
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock size={12} />
              {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          )}
          {/* Refresh button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold rounded-xl hover:bg-indigo-500/20 transition-all disabled:opacity-50"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* ── Today's Quick Stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Today's Orders", value: data.stats.todayOrders, icon: <ShoppingBag size={16}/>, color: 'indigo' },
          { label: "Today's Revenue", value: formatCurrency(data.stats.todayRevenue), icon: <TrendingUp size={16}/>, color: 'emerald' },
          { label: 'Low Stock', value: data.stats.lowStockProducts, icon: <AlertTriangle size={16}/>, color: data.stats.lowStockProducts > 0 ? 'red' : 'gray' },
          { label: 'Pending Deliveries', value: data.stats.pendingOrders, icon: <Clock size={16}/>, color: 'amber' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="silk-card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
              ${color === 'indigo' ? 'bg-indigo-500/10 text-indigo-400' :
                color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
                color === 'amber' ? 'bg-amber-500/10 text-amber-400' :
                color === 'red' ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-gray-500'}`}>
              {icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">{label}</p>
              <p className="text-lg font-black text-white truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Stat Cards ───────────────────────────────────────────────── */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Products"   value={data.stats.totalProducts}          hint="Active catalogue items" color="indigo"  />
        <StatCard title="Total Orders"     value={data.stats.totalOrders}            hint="All-time orders"        color="purple"  />
        <StatCard title="Total Customers"  value={data.stats.totalCustomers}         hint="Registered buyers"      color="emerald" />
        <StatCard title="Total Revenue"    value={formatCurrency(data.stats.totalRevenue)} hint="Gross sales value"  color="amber"   />
      </div>

      {/* ── Charts Row 1 ─────────────────────────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-3">

        {/* Daily Sales */}
        <div className="silk-card p-6 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Daily Sales</h3>
            <div className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded uppercase">Real-time</div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={data.dailySales}>
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" tick={{fill:'rgba(255,255,255,0.3)',fontSize:10}} axisLine={false} tickLine={false} dy={10}/>
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{fill:'rgba(255,255,255,0.3)',fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip />} cursor={{fill:'rgba(255,255,255,0.03)'}}/>
                <Bar dataKey="sales" fill="url(#colorBar)" radius={[6,6,0,0]} animationBegin={100} animationDuration={1500} activeBar={{fill:'#a5b4fc'}}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Performance */}
        <div className="silk-card p-6 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Weekly Performance</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={data.weeklySales}>
                <defs>
                  <linearGradient id="colorAreaWeekly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" tick={{fill:'rgba(255,255,255,0.3)',fontSize:10}} axisLine={false} tickLine={false} dy={10}/>
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{fill:'rgba(255,255,255,0.3)',fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip />}/>
                <Area type="monotone" dataKey="sales" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorAreaWeekly)"
                  dot={{r:4,fill:'#a855f7',strokeWidth:2,stroke:'#0c0b14'}} activeDot={{r:6,fill:'#fff',stroke:'#a855f7',strokeWidth:2}}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Growth */}
        <div className="silk-card p-6 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Monthly Growth</h3>
          </div>
          <div className="h-56">
            {hasMonthlySales ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={data.monthlySales}>
                  <defs>
                    <linearGradient id="colorAreaMonthly" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                  <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" tick={{fill:'rgba(255,255,255,0.3)',fontSize:10}} axisLine={false} tickLine={false} dy={10}/>
                  <YAxis stroke="rgba(255,255,255,0.3)" tick={{fill:'rgba(255,255,255,0.3)',fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CustomTooltip />}/>
                  <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAreaMonthly)"
                    dot={{r:4,fill:'#6366f1',strokeWidth:2,stroke:'#0c0b14'}} activeDot={{r:6,fill:'#fff',stroke:'#6366f1',strokeWidth:2}}/>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600 text-sm">
                No paid orders yet — revenue will appear here.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Charts Row 2: Category Breakdown + Order Status ───────────────── */}
      <div className="grid gap-6 xl:grid-cols-3">

        {/* Category Breakdown — spans 2 cols */}
        <div className="silk-card p-6 min-w-0 xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Products by Category</h3>
            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Live from DB</span>
          </div>
          {hasCategories ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={data.categoryBreakdown} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false}/>
                  <XAxis type="number" stroke="rgba(255,255,255,0.2)" tick={{fill:'rgba(255,255,255,0.3)',fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis dataKey="label" type="category" stroke="rgba(255,255,255,0.2)" tick={{fill:'rgba(255,255,255,0.5)',fontSize:11}} axisLine={false} tickLine={false} width={110}/>
                  <Tooltip content={<CategoryTooltip />}/>
                  <Bar dataKey="count" name="Products" radius={[0,6,6,0]} animationDuration={1200}>
                    {data.categoryBreakdown.map((_, i) => (
                      <Cell key={i} fill={['#818cf8','#a855f7','#22d3ee','#34d399','#f59e0b','#f87171','#fb923c'][i % 7]}/>
                    ))}
                  </Bar>
                  <Bar dataKey="totalStock" name="Stock" radius={[0,6,6,0]} fill="rgba(255,255,255,0.08)" animationDuration={1400}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-600 text-sm">
              Add products with categories to see the breakdown.
            </div>
          )}
        </div>

        {/* Order Status Donut */}
        <div className="silk-card p-6 min-w-0 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Order Status</h3>
          </div>
          {totalOrdersForDonut > 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.orderStatusSummary.filter(d => d.value > 0)}
                      cx="50%" cy="50%"
                      innerRadius={45} outerRadius={70}
                      dataKey="value" nameKey="label"
                      labelLine={false}
                      label={renderCustomLabel}
                      animationBegin={0} animationDuration={1200}
                    >
                      {data.orderStatusSummary.filter(d => d.value > 0).map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="transparent"/>
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, name) => [v, name]}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-3">
                {data.orderStatusSummary.filter(d => d.value > 0).map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background: item.color}}/>
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-white font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
              No orders yet.
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Orders Table ───────────────────────────────────────────── */}
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
              {data.recentOrders.length > 0 ? data.recentOrders.map((order) => (
                <tr key={order.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-bold text-white">{order.orderId}</td>
                  <td className="px-6 py-4 text-gray-400 font-medium">{order.customerName}</td>
                  <td className="px-6 py-4 text-white font-bold">{formatCurrency(order.amount)}</td>
                  <td className="px-6 py-4"><StatusBadge status={order.status}/></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-600 text-sm">
                    No orders yet — they'll appear here when customers place them.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React, { useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import useAdminData from '../hooks/useAdminData';
import { fetchPaymentSummary } from '../services/adminApi';
import { CreditCard, ArrowUpRight, ArrowDownLeft, RefreshCcw } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#161521] border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md">
                <p className="text-white text-sm font-bold">{payload[0].name}</p>
                <p className="text-indigo-400 text-lg font-extrabold mt-1">{payload[0].value} Transactions</p>
            </div>
        );
    }
    return null;
};


export default function PaymentsPage() {
  const loadPayments = useCallback(() => fetchPaymentSummary(), []);
  const { data, loading, error, refresh } = useAdminData(loadPayments, { successful: 0, pending: 0, refunded: 0 });
  const socket = useSocket();

  React.useEffect(() => {
    if (socket) {
      const handler = () => refresh();
      socket.on('orderCreated', handler);
      socket.on('orderStatusUpdated', handler); // Assume we might emit this too
      return () => {
        socket.off('orderCreated', handler);
        socket.off('orderStatusUpdated', handler);
      };
    }
  }, [socket, refresh]);

  const paymentData = [
    { name: 'Successful', value: data?.successful || 0, color: '#10b981' },
    { name: 'Pending', value: data?.pending || 0, color: '#f59e0b' },
    { name: 'Refunded', value: data?.refunded || 0, color: '#6366f1' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <PageHeader 
        title="Payment Monitoring" 
        subtitle="Track financial streams, verify transaction integrity, and manage reversals." 
      />

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-sm font-medium">
            {error}
        </div>
      )}

      {loading ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-gray-400 font-medium">Reconciling transactions...</p>
        </div>
      ) : (
        <div className="grid gap-8">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard title="Confirmed" value={data.successful} hint="Successfully settled" color="emerald" />
            <StatCard title="In Processing" value={data.pending} hint="Awaiting verification" color="amber" />
            <StatCard title="Reversals" value={data.refunded} hint="Processed refunds" color="indigo" />
          </div>

          <div className="grid xl:grid-cols-1">
            <div className="silk-card p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                        <CreditCard size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Transaction Distribution</h3>
                        <p className="text-xs text-gray-500 mt-1">Comparison of payment lifecycle states</p>
                    </div>
                </div>
              </div>
              
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                        verticalAlign="middle" 
                        align="right" 
                        layout="vertical"
                        wrapperStyle={{ paddingLeft: '40px' }}
                        formatter={(value) => <span className="text-gray-400 font-bold text-sm ml-2">{value}</span>}
                    />
                    <Pie
                      data={paymentData}
                      cx="40%"
                      cy="50%"
                      innerRadius={110}
                      outerRadius={150}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                      animationBegin={200} 
                      animationDuration={1500} 
                    >
                      {paymentData.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color} 
                            style={{ filter: `drop-shadow(0 0 12px ${entry.color}30)` }}
                            className="outline-none"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

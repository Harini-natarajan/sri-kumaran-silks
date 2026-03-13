import React, { useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import StatCard from '../components/common/StatCard';
import PageHeader from '../components/common/PageHeader';
import useAdminData from '../hooks/useAdminData';
import { fetchInventorySnapshot } from '../services/adminApi';
import { useSocket } from '../context/SocketContext';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#161521] border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md">
                <p className="text-white text-sm font-bold">{payload[0].name}</p>
                <p className="text-indigo-400 text-lg font-extrabold mt-1">{payload[0].value} Units</p>
            </div>
        );
    }
    return null;
};

export default function InventoryPage() {
  const loadInventory = useCallback(() => fetchInventorySnapshot(), []);
  const { data, loading, error, refresh } = useAdminData(loadInventory, { inStock: 0, lowStock: 0, outOfStock: 0 });
  const socket = useSocket();

  React.useEffect(() => {
    if (socket) {
      const handler = () => refresh();
      socket.on('stockUpdate', handler);
      return () => socket.off('stockUpdate', handler);
    }
  }, [socket, refresh]);

  const inventoryData = [
    { name: 'Healthy Stock', value: data?.inStock || 0, color: '#6366f1' },
    { name: 'Replenish Soon', value: data?.lowStock || 0, color: '#f59e0b' },
    { name: 'Stock Out', value: data?.outOfStock || 0, color: '#ef4444' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <PageHeader 
        title="Inventory Insights" 
        subtitle="Monitor product availability and streamline your procurement cycle." 
      />

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-sm font-medium">
            {error}
        </div>
      )}

      {loading ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-gray-400 font-medium">Analyzing stock levels...</p>
        </div>
      ) : (
        <div className="grid gap-8">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard title="Healthy Units" value={data.inStock} hint="Items with >10 stock" color="indigo" />
            <StatCard title="Critical Alert" value={data.lowStock} hint="Items with <10 stock" color="amber" />
            <StatCard title="Out of Stock" value={data.outOfStock} hint="Unavailable for purchase" color="rose" />
          </div>

          <div className="grid xl:grid-cols-1">
            <div className="silk-card p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Inventory Distribution</h3>
                    <p className="text-xs text-gray-500 mt-1">Relative health of the entire catalog</p>
                </div>
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    Live Status
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
                      data={inventoryData}
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
                      {inventoryData.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color} 
                            className="outline-none"
                            style={{ filter: `drop-shadow(0 0 8px ${entry.color}40)` }}
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

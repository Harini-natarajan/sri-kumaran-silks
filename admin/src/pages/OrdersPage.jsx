import React, { useCallback, useState, useEffect } from 'react';
import { ShoppingBag, ChevronRight, User, IndianRupee, Clock, Search } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import useAdminData from '../hooks/useAdminData';
import { fetchOrders, updateOrderStatus } from '../services/adminApi';
import { useSocket } from '../context/SocketContext';

const statuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

export default function OrdersPage() {
  const loadOrders = useCallback(() => fetchOrders(), []);
  const { data: orders, setData: setOrders, loading, error, refresh } = useAdminData(loadOrders, []);
  const socket = useSocket();

  useEffect(() => {
    if (socket) {
        socket.on('orderCreated', () => {
            refresh();
        });
        return () => socket.off('orderCreated');
    }
  }, [socket, refresh]);
  const [savingId, setSavingId] = useState('');
  const [errorText, setErrorText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  
  const filteredOrders = React.useMemo(() => {
    let result = [...orders];

    if (searchQuery) {
        const lower = searchQuery.toLowerCase();
        result = result.filter(o => 
            o.orderId.toLowerCase().includes(lower) || 
            o.customerName.toLowerCase().includes(lower)
        );
    }

    if (selectedStatus !== 'All') {
        result = result.filter(o => o.status === selectedStatus);
    }

    return result;
  }, [orders, searchQuery, selectedStatus]);

  const updateStatus = async (id, status) => {
    setSavingId(id);
    setErrorText('');

    try {
      await updateOrderStatus(id, status);
      const refreshed = await fetchOrders();
      setOrders(refreshed);
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Failed to update order status');
    } finally {
      setSavingId('');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <PageHeader 
        title="Orders Ledger" 
        subtitle="Manage fulfillment cycles, track shipments, and oversee returns." 
      />

      {(errorText || error) && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-sm font-medium">
            {errorText || error}
        </div>
      )}

      <div className="silk-card overflow-hidden">
        <div className="px-8 py-6 border-b border-white/5 bg-white/[0.01] flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="flex items-center gap-3 font-bold text-gray-400 uppercase tracking-widest text-[10px]">
                    <ShoppingBag size={18} className="text-gray-500" />
                    <span>Transaction History</span>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-white/5 text-[10px] font-black text-indigo-400 border border-white/5 uppercase tracking-widest">
                    {filteredOrders.length} Records
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div className="relative group min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-indigo-400 transition-colors" size={16} />
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search ID or Customer..."
                        className="w-full bg-[#0c0b14] border border-white/5 rounded-xl py-2.5 pl-12 pr-4 text-sm text-white focus:border-indigo-500/50 outline-none transition-all shadow-inner"
                    />
                </div>

                <select 
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-[#0c0b14] border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-400 focus:border-indigo-500/50 outline-none appearance-none cursor-pointer hover:bg-white/5"
                >
                    <option value="All">All Cycles</option>
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
        </div>

        <div className="overflow-x-auto">
          {loading && !orders.length ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Compiling registry...</span>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Fulfillment Link</th>
                  <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Customer Entity</th>
                  <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Financials</th>
                  <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Life Cycle</th>
                  <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Transition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/5 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/10 transition-colors border border-white/5">
                                <Clock size={18} />
                            </div>
                            <div>
                                <div className="font-black text-white tracking-widest">#{order.orderId}</div>
                                <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">Processed</div>
                            </div>
                        </div>
                    </td>
                    <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                                <User size={14} />
                            </div>
                            <span className="text-sm font-bold text-gray-300">{order.customerName}</span>
                        </div>
                    </td>
                    <td className="px-8 py-6 font-black text-indigo-400">
                        <div className="flex items-center gap-1">
                            <IndianRupee size={14} className="opacity-50" />
                            {order.amount.toLocaleString('en-IN')}
                        </div>
                    </td>
                    <td className="px-8 py-6">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="inline-block relative">
                        <select
                          className="w-40 bg-[#0c0b14] border border-white/5 rounded-xl py-2 px-4 text-xs font-bold text-gray-300 focus:border-indigo-500/50 outline-none transition-all appearance-none cursor-pointer hover:bg-white/5 disabled:opacity-50"
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          disabled={savingId === order.id}
                        >
                          {statuses.map((item) => (
                            <option key={item} value={item} className="bg-[#0c0b14]">
                              {item}
                            </option>
                          ))}
                        </select>
                        <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-600 pointer-events-none" />
                        {savingId === order.id && (
                          <div className="absolute inset-0 bg-[#0c0b14]/80 flex items-center justify-center rounded-xl">
                            <div className="w-3 h-3 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {filteredOrders.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-24 opacity-30">
                <Search size={48} className="mb-4" />
                <p className="font-bold uppercase tracking-widest text-[10px]">No records match current parameters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

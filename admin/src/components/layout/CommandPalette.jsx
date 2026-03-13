import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, ShoppingBag, ClipboardList, Users, ArrowRight, Zap, Command } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchProducts, fetchOrders, fetchCustomers } from '../../services/adminApi';

export default function CommandPalette({ isOpen, onClose }) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ products: [], orders: [], customers: [] });
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);

    // Fetch all data for local searching
    const [allData, setAllData] = useState({ products: [], orders: [], customers: [] });

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            loadAllData();
        } else {
            setQuery('');
        }
    }, [isOpen]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [p, o, c] = await Promise.all([
                fetchProducts(),
                fetchOrders(),
                fetchCustomers()
            ]);
            setAllData({ products: p, orders: o, customers: c });
        } catch (err) {
            console.error('Palette load error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!query.trim()) {
            setResults({ products: [], orders: [], customers: [] });
            return;
        }

        const lower = query.toLowerCase();
        const filteredProducts = allData.products.filter(p => p.name.toLowerCase().includes(lower)).slice(0, 4);
        const filteredOrders = allData.orders.filter(o => o.orderId.toLowerCase().includes(lower) || o.customerName.toLowerCase().includes(lower)).slice(0, 4);
        const filteredCustomers = allData.customers.filter(c => c.name.toLowerCase().includes(lower) || c.email.toLowerCase().includes(lower)).slice(0, 4);

        setResults({
            products: filteredProducts,
            orders: filteredOrders,
            customers: filteredCustomers
        });
        setSelectedIndex(0);
    }, [query, allData]);

    const totalResults = results.products.length + results.orders.length + results.customers.length;

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowDown') {
            setSelectedIndex(prev => Math.min(prev + 1, totalResults - 1));
        }
        if (e.key === 'ArrowUp') {
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        }
        if (e.key === 'Enter') {
            // Find and click the selected item
            const allItems = [
                ...results.products.map(p => ({ type: 'product', id: p.id })),
                ...results.orders.map(o => ({ type: 'order', id: o.id })),
                ...results.customers.map(c => ({ type: 'customer', id: c.id }))
            ];
            const selected = allItems[selectedIndex];
            if (selected) {
                if (selected.type === 'product') navigate('/products');
                if (selected.type === 'order') navigate('/orders');
                if (selected.type === 'customer') navigate('/customers');
                onClose();
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] grid place-items-start justify-center pt-[10vh] px-4 backdrop-blur-xl bg-black/60 animate-in fade-in duration-300">
            <div 
                className="w-full max-w-2xl bg-[#0c0b14] border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(79,70,229,0.15)] overflow-hidden animate-in slide-in-from-top-8 duration-500"
                onKeyDown={handleKeyDown}
            >
                {/* Search Bar */}
                <div className="relative border-b border-white/5 p-6 bg-white/[0.02]">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-indigo-400" size={20} />
                    <input 
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search products, orders, or customers..."
                        className="w-full bg-transparent border-none outline-none pl-12 pr-12 text-lg text-white font-medium placeholder:text-gray-600"
                    />
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {loading ? (
                            <Zap size={16} className="text-indigo-400 animate-pulse" />
                        ) : (
                            <div className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-gray-400 font-black uppercase">ESC</div>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-gray-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Results Section */}
                <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
                    {query.trim() === '' ? (
                        <div className="py-12 text-center opacity-30">
                            <Command size={48} className="mx-auto mb-4" />
                            <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Global Command Center</p>
                            <p className="text-[10px] mt-2 font-medium">Type any keyword to search across the entire registry</p>
                        </div>
                    ) : totalResults === 0 && !loading ? (
                        <div className="py-12 text-center opacity-30">
                            <Search size={48} className="mx-auto mb-4" />
                            <p className="text-sm font-bold uppercase tracking-widest text-gray-500">No matches found</p>
                        </div>
                    ) : (
                        <div className="space-y-6 pb-4">
                            {/* Products Section */}
                            {results.products.length > 0 && (
                                <div>
                                    <h4 className="px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Designs & Inventory</h4>
                                    <div className="space-y-1">
                                        {results.products.map((p, idx) => (
                                            <ResultItem 
                                                key={p.id}
                                                icon={ShoppingBag}
                                                title={p.name}
                                                subtitle={`${p.category} • ₹${p.price.toLocaleString()}`}
                                                isSelected={selectedIndex === idx}
                                                onClick={() => { navigate('/products'); onClose(); }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Orders Section */}
                            {results.orders.length > 0 && (
                                <div>
                                    <h4 className="px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Transaction Ledger</h4>
                                    <div className="space-y-1">
                                        {results.orders.map((o, idx) => (
                                            <ResultItem 
                                                key={o.id}
                                                icon={ClipboardList}
                                                title={`Order #${o.orderId}`}
                                                subtitle={`${o.customerName} • ${o.status}`}
                                                isSelected={selectedIndex === results.products.length + idx}
                                                onClick={() => { navigate('/orders'); onClose(); }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Customers Section */}
                            {results.customers.length > 0 && (
                                <div>
                                    <h4 className="px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">User Directory</h4>
                                    <div className="space-y-1">
                                        {results.customers.map((c, idx) => (
                                            <ResultItem 
                                                key={c.id}
                                                icon={Users}
                                                title={c.name}
                                                subtitle={c.email}
                                                isSelected={selectedIndex === results.products.length + results.orders.length + idx}
                                                onClick={() => { navigate('/customers'); onClose(); }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5 grayscale opacity-50">
                            <ArrowRight size={12} className="rotate-[-90deg] translate-y-[1px]" />
                            <span>Navigate</span>
                        </div>
                        <div className="flex items-center gap-1.5 grayscale opacity-50">
                            <span className="px-1 py-0.5 rounded bg-white/10 text-[8px]">ENTER</span>
                            <span>Select</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ResultItem({ icon: Icon, title, subtitle, isSelected, onClick }) {
    return (
        <button 
            onClick={onClick}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${
                isSelected ? 'bg-indigo-600/10 border border-indigo-500/20 shadow-lg' : 'hover:bg-white/[0.03] border border-transparent'
            }`}
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                isSelected ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/5 text-gray-500'
            }`}>
                <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
                <p className={`font-bold transition-colors ${isSelected ? 'text-indigo-300' : 'text-white'}`}>{title}</p>
                <p className="text-xs text-gray-500 truncate">{subtitle}</p>
            </div>
            <ArrowRight size={16} className={`transition-all ${isSelected ? 'opacity-100 text-indigo-400 translate-x-0' : 'opacity-0 -translate-x-4'}`} />
        </button>
    );
}

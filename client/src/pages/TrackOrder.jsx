import React, { useState, useEffect, useContext, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { trackOrder } from '../services/api';
import {
    Package, MapPin, Truck, CheckCircle, Search,
    AlertCircle, Calendar, ArrowRight,
    ShoppingBag, ExternalLink, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from '../components/Loader';

const TrackOrder = () => {
    const [searchParams] = useSearchParams();
    const { user } = useContext(ShopContext);
    const [formData, setFormData] = useState({ orderId: '', email: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [orderData, setOrderData] = useState(null);
    const hasAutoTracked = useRef(false);

    useEffect(() => {
        const orderIdFromUrl = searchParams.get('orderId');
        const emailFromUrl = searchParams.get('email');
        setFormData(prev => ({
            orderId: orderIdFromUrl || prev.orderId,
            email: emailFromUrl || user?.email || prev.email
        }));
    }, [searchParams, user]);

    useEffect(() => {
        const orderIdFromUrl = searchParams.get('orderId');
        const userEmail = user?.email;
        if (orderIdFromUrl && userEmail && !hasAutoTracked.current && !orderData) {
            hasAutoTracked.current = true;
            autoTrackOrder(orderIdFromUrl, userEmail);
        }
    }, [searchParams, user, orderData]);

    const autoTrackOrder = async (orderId, email) => {
        setLoading(true); setError(null);
        try {
            const { data } = await trackOrder({ orderId, email });
            setOrderData(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to track order. Please check your details.');
        } finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError(null); setOrderData(null);
        try {
            const { data } = await trackOrder(formData);
            setOrderData(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Order not found. Please verify your Order ID and email.');
        } finally { setLoading(false); }
    };

    const steps = [
        { id: 'confirmed',  label: 'Order Placed',  icon: ShoppingBag },
        { id: 'processing', label: 'Processing',    icon: Package },
        { id: 'shipped',    label: 'Shipped',       icon: Truck },
        { id: 'delivered',  label: 'Delivered',     icon: CheckCircle },
    ];

    const getStepIndex = (status) => {
        if (status === 'cancelled') return -1;
        const map = { pending: 0, confirmed: 0, processing: 1, shipped: 2, delivered: 3 };
        return map[status] ?? 0;
    };

    const currentStep = orderData ? getStepIndex(orderData.orderStatus) : -1;

    const statusMeta = (status) => {
        switch (status) {
            case 'delivered':  return { label: 'Delivered',   color: 'text-green-700 bg-green-50 border-green-200' };
            case 'shipped':    return { label: 'Shipped',     color: 'text-blue-700 bg-blue-50 border-blue-200' };
            case 'processing': return { label: 'Processing',  color: 'text-amber-700 bg-amber-50 border-amber-200' };
            case 'cancelled':  return { label: 'Cancelled',   color: 'text-red-700 bg-red-50 border-red-200' };
            default:           return { label: 'Confirmed',   color: 'text-purple-700 bg-purple-50 border-purple-200' };
        }
    };

    const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <div className="min-h-screen bg-[#f1f3f6] dark:bg-slate-950">

            {/* ── Top search banner ─────────────────────────────────── */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-full bg-[#9A3412]/10 flex items-center justify-center">
                            <Package size={20} className="text-[#9A3412]" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                                Track Your Order
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Enter your order details to get real-time updates
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                    Order ID
                                </label>
                                <div className="relative">
                                    <Package size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        name="orderId"
                                        value={formData.orderId}
                                        onChange={e => setFormData({ ...formData, orderId: e.target.value })}
                                        placeholder="Enter your Order ID"
                                        required
                                        className="w-full pl-9 pr-4 py-3 text-sm border border-gray-300 dark:border-gray-700
                                                   dark:bg-gray-800 dark:text-white rounded-lg
                                                   focus:outline-none focus:ring-2 focus:ring-[#9A3412]/20
                                                   focus:border-[#9A3412] transition-all placeholder-gray-400"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 relative">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="Email used at checkout"
                                        required
                                        className="w-full pl-9 pr-4 py-3 text-sm border border-gray-300 dark:border-gray-700
                                                   dark:bg-gray-800 dark:text-white rounded-lg
                                                   focus:outline-none focus:ring-2 focus:ring-[#9A3412]/20
                                                   focus:border-[#9A3412] transition-all placeholder-gray-400"
                                    />
                                </div>
                            </div>
                            <div className="sm:self-end">
                                <div className="block text-xs font-semibold text-transparent uppercase tracking-wider mb-1.5 select-none hidden sm:block">
                                    &nbsp;
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full sm:w-auto px-8 py-3 bg-[#9A3412] hover:bg-[#7f2d0f]
                                               text-white text-sm font-semibold rounded-lg
                                               transition-colors flex items-center justify-center gap-2
                                               disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                                >
                                    {loading
                                        ? <Loader small text="Searching..." />
                                        : <><Search size={16} /> Track Order</>
                                    }
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* ── Page body ─────────────────────────────────────────── */}
            <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">

                <AnimatePresence mode="wait">

                    {/* Error */}
                    {error && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800
                                       rounded-lg p-4 flex items-start gap-3 shadow-sm"
                        >
                            <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-red-700 dark:text-red-400 text-sm">
                                    Order Not Found
                                </p>
                                <p className="text-red-600 dark:text-red-500 text-sm mt-0.5">{error}</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Results */}
                    {orderData && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            {/* ── Order summary header card ─────────── */}
                            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">

                                {/* coloured top stripe */}
                                <div className={`h-1 w-full ${orderData.orderStatus === 'delivered' ? 'bg-green-500'
                                    : orderData.orderStatus === 'cancelled' ? 'bg-red-500'
                                    : 'bg-[#9A3412]'}`}
                                />

                                <div className="p-5">
                                    {/* top row */}
                                    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                                                    Order #{orderData._id.slice(-8).toUpperCase()}
                                                </h2>
                                                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border
                                                                  ${statusMeta(orderData.orderStatus).color}`}>
                                                    {statusMeta(orderData.orderStatus).label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                                <Calendar size={12} />
                                                Placed on {fmt(orderData.createdAt)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Order Total</p>
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                ₹{orderData.totalPrice?.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* ── Status stepper ─────────────────── */}
                                    {orderData.orderStatus === 'cancelled' ? (
                                        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20
                                                        border border-red-200 dark:border-red-800 rounded-lg">
                                            <AlertCircle size={20} className="text-red-500 shrink-0" />
                                            <div>
                                                <p className="font-semibold text-red-700 dark:text-red-400 text-sm">
                                                    This Order Has Been Cancelled
                                                </p>
                                                <p className="text-red-600 dark:text-red-500 text-xs mt-0.5">
                                                    If you have any questions, please contact our support team.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            {/* connecting line */}
                                            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 hidden sm:block mx-[12.5%]" />
                                            <div
                                                className="absolute top-5 left-0 h-0.5 bg-[#9A3412] hidden sm:block mx-[12.5%] transition-all duration-700"
                                                style={{ width: `${(currentStep / (steps.length - 1)) * 75}%` }}
                                            />

                                            <div className="grid grid-cols-4 gap-2 relative z-10">
                                                {steps.map((step, i) => {
                                                    const done    = i <= currentStep;
                                                    const active  = i === currentStep;
                                                    const Icon    = step.icon;
                                                    return (
                                                        <div key={step.id} className="flex flex-col items-center gap-2">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center
                                                                             transition-all duration-500 border-2
                                                                             ${done
                                                                                ? 'bg-[#9A3412] border-[#9A3412] text-white shadow-md'
                                                                                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                                                                             }`}>
                                                                <Icon size={16} />
                                                            </div>
                                                            <div className="text-center">
                                                                <p className={`text-xs font-semibold leading-tight
                                                                              ${done ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                                                    {step.label}
                                                                </p>
                                                                {active && (
                                                                    <p className="text-[10px] text-[#9A3412] font-medium mt-0.5 animate-pulse">
                                                                        In Progress
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Two-column row: Shipment + Items ────── */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                                {/* Shipment details */}
                                <div className="lg:col-span-1">
                                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 h-full">
                                        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                                            <Truck size={15} className="text-[#9A3412]" />
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                                Shipment Info
                                            </h3>
                                        </div>
                                        <div className="p-5 space-y-4">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">
                                                    Tracking Number
                                                </p>
                                                <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                                                    {orderData.trackingDetails?.trackingId || '—'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">
                                                    Courier Partner
                                                </p>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {orderData.trackingDetails?.carrier || 'Standard Shipping'}
                                                </p>
                                            </div>
                                            {orderData.trackingDetails?.lastUpdate && (
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">
                                                        Latest Update
                                                    </p>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                                        {orderData.trackingDetails.lastUpdate}
                                                    </p>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">
                                                    Est. Delivery
                                                </p>
                                                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                                                    5–7 Business Days
                                                </p>
                                            </div>
                                            {orderData.trackingDetails?.trackingUrl && (
                                                <a
                                                    href={orderData.trackingDetails.trackingUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 text-xs font-semibold text-[#9A3412]
                                                               hover:text-[#7f2d0f] hover:underline mt-2"
                                                >
                                                    Track on Courier Site <ExternalLink size={11} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Order items */}
                                <div className="lg:col-span-2">
                                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
                                        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <ShoppingBag size={15} className="text-[#9A3412]" />
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                                    Order Items
                                                </h3>
                                            </div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {orderData.items?.length} {orderData.items?.length === 1 ? 'item' : 'items'}
                                            </span>
                                        </div>

                                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {orderData.items?.map((item, idx) => (
                                                <div key={idx} className="p-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                    {/* thumbnail */}
                                                    <div className="w-16 h-16 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800">
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                            onError={e => { e.target.src = 'https://via.placeholder.com/64?text=KS'; }}
                                                        />
                                                    </div>
                                                    {/* details */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight">
                                                            {item.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            Seller: <span className="font-medium">Kumaran Silks</span>
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            Qty: <span className="font-medium">{item.qty}</span>
                                                        </p>
                                                    </div>
                                                    {/* price */}
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white shrink-0">
                                                        ₹{(item.price * item.qty).toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* total */}
                                        <div className="px-5 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                                                Order Total
                                            </span>
                                            <span className="text-base font-bold text-[#9A3412]">
                                                ₹{orderData.totalPrice?.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* ── Help footer ────────────────────────── */}
                            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Having trouble with your order?
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <Link
                                            to="/contact"
                                            className="text-sm font-semibold text-[#9A3412] hover:text-[#7f2d0f]
                                                       flex items-center gap-1 hover:underline"
                                        >
                                            Contact Support <ChevronRight size={14} />
                                        </Link>
                                        <Link
                                            to="/profile"
                                            className="text-sm font-semibold text-[#9A3412] hover:text-[#7f2d0f]
                                                       flex items-center gap-1 hover:underline"
                                        >
                                            My Orders <ChevronRight size={14} />
                                        </Link>
                                    </div>
                                </div>
                            </div>

                        </motion.div>
                    )}

                    {/* Empty state — no search yet */}
                    {!orderData && !error && !loading && (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-12 text-center"
                        >
                            <div className="w-16 h-16 mx-auto mb-4 bg-[#9A3412]/10 rounded-full flex items-center justify-center">
                                <Package size={28} className="text-[#9A3412]" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                                Enter Your Order Details Above
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                                You can find your Order ID in your confirmation email or under <strong>My Orders</strong> in your profile.
                            </p>
                            <Link
                                to="/profile"
                                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold
                                           text-[#9A3412] hover:text-[#7f2d0f] hover:underline"
                            >
                                View My Orders <ArrowRight size={14} />
                            </Link>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
};

export default TrackOrder;

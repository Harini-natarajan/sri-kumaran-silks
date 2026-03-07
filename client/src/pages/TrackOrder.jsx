import React, { useState, useEffect, useContext, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { trackOrder } from '../services/api';
import {
    Package,
    MapPin,
    Truck,
    CheckCircle,
    Search,
    AlertCircle,
    Loader2,
    Calendar,
    Clock,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TrackOrder = () => {
    const [searchParams] = useSearchParams();
    const { user } = useContext(ShopContext);
    const [formData, setFormData] = useState({
        orderId: '',
        email: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [orderData, setOrderData] = useState(null);
    const hasAutoTracked = useRef(false);

    // Pre-fill from URL params and logged-in user
    useEffect(() => {
        const orderIdFromUrl = searchParams.get('orderId');
        const emailFromUrl = searchParams.get('email');

        setFormData(prev => ({
            orderId: orderIdFromUrl || prev.orderId,
            email: emailFromUrl || user?.email || prev.email
        }));
    }, [searchParams, user]);

    // Auto-track when coming from My Orders (orderId in URL + logged-in user)
    useEffect(() => {
        const orderIdFromUrl = searchParams.get('orderId');
        const userEmail = user?.email;

        if (orderIdFromUrl && userEmail && !hasAutoTracked.current && !orderData) {
            hasAutoTracked.current = true;
            autoTrackOrder(orderIdFromUrl, userEmail);
        }
    }, [searchParams, user, orderData]);

    const autoTrackOrder = async (orderId, email) => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await trackOrder({ orderId, email });
            setOrderData(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to track order. Please check your details.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setOrderData(null);

        try {
            const { data } = await trackOrder(formData);
            setOrderData(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to track order. Please check your details.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusStep = (status) => {
        const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
        // Handle cancelled separately
        if (status === 'cancelled') return -1;
        return steps.indexOf(status);
    };

    const steps = [
        { id: 'confirmed', label: 'Order Confirmed', icon: CheckCircle },
        { id: 'processing', label: 'Processing', icon: Package },
        { id: 'shipped', label: 'Shipped', icon: Truck },
        { id: 'delivered', label: 'Delivered', icon: MapPin },
    ];

    const currentStep = orderData ? getStatusStep(orderData.orderStatus) : 0;

    return (
        <div className="bg-gray-50 dark:bg-slate-950 min-h-screen pt-24 pb-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-4">Track Your Order</h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Enter your Order ID (found in your confirmation email) and the email address used during checkout.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-800">
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Order ID
                                </label>
                                <div className="relative">
                                    <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        name="orderId"
                                        value={formData.orderId}
                                        onChange={handleChange}
                                        placeholder="e.g. 64b8f..."
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter email"
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-1">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Tracking...
                                        </>
                                    ) : (
                                        <>
                                            <Search size={18} />
                                            Track Order
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-6 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 flex items-center gap-3 border-b border-red-100 dark:border-red-900/30"
                            >
                                <AlertCircle size={20} />
                                <p>{error}</p>
                            </motion.div>
                        )}

                        {orderData && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-6 md:p-8"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-gray-100 dark:border-gray-800">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                            Order #{orderData._id.slice(-8).toUpperCase()}
                                        </h2>
                                        <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                            <Calendar size={14} />
                                            Placed on {new Date(orderData.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="mt-4 md:mt-0 flex flex-col items-end">
                                        <span className="text-2xl font-bold text-primary">₹{orderData.totalPrice.toLocaleString()}</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase mt-1 ${orderData.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                                            orderData.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {orderData.orderStatus}
                                        </span>
                                    </div>
                                </div>

                                {orderData.orderStatus === 'cancelled' ? (
                                    <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg text-center mb-8">
                                        <AlertCircle size={32} className="mx-auto text-red-500 mb-2" />
                                        <h3 className="text-lg font-medium text-red-800">Order Cancelled</h3>
                                        <p className="text-red-600">This order has been cancelled.</p>
                                    </div>
                                ) : (
                                    <div className="relative mb-12">
                                        {/* Progress Bar Background */}
                                        <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 hidden md:block" />
                                        <div className="absolute left-6 top-0 bottom-0 w-1 bg-gray-200 dark:bg-gray-700 md:hidden" />

                                        <div className="grid grid-rows-4 md:grid-rows-1 md:grid-cols-4 gap-8 md:gap-4 relative z-10">
                                            {steps.map((step, index) => {
                                                const isCompleted = index <= currentStep;
                                                const isCurrent = index === currentStep;
                                                const Icon = step.icon;

                                                return (
                                                    <div key={step.id} className="flex md:flex-col items-center gap-4 md:gap-2">
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all ${isCompleted
                                                            ? 'bg-green-500 border-green-500 text-white'
                                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-300'
                                                            }`}>
                                                            <Icon size={20} />
                                                        </div>
                                                        <div className="flex-1 md:text-center">
                                                            <p className={`font-medium ${isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                                                {step.label}
                                                            </p>
                                                            {isCurrent && (
                                                                <p className="text-xs text-primary font-medium animate-pulse">
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

                                {/* Tracking Details Card */}
                                {(orderData.trackingDetails?.trackingId || orderData.orderStatus === 'shipped') && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-6 mb-8">
                                        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-4 flex items-center gap-2">
                                            <Truck size={18} />
                                            Shipment Details
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Tracking Number</p>
                                                <p className="font-mono font-medium text-gray-900 dark:text-white">
                                                    {orderData.trackingDetails?.trackingId || 'Pending Assignment'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Courier Partner</p>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {orderData.trackingDetails?.carrier || 'Standard Shipping'}
                                                </p>
                                            </div>
                                            {orderData.trackingDetails?.lastUpdate && (
                                                <div className="sm:col-span-2">
                                                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Latest Update</p>
                                                    <p className="text-gray-900 dark:text-white">{orderData.trackingDetails.lastUpdate}</p>
                                                </div>
                                            )}
                                        </div>
                                        {orderData.trackingDetails?.trackingUrl && (
                                            <a
                                                href={orderData.trackingDetails.trackingUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline"
                                            >
                                                Track on Courier Website <ArrowRight size={14} />
                                            </a>
                                        )}
                                    </div>
                                )}

                                {/* Products List Summary */}
                                <div className="border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-b border-gray-100 dark:border-gray-800 font-medium text-gray-700 dark:text-gray-300">
                                        Order Items
                                    </div>
                                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {orderData.items.map((item, idx) => (
                                            <div key={idx} className="p-4 flex items-center gap-4">
                                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{item.name}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.qty}</p>
                                                </div>
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    ₹{item.price.toLocaleString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default TrackOrder;

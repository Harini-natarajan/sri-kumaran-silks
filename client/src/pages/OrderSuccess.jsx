import React, { useEffect, useState, useContext } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { ShopContext } from '../context/ShopContext';
import { verifyStripeSession, getOrderById } from '../services/api';
import { generateInvoice } from '../utils/invoiceGenerator';
import {
    CheckCircle,
    Package,
    Truck,
    MapPin,
    CreditCard,
    ArrowRight,
    Download,
    Share2,
    Clock,
    ShieldCheck,
    Sparkles,
    Gift,
    Loader2,
    Check
} from 'lucide-react';
import { motion } from 'framer-motion';

const OrderSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { clearCart } = useContext(ShopContext);
    const { isLoaded, isSignedIn } = useAuth();
    const [showConfetti, setShowConfetti] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [verificationError, setVerificationError] = useState(null);
    const [shareMessage, setShareMessage] = useState(null);

    // Get order from state or URL params (for Stripe redirect)
    const [order, setOrder] = useState(location.state?.order || null);
    const [paymentId, setPaymentId] = useState(location.state?.paymentId || null);

    // Handle Stripe redirect verification - wait for auth to be loaded
    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        const orderId = searchParams.get('order_id');

        // Wait for Clerk to load and user to be signed in before making API calls
        if (!isLoaded) return;

        if (sessionId && orderId && !order && isSignedIn) {
            const verifyStripePayment = async () => {
                setVerifying(true);
                try {
                    const { data } = await verifyStripeSession(sessionId, orderId);
                    if (data.success) {
                        setOrder(data.order);
                        setPaymentId(data.order.stripePaymentIntentId);
                        clearCart();
                    } else {
                        setVerificationError('Payment verification failed');
                    }
                } catch (err) {
                    console.error('Stripe verification error:', err);
                    // Try to at least fetch the order
                    try {
                        const { data: orderData } = await getOrderById(orderId);
                        if (orderData.isPaid) {
                            setOrder(orderData);
                            setPaymentId(orderData.stripePaymentIntentId);
                            clearCart();
                        } else {
                            setVerificationError(err.response?.data?.message || 'Payment verification failed');
                        }
                    } catch (fetchErr) {
                        setVerificationError('Could not verify payment. Please check your orders.');
                    }
                } finally {
                    setVerifying(false);
                }
            };

            verifyStripePayment();
        } else if (isLoaded && !isSignedIn && sessionId && orderId) {
            // User is not signed in after redirect - this shouldn't normally happen
            setVerificationError('Session expired. Please sign in and check your orders.');
        }
    }, [searchParams, order, clearCart, isLoaded, isSignedIn]);

    // Redirect if no order data and not verifying
    useEffect(() => {
        if (!order && !verifying && !searchParams.get('session_id')) {
            const timer = setTimeout(() => {
                navigate('/');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [order, verifying, searchParams, navigate]);

    // Hide confetti after animation
    useEffect(() => {
        const timer = setTimeout(() => setShowConfetti(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    // Generate order number display
    const orderNumber = order?._id?.slice(-8).toUpperCase() || 'XXXXXXXX';
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

    // Handle share order
    const handleShare = async () => {
        const shareData = {
            title: 'My Order from Kumaran Silks',
            text: `I just ordered beautiful silk sarees from Kumaran Silks! 🎉\n\nOrder #${orderNumber}\nTotal: ₹${order?.totalPrice?.toLocaleString()}\n\nCheck out their amazing collection!`,
            url: window.location.origin
        };

        try {
            // Use Web Share API if available (mobile devices)
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                setShareMessage('Shared successfully!');
            } else {
                // Fallback: Copy to clipboard
                const textToCopy = `${shareData.text}\n\n${shareData.url}`;
                await navigator.clipboard.writeText(textToCopy);
                setShareMessage('Copied to clipboard!');
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                // User didn't cancel, try clipboard as fallback
                try {
                    const textToCopy = `${shareData.text}\n\n${shareData.url}`;
                    await navigator.clipboard.writeText(textToCopy);
                    setShareMessage('Copied to clipboard!');
                } catch (clipErr) {
                    setShareMessage('Could not share');
                }
            }
        }

        // Clear message after 3 seconds
        setTimeout(() => setShareMessage(null), 3000);
    };

    // Get payment method icon
    const getPaymentIcon = () => {
        if (order?.paymentMethod === 'stripe') {
            return <CreditCard className="text-indigo-500" size={18} />;
        }
        return <Package className="text-green-600" size={18} />; // COD
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: 'easeOut' }
        }
    };

    const checkmarkVariants = {
        hidden: { scale: 0, opacity: 0 },
        visible: {
            scale: 1,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 200,
                damping: 15,
                delay: 0.3
            }
        }
    };

    // Show loading state when verifying Stripe payment or waiting for auth
    const hasStripeParams = searchParams.get('session_id') && searchParams.get('order_id');
    if (verifying || (!isLoaded && hasStripeParams)) {
        return (
            <div className="bg-gray-50 min-h-screen flex flex-col justify-center items-center py-12 px-4">
                <div className="text-center">
                    <Loader2 className="animate-spin text-primary mx-auto mb-4" size={48} />
                    <h1 className="text-2xl font-serif font-bold text-gray-900 mb-4">
                        Verifying Payment...
                    </h1>
                    <p className="text-gray-500">Please wait while we confirm your payment</p>
                </div>
            </div>
        );
    }

    // Show verification error
    if (verificationError) {
        return (
            <div className="bg-gray-50 min-h-screen flex flex-col justify-center items-center py-12 px-4">
                <div className="text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CreditCard className="text-red-500" size={40} />
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-gray-900 mb-4">
                        Payment Verification Issue
                    </h1>
                    <p className="text-gray-500 mb-6">{verificationError}</p>
                    <div className="flex gap-4 justify-center">
                        <Link to="/profile" className="btn-secondary">
                            View My Orders
                        </Link>
                        <Link to="/" className="btn-primary">
                            Go to Homepage
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="bg-gray-50 min-h-screen flex flex-col justify-center items-center py-12 px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-serif font-bold text-gray-900 mb-4">
                        Order information not found
                    </h1>
                    <p className="text-gray-500 mb-6">Redirecting to homepage...</p>
                    <Link to="/" className="btn-primary inline-block">
                        Go to Homepage
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-b from-green-50 via-white to-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Confetti Animation */}
            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-50">
                    {[...Array(50)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{
                                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                                y: -20,
                                rotate: 0,
                                opacity: 1
                            }}
                            animate={{
                                y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 20,
                                rotate: Math.random() * 360,
                                opacity: 0
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                delay: Math.random() * 2,
                                ease: 'easeIn'
                            }}
                            className="absolute w-3 h-3 rounded-full"
                            style={{
                                backgroundColor: ['#800000', '#C6941F', '#D4AF37', '#22C55E', '#3B82F6'][
                                    Math.floor(Math.random() * 5)
                                ]
                            }}
                        />
                    ))}
                </div>
            )}

            <motion.div
                className="max-w-3xl mx-auto"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Success Header */}
                <motion.div
                    className="text-center mb-10"
                    variants={itemVariants}
                >
                    <motion.div
                        variants={checkmarkVariants}
                        className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/30"
                    >
                        <CheckCircle className="text-white" size={48} />
                    </motion.div>
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-3">
                        Order Confirmed! 🎉
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Thank you for shopping with Kumaran Silks
                    </p>
                </motion.div>

                {/* Order Card */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8"
                >
                    {/* Order Header */}
                    <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <p className="text-sm text-white/80">Order Number</p>
                                <p className="text-2xl font-bold tracking-wider">#{orderNumber}</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => generateInvoice(order)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-all"
                                >
                                    <Download size={16} />
                                    Invoice
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-all relative"
                                >
                                    {shareMessage ? <Check size={16} /> : <Share2 size={16} />}
                                    {shareMessage || 'Share'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Order Timeline */}
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between max-w-md mx-auto">
                            {[
                                { icon: ShieldCheck, label: 'Confirmed', active: true },
                                { icon: Package, label: 'Processing', active: false },
                                { icon: Truck, label: 'Shipped', active: false },
                                { icon: Gift, label: 'Delivered', active: false }
                            ].map((step, index) => (
                                <React.Fragment key={step.label}>
                                    <div className="flex flex-col items-center">
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center ${step.active
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-100 text-gray-400'
                                                }`}
                                        >
                                            <step.icon size={18} />
                                        </div>
                                        <span
                                            className={`text-xs mt-2 ${step.active ? 'text-green-600 font-medium' : 'text-gray-400'
                                                }`}
                                        >
                                            {step.label}
                                        </span>
                                    </div>
                                    {index < 3 && (
                                        <div
                                            className={`flex-1 h-0.5 mx-2 ${step.active ? 'bg-green-500' : 'bg-gray-200'
                                                }`}
                                        />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* Order Details */}
                    <div className="p-6 space-y-6">
                        {/* Items */}
                        <div>
                            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                <Package className="text-gray-500" size={18} />
                                Order Items ({order.orderItems?.length || 0})
                            </h3>
                            <div className="space-y-3">
                                {order.orderItems?.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="w-16 h-20 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                                            <p className="text-sm text-gray-500">Qty: {item.qty}</p>
                                        </div>
                                        <p className="font-bold text-primary">
                                            ₹{(item.price * item.qty).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Shipping & Payment */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                    <MapPin className="text-gray-500" size={18} />
                                    Shipping Address
                                </h3>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <p className="font-medium text-gray-900">{order.shippingAddress?.fullName}</p>
                                    <p>{order.shippingAddress?.phone}</p>
                                    <p>{order.shippingAddress?.address}</p>
                                    <p>
                                        {order.shippingAddress?.city}, {order.shippingAddress?.state} -{' '}
                                        {order.shippingAddress?.postalCode}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                    {getPaymentIcon()}
                                    Payment Details
                                </h3>
                                <div className="text-sm text-gray-600 space-y-2">
                                    <div className="flex justify-between">
                                        <span>Method</span>
                                        <span className="font-medium text-gray-900 capitalize">
                                            {order.paymentMethod === 'razorpay'
                                                ? (order.paymentResult?.method || 'Online Payment')
                                                : order.paymentMethod === 'stripe'
                                                    ? 'Card (Stripe)'
                                                    : 'Cash on Delivery'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Status</span>
                                        <span className={`font-medium ${order.isPaid ? 'text-green-600' : 'text-orange-500'}`}>
                                            {order.isPaid ? 'Paid' : 'Pending'}
                                        </span>
                                    </div>
                                    {paymentId && (
                                        <div className="flex justify-between">
                                            <span>Transaction ID</span>
                                            <span className="font-mono text-xs text-gray-500">
                                                {paymentId.slice(-12)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Price Summary */}
                        <div className="border-t border-gray-100 pt-4">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>₹{order.itemsPrice?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping</span>
                                    <span className={order.shippingPrice === 0 ? 'text-green-600' : ''}>
                                        {order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}
                                    </span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>GST</span>
                                    <span>₹{order.taxPrice?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100">
                                    <span>Total</span>
                                    <span className="text-primary">₹{order.totalPrice?.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Estimated Delivery */}
                <motion.div
                    variants={itemVariants}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Clock className="text-white" size={24} />
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900">Estimated Delivery</h3>
                            <p className="text-blue-700 font-bold text-lg">
                                {estimatedDelivery.toLocaleDateString('en-IN', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    variants={itemVariants}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <Link
                        to={`/track-order?orderId=${orderNumber}`}
                        className="btn-secondary inline-flex items-center justify-center gap-2 py-4 px-8"
                    >
                        <Package size={18} />
                        Track Order
                    </Link>
                    <Link
                        to="/products"
                        className="btn-primary inline-flex items-center justify-center gap-2 py-4 px-8 shadow-lg hover:shadow-xl transition-all"
                    >
                        Continue Shopping
                        <ArrowRight size={18} />
                    </Link>
                </motion.div>

                {/* Thank You Note */}
                <motion.div
                    variants={itemVariants}
                    className="text-center mt-12 p-6"
                >
                    <Sparkles className="mx-auto text-secondary mb-4" size={32} />
                    <p className="text-gray-600 italic font-serif text-lg">
                        "Every thread tells a story of tradition and elegance"
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                        We're honored to be part of your special moments
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default OrderSuccess;

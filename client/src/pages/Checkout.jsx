import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { createOrder, createStripeCheckoutSession } from '../services/api';
import {
    ShoppingBag,
    MapPin,
    ClipboardCheck,
    CreditCard,
    ChevronRight,
    ChevronLeft,
    Shield,
    Truck,
    Check,
    AlertCircle,
    Loader2,
    Lock,
    Package,
    QrCode,
    Smartphone,
} from 'lucide-react';

// Main Checkout Component
const Checkout = () => {
    const navigate = useNavigate();
    const { cartItems, user, clearCart } = useContext(ShopContext);
    const [currentStep, setCurrentStep] = useState(1);
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [error, setError] = useState(null);

    // Form data
    const [shippingAddress, setShippingAddress] = useState({
        fullName: user?.name || '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India'
    });
    const [paymentMethod, setPaymentMethod] = useState('stripe');

    // Calculate prices
    const itemsPrice = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shippingPrice = itemsPrice > 5000 ? 0 : 99;
    const taxPrice = Math.round(itemsPrice * 0.05); // 5% GST
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    // Redirect if cart is empty
    useEffect(() => {
        if (cartItems.length === 0 && !order) {
            navigate('/cart');
        }
    }, [cartItems, navigate, order]);

    // Redirect if not logged in
    useEffect(() => {
        if (!user) {
            navigate('/login?redirect=checkout');
        }
    }, [user, navigate]);

    const steps = [
        { id: 1, title: 'Cart Review', icon: ShoppingBag },
        { id: 2, title: 'Shipping', icon: MapPin },
        { id: 3, title: 'Review', icon: ClipboardCheck },
        { id: 4, title: 'Payment', icon: CreditCard },
    ];

    const handleShippingChange = (e) => {
        setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
    };

    const validateShipping = () => {
        const { fullName, phone, address, city, state, postalCode } = shippingAddress;
        if (!fullName || !phone || !address || !city || !state || !postalCode) {
            setError('Please fill in all shipping fields');
            return false;
        }
        if (!/^\d{10}$/.test(phone)) {
            setError('Please enter a valid 10-digit phone number');
            return false;
        }
        if (!/^\d{6}$/.test(postalCode)) {
            setError('Please enter a valid 6-digit PIN code');
            return false;
        }
        setError(null);
        return true;
    };

    // Handle Stripe Payment
    const handleStripePayment = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const orderItems = cartItems.map(item => ({
                name: item.name,
                qty: item.quantity,
                image: item.image || item.images?.[0] || '',
                price: item.price,
                product: item._id,
            }));

            const orderData = {
                orderItems,
                shippingAddress,
                itemsPrice,
                taxPrice,
                shippingPrice,
                totalPrice,
            };

            // Create Stripe checkout session
            const { data } = await createStripeCheckoutSession(orderData);
            setOrder(data.order);

            if (data.sessionUrl) {
                // Redirect to Stripe Checkout
                window.location.href = data.sessionUrl;
            } else {
                setError('Failed to create payment session');
                setLoading(false);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to initialize Stripe payment');
            setLoading(false);
        }
    }, [cartItems, shippingAddress, itemsPrice, taxPrice, shippingPrice, totalPrice]);

    const handlePlaceOrder = async () => {
        if (!validateShipping()) return;

        // Handle Stripe separately - it has its own flow
        if (paymentMethod === 'stripe') {
            handleStripePayment();
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const orderItems = cartItems.map(item => ({
                name: item.name,
                qty: item.quantity,
                image: item.image || item.images?.[0] || '',
                price: item.price,
                product: item._id,
            }));

            const orderData = {
                orderItems,
                shippingAddress,
                paymentMethod,
                itemsPrice,
                taxPrice,
                shippingPrice,
                totalPrice,
            };

            const { data } = await createOrder(orderData);
            setOrder(data.order);

            // COD order - redirect to success
            clearCart();
            navigate('/order-success', { state: { order: data.order } });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create order. Please try again.');
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (currentStep === 2 && !validateShipping()) return;
        if (currentStep === 3) {
            handlePlaceOrder();
            return;
        }
        setCurrentStep(prev => Math.min(prev + 1, 4));
    };

    const prevStep = () => {
        setError(null);
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    // Loading state
    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">Checkout</h1>
                    <p className="text-gray-500 mt-2">Complete your purchase securely</p>
                </div>

                {/* Progress Steps */}
                <div className="mb-10">
                    <div className="flex items-center justify-between max-w-2xl mx-auto">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${currentStep > step.id
                                            ? 'bg-green-500 text-white'
                                            : currentStep === step.id
                                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                                : 'bg-gray-200 text-gray-400'
                                            }`}
                                    >
                                        {currentStep > step.id ? (
                                            <Check size={20} />
                                        ) : (
                                            <step.icon size={20} />
                                        )}
                                    </div>
                                    <span
                                        className={`mt-2 text-xs font-medium hidden sm:block ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'
                                            }`}
                                    >
                                        {step.title}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={`w-12 sm:w-20 lg:w-32 h-1 mx-2 rounded transition-all duration-300 ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg max-w-3xl mx-auto">
                        <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Step 1: Cart Review */}
                            {currentStep === 1 && (
                                <div className="p-6 sm:p-8">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <ShoppingBag className="text-primary" size={24} />
                                        Review Your Cart
                                    </h2>
                                    <div className="space-y-4">
                                        {cartItems.map((item) => (
                                            <div
                                                key={item._id}
                                                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                                            >
                                                <div className="w-20 h-24 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                                                    <img
                                                        src={item.image || item.images?.[0]}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-gray-900 truncate">
                                                        {item.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">{item.category}</p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-sm text-gray-600">
                                                            Qty: {item.quantity}
                                                        </span>
                                                        <span className="font-bold text-primary">
                                                            ₹{(item.price * item.quantity).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 pt-6 border-t border-gray-100 text-sm text-gray-500">
                                        <Link to="/cart" className="text-primary hover:underline">
                                            ← Edit Cart
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Shipping Address */}
                            {currentStep === 2 && (
                                <div className="p-6 sm:p-8">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <MapPin className="text-primary" size={24} />
                                        Shipping Address
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Full Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="fullName"
                                                    value={shippingAddress.fullName}
                                                    onChange={handleShippingChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                    placeholder="Enter your full name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Phone Number *
                                                </label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={shippingAddress.phone}
                                                    onChange={handleShippingChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                    placeholder="10-digit mobile number"
                                                    maxLength={10}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Address *
                                            </label>
                                            <textarea
                                                name="address"
                                                value={shippingAddress.address}
                                                onChange={handleShippingChange}
                                                rows={3}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                                                placeholder="House No., Building, Street, Area"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    City *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="city"
                                                    value={shippingAddress.city}
                                                    onChange={handleShippingChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                    placeholder="City"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    State *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="state"
                                                    value={shippingAddress.state}
                                                    onChange={handleShippingChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                    placeholder="State"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    PIN Code *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="postalCode"
                                                    value={shippingAddress.postalCode}
                                                    onChange={handleShippingChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                    placeholder="6-digit PIN"
                                                    maxLength={6}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Order Review */}
                            {currentStep === 3 && (
                                <div className="p-6 sm:p-8">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <ClipboardCheck className="text-primary" size={24} />
                                        Review Your Order
                                    </h2>

                                    {/* Shipping Info */}
                                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-medium text-gray-900 flex items-center gap-2">
                                                <Truck size={18} className="text-gray-500" />
                                                Delivering To
                                            </h3>
                                            <button
                                                onClick={() => setCurrentStep(2)}
                                                className="text-sm text-primary hover:underline"
                                            >
                                                Change
                                            </button>
                                        </div>
                                        <p className="text-gray-700 font-medium">{shippingAddress.fullName}</p>
                                        <p className="text-gray-600 text-sm">{shippingAddress.phone}</p>
                                        <p className="text-gray-600 text-sm mt-1">
                                            {shippingAddress.address}, {shippingAddress.city},{' '}
                                            {shippingAddress.state} - {shippingAddress.postalCode}
                                        </p>
                                    </div>

                                    {/* Payment Method Selection */}
                                    <div className="mb-6">
                                        <h3 className="font-medium text-gray-900 mb-3">Payment Method</h3>
                                        <div className="space-y-3">
                                            <label
                                                className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'stripe'
                                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value="stripe"
                                                    checked={paymentMethod === 'stripe'}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                    className="w-4 h-4 text-primary focus:ring-primary"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <CreditCard size={20} className="text-indigo-600" />
                                                        <span className="font-medium">Pay Online</span>
                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Recommended</span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Cards, UPI, QR Code (GPay, PhonePe, Paytm)
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <div className="flex items-center gap-1 px-2 py-1 bg-white rounded border text-xs">
                                                        <QrCode size={12} />
                                                        UPI
                                                    </div>
                                                    <div className="flex items-center gap-1 px-2 py-1 bg-white rounded border text-xs">
                                                        <CreditCard size={12} />
                                                        Card
                                                    </div>
                                                    <div className="flex items-center gap-1 px-2 py-1 bg-white rounded border text-xs">
                                                        <Smartphone size={12} />
                                                        GPay
                                                    </div>
                                                </div>
                                            </label>
                                            <label
                                                className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'cod'
                                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value="cod"
                                                    checked={paymentMethod === 'cod'}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                    className="w-4 h-4 text-primary focus:ring-primary"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <Package size={20} className="text-green-600" />
                                                        <span className="font-medium">Cash on Delivery</span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Pay when your order arrives
                                                    </p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Order Items Summary */}
                                    <div>
                                        <h3 className="font-medium text-gray-900 mb-3">Order Items</h3>
                                        <div className="space-y-2">
                                            {cartItems.map((item) => (
                                                <div
                                                    key={item._id}
                                                    className="flex items-center justify-between py-2 text-sm"
                                                >
                                                    <span className="text-gray-700">
                                                        {item.name} × {item.quantity}
                                                    </span>
                                                    <span className="font-medium">
                                                        ₹{(item.price * item.quantity).toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Processing Payment */}
                            {currentStep === 4 && (
                                <div className="p-6 sm:p-8">
                                    <div className="text-center py-12">
                                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                            {processingPayment ? (
                                                <Loader2 className="animate-spin text-primary" size={32} />
                                            ) : (
                                                <CreditCard className="text-primary" size={32} />
                                            )}
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                                            {processingPayment ? 'Verifying Payment...' : 'Processing...'}
                                        </h2>
                                        <p className="text-gray-500">
                                            {processingPayment
                                                ? 'Please wait while we confirm your payment'
                                                : 'Razorpay checkout will open shortly'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            {currentStep !== 4 && (
                                <div className="px-6 sm:px-8 pb-6 sm:pb-8 flex items-center justify-between gap-4">
                                    <button
                                        onClick={prevStep}
                                        disabled={currentStep === 1}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${currentStep === 1
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        <ChevronLeft size={18} />
                                        Back
                                    </button>
                                    <button
                                        onClick={nextStep}
                                        disabled={loading}
                                        className="flex items-center gap-2 btn-primary px-8 py-3 shadow-lg hover:shadow-xl disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="animate-spin" size={18} />
                                                Processing...
                                            </>
                                        ) : currentStep === 3 ? (
                                            paymentMethod === 'cod' ? (
                                                'Place Order'
                                            ) : (
                                                <>
                                                    Pay ₹{totalPrice.toLocaleString()}
                                                    <ChevronRight size={18} />
                                                </>
                                            )
                                        ) : (
                                            <>
                                                Continue
                                                <ChevronRight size={18} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
                            <h2 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wider">
                                Order Summary
                            </h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal ({cartItems.length} items)</span>
                                    <span>₹{itemsPrice.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping</span>
                                    <span className={shippingPrice === 0 ? 'text-green-600 font-medium' : ''}>
                                        {shippingPrice === 0 ? 'FREE' : `₹${shippingPrice}`}
                                    </span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>GST (5%)</span>
                                    <span>₹{taxPrice.toLocaleString()}</span>
                                </div>
                                <div className="border-t border-gray-100 pt-4 flex justify-between font-bold text-lg text-gray-900">
                                    <span>Total</span>
                                    <span className="text-primary">₹{totalPrice.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Promo Section */}
                            {shippingPrice === 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
                                    <p className="text-green-700 text-sm flex items-center gap-2">
                                        <Check size={16} />
                                        You're getting FREE shipping!
                                    </p>
                                </div>
                            )}

                            {/* Trust Badges */}
                            <div className="space-y-3 text-sm text-gray-500">
                                <div className="flex items-center gap-3">
                                    <Shield className="text-green-600 flex-shrink-0" size={18} />
                                    <span>100% Secure Payments</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Truck className="text-blue-600 flex-shrink-0" size={18} />
                                    <span>Free Shipping on orders above ₹5,000</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Package className="text-orange-600 flex-shrink-0" size={18} />
                                    <span>Easy 7-day returns</span>
                                </div>
                            </div>

                            {/* Payment Provider */}
                            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                                <p className="text-xs text-gray-400 mb-2">Secured by</p>
                                <div className="flex items-center justify-center gap-2">
                                    <Lock size={14} className="text-gray-400" />
                                    <span className="font-medium text-gray-600">Razorpay</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;

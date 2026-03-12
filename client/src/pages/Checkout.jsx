import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { createOrder, createStripeCheckoutSession, validateCoupon, getActiveCoupons, getUserAddresses, addUserAddress, updateUserAddress } from '../services/api';

const FREE_SHIPPING_THRESHOLD = 2000;  // ₹2000
const SHIPPING_CHARGE         = 99;   // ₹99 below threshold
const FIRST_ORDER_DISCOUNT    = 0.10; // 10%
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
    Lock,
    Package,
    QrCode,
    Smartphone,
    Tag,
    X,
    CheckCircle2,
    Plus,
    Edit2,
    Trash,
    Phone
} from 'lucide-react';
import Loader from '../components/Loader';

// Main Checkout Component
const Checkout = () => {
    const navigate = useNavigate();
    const { cartItems, user, clearCart, isFirstOrder } = useContext(ShopContext);
    const [currentStep, setCurrentStep] = useState(1);
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [error, setError] = useState(null);

    // Coupon State
    const [couponInput, setCouponInput] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState(null);
    const [appliedCoupon, setAppliedCoupon] = useState(null); // { couponCode, discountType, discountValue, _id }
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
    const [activeCoupons, setActiveCoupons] = useState([]);

    // Address State
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [loadingAddresses, setLoadingAddresses] = useState(false);

    useEffect(() => {
        const fetchSavedAddresses = async () => {
            if (user) {
                setLoadingAddresses(true);
                try {
                    console.log('Fetching addresses for user:', user._id);
                    const { data } = await getUserAddresses();
                    console.log('Addresses received:', data);
                    const addresses = Array.isArray(data) ? data : [];
                    setSavedAddresses(addresses);
                    
                    // Auto-select default address
                    const defaultAddr = addresses.find(addr => addr.isDefault);
                    if (defaultAddr) {
                        setSelectedAddressId(defaultAddr._id);
                        setShippingAddress(defaultAddr);
                        setIsAddingNewAddress(false);
                    } else if (addresses.length > 0) {
                        setSelectedAddressId(addresses[0]._id);
                        setShippingAddress(addresses[0]);
                        setIsAddingNewAddress(false);
                    } else {
                        setIsAddingNewAddress(true);
                        // Pre-fill name from profile if new user
                        setShippingAddress(prev => ({ ...prev, fullName: user.name || '' }));
                    }
                } catch (err) {
                    console.error('Failed to fetch addresses:', err);
                    setIsAddingNewAddress(true);
                } finally {
                    setLoadingAddresses(false);
                }
            }
        };
        fetchSavedAddresses();
    }, [user]);

    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                const { data } = await getActiveCoupons();
                setActiveCoupons(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Failed to fetch active coupons:', error);
            }
        };
        fetchCoupons();
    }, []);

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
    const itemsPrice    = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shippingPrice = itemsPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
    // isFirstOrder comes from ShopContext (persisted via localStorage)
    const firstOrderDiscount = isFirstOrder ? Math.round(itemsPrice * FIRST_ORDER_DISCOUNT) : 0;
    const totalBeforeCoupon  = itemsPrice + shippingPrice - firstOrderDiscount;
    const totalPrice         = Math.max(totalBeforeCoupon - couponDiscount, 0);

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

    const handleSelectSavedAddress = (addr) => {
        setSelectedAddressId(addr._id);
        setShippingAddress(addr);
        setIsAddingNewAddress(false);
        setEditingAddressId(null);
    };

    const handleAddNewAddressClick = () => {
        setSelectedAddressId(null);
        setEditingAddressId(null);
        setShippingAddress({
            fullName: user?.name || '',
            phone: '',
            address: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'India'
        });
        setIsAddingNewAddress(true);
    };

    const handleEditAddressClick = (addr) => {
        setEditingAddressId(addr._id);
        setSelectedAddressId(null);
        setShippingAddress(addr);
        setIsAddingNewAddress(true);
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

    // ─── Coupon Handling ───────────────────────────────────────────────────────
    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) {
            setCouponError('Please enter a coupon code');
            return;
        }
        setCouponLoading(true);
        setCouponError(null);
        try {
            const { data } = await validateCoupon(couponInput.trim(), itemsPrice);
            setAppliedCoupon(data.coupon);
            setCouponDiscount(data.discountAmount);
            setCouponInput('');
        } catch (err) {
            setCouponError(err.response?.data?.message || 'Invalid coupon code');
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponError(null);
        setCouponInput('');
    };

    const handleApplySpecificCoupon = async (code) => {
        setCouponInput(code);
        setCouponLoading(true);
        setCouponError(null);
        try {
            const { data } = await validateCoupon(code, itemsPrice);
            setAppliedCoupon(data.coupon);
            setCouponDiscount(data.discountAmount);
            setIsCouponModalOpen(false); // Close modal on success
        } catch (err) {
            setCouponError(err.response?.data?.message || 'Invalid coupon code');
        } finally {
            setCouponLoading(false);
        }
    };

    // ─── Payment Handlers ──────────────────────────────────────────────────────

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
                taxPrice: 0,
                shippingPrice,
                totalPrice,
                couponCode: appliedCoupon?.couponCode || null,
                couponDiscount: couponDiscount || 0,
                couponId: appliedCoupon?._id || null,
            };

            // Create Stripe checkout session
            const { data } = await createStripeCheckoutSession(orderData);
            setOrder(data.order);

            // Save/Update address before redirecting to Stripe
            if (isAddingNewAddress) {
                try {
                    if (editingAddressId) {
                        await updateUserAddress(editingAddressId, shippingAddress);
                    } else {
                        await addUserAddress({ ...shippingAddress, isDefault: savedAddresses.length === 0 });
                    }
                } catch (addrErr) {
                    console.error('Failed to save address:', addrErr);
                }
            }

            if (data.sessionUrl) {
                // Clear cart locally since order is now 'pending' in DB and reserved
                // (Optional: depending on if you want to clear before or after successful payment)
                // For better UX we often wait for success, but here we redirect.
                window.location.href = data.sessionUrl;
            } else {
                setError('Failed to create payment session');
                setLoading(false);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to initialize Stripe payment');
            setLoading(false);
        }
    }, [cartItems, shippingAddress, itemsPrice, shippingPrice, totalPrice, appliedCoupon, couponDiscount]);

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
                taxPrice: 0,
                shippingPrice,
                totalPrice,
                couponCode: appliedCoupon?.couponCode || null,
                couponDiscount: couponDiscount || 0,
                couponId: appliedCoupon?._id || null,
            };

            const { data } = await createOrder(orderData);
            setOrder(data.order);

            // Save/Update address after successful order if it's new or edited
            if (isAddingNewAddress) {
                try {
                    if (editingAddressId) {
                        await updateUserAddress(editingAddressId, shippingAddress);
                    } else {
                        await addUserAddress({ ...shippingAddress, isDefault: savedAddresses.length === 0 });
                    }
                } catch (addrErr) {
                    console.error('Failed to save address:', addrErr);
                }
            }

            // COD order - redirect to success
            clearCart();
            navigate('/order-success', { state: { order: data.order } });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create order. Please try again.');
            setLoading(false);
        }
    };

    const nextStep = async () => {
        if (currentStep === 2) {
            if (!validateShipping()) return;
            
            // If it's a new or edited address, save it to the profile now so they don't lose it
            if (isAddingNewAddress && shippingAddress.saveToProfile !== false) {
                setLoading(true); // Reuse loading for saving
                try {
                    console.log('Explicitly saving address at Step 2');
                    if (editingAddressId) {
                        await updateUserAddress(editingAddressId, shippingAddress);
                    } else {
                        const { data } = await addUserAddress({ ...shippingAddress, isDefault: savedAddresses.length === 0 });
                        // If it's a new address, the backend returns the saved address with an _id
                        if (data && data._id) {
                            setSelectedAddressId(data._id);
                            setShippingAddress(data);
                        }
                    }
                    // Refresh saved addresses list
                    const addrRes = await getUserAddresses();
                    setSavedAddresses(addrRes.data || []);
                    setIsAddingNewAddress(false);
                    setEditingAddressId(null);
                } catch (addrErr) {
                    console.error('Failed to save address:', addrErr);
                    // We still let them proceed to review even if saving fails, 
                    // as long as the local state is valid
                } finally {
                    setLoading(false);
                }
            }
        }
        
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
        return <Loader fullScreen text="Checking authentication..." />;
    }

    return (
        <div className="bg-linear-to-b from-gray-50 to-white dark:from-slate-950 dark:to-gray-900 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            {/* Overlay loader when applying coupon */}
            {couponLoading && (
                <div className="fixed inset-0 z-100 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
                    <Loader fullScreen={false} text="Applying Coupon..." />
                </div>
            )}

            {/* Overlay loader when placing order */}
            {loading && (
                <div className="fixed inset-0 z-100 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
                    <Loader fullScreen={false} text="Processing Order..." />
                </div>
            )}

            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white">Checkout</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Complete your purchase securely</p>
                </div>

                {/* Progress Steps */}
                <div className="mb-10">
                    <div className="flex items-center justify-between max-w-2xl mx-auto">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${currentStep > step.id
                                            ? 'bg-green-500 text-white'
                                            : currentStep === step.id
                                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                            }`}
                                    >
                                        {currentStep > step.id ? (
                                            <Check size={18} className="sm:w-[20px] sm:h-[20px]" />
                                        ) : (
                                            <step.icon size={18} className="sm:w-[20px] sm:h-[20px]" />
                                        )}
                                    </div>
                                    <span
                                        className={`mt-2 text-xs font-medium hidden sm:block ${currentStep >= step.id ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                                            }`}
                                    >
                                        {step.title}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={`w-6 sm:w-20 lg:w-32 h-1 mx-2 rounded transition-all duration-300 ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg max-w-3xl mx-auto shadow-sm">
                        <div className="flex items-start gap-3 w-full sm:w-auto">
                            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                            <p className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
                        </div>
                        {error.toLowerCase().includes('stock') && (
                            <Link 
                                to="/cart" 
                                className="w-full sm:w-auto text-center px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-sm font-bold rounded-lg hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors whitespace-nowrap"
                            >
                                FIX CART
                            </Link>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                            {/* Step 1: Cart Review */}
                            {currentStep === 1 && (
                                <div className="p-6 sm:p-8">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                        <ShoppingBag className="text-primary" size={24} />
                                        Review Your Cart
                                    </h2>
                                    <div className="space-y-4">
                                        {cartItems.map((item) => (
                                            <div
                                                key={item._id}
                                                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                            >
                                                <div className="w-20 h-24 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden shrink-0">
                                                    <img
                                                        src={item.image || item.images?.[0]}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                                        {item.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.category}</p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">
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
                                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
                                        <Link to="/cart" className="text-primary hover:underline">
                                            ← Edit Cart
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Shipping Address */}
                            {currentStep === 2 && (
                                <div className="p-6 sm:p-8">
                                    {loadingAddresses ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <Loader small text="Loading saved addresses..." />
                                        </div>
                                    ) : !isAddingNewAddress && selectedAddressId ? (
                                        // Show selected delivery address in a clean card
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                                    Delivery Address
                                                </h2>
                                                <button 
                                                    onClick={() => {
                                                        setSelectedAddressId(null);
                                                        setIsAddingNewAddress(false);
                                                    }}
                                                    className="text-orange-600 dark:text-orange-500 font-semibold text-sm border-b-2 border-orange-600 dark:border-orange-500 hover:opacity-80 transition-opacity"
                                                >
                                                    Change
                                                </button>
                                            </div>
                                            
                                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800/50">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-start gap-3 flex-1">
                                                        <MapPin className="text-gray-400 dark:text-gray-500 shrink-0 mt-1" size={20} />
                                                        <div>
                                                            <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">
                                                                {shippingAddress.fullName}
                                                            </h3>
                                                            <div className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed space-y-0.5">
                                                                <p>{shippingAddress.address}</p>
                                                                <p>{shippingAddress.city}, {shippingAddress.state}</p>
                                                                <p>{shippingAddress.country} - {shippingAddress.postalCode}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 shrink-0">
                                                        <Phone size={16} className="text-gray-400" />
                                                        <span className="font-medium text-sm">{shippingAddress.phone}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : !isAddingNewAddress ? (
                                        // Show address selection
                                        <div>
                                            <div className="flex justify-between items-start mb-1">
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                                        Choose an address
                                                    </h2>
                                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                                        Please select a delivery address for the shipment
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={handleAddNewAddressClick}
                                                    className="text-orange-600 dark:text-orange-500 font-semibold text-sm border-b-2 border-dotted border-orange-600 dark:border-orange-500 hover:opacity-80 transition-opacity shrink-0"
                                                >
                                                    Add Address
                                                </button>
                                            </div>

                                            <div className="h-px bg-gray-200 dark:bg-gray-700 w-full my-5"></div>

                                            {savedAddresses.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {savedAddresses.map((addr) => (
                                                        <div 
                                                            key={addr._id}
                                                            onClick={() => handleSelectSavedAddress(addr)}
                                                            className={`relative p-5 rounded-lg border-2 transition-all cursor-pointer ${
                                                                selectedAddressId === addr._id 
                                                                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' 
                                                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                                                            }`}
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h3 className="font-bold text-gray-900 dark:text-white text-base pr-2">
                                                                    {addr.fullName}
                                                                </h3>
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleEditAddressClick(addr); }}
                                                                    className="text-orange-600 dark:text-orange-500 font-semibold text-xs border-b border-orange-600 dark:border-orange-500 hover:opacity-80 shrink-0"
                                                                >
                                                                    Edit
                                                                </button>
                                                            </div>
                                                            <div className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed space-y-0.5">
                                                                <p>{addr.address}</p>
                                                                <p>{addr.city}, {addr.state}</p>
                                                                <p>{addr.country} - {addr.postalCode}</p>
                                                                <p className="mt-2 text-gray-700 dark:text-gray-300 font-medium">
                                                                    {addr.phone}
                                                                </p>
                                                            </div>
                                                            {addr.isDefault && (
                                                                <div className="mt-3">
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">
                                                                        Default
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                                    <MapPin className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No Saved Addresses</h3>
                                                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto text-sm">
                                                        You haven't saved any addresses yet. Add one to continue your purchase.
                                                    </p>
                                                    <button 
                                                        onClick={handleAddNewAddressClick}
                                                        className="btn-primary px-8 py-3 rounded-lg shadow-lg hover:shadow-xl font-bold flex items-center gap-2 mx-auto"
                                                    >
                                                        <Plus size={18} />
                                                        Add New Address
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // Add/Edit Address Form
                                        <div>
                                            <div className="flex justify-between items-start mb-1">
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                                        {editingAddressId ? 'Edit Address' : 'Add New Address'}
                                                    </h2>
                                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                                        Please enter the delivery details
                                                    </p>
                                                </div>
                                                {savedAddresses.length > 0 && (
                                                    <button 
                                                        onClick={() => {
                                                            setIsAddingNewAddress(false);
                                                            setEditingAddressId(null);
                                                            if (savedAddresses.length > 0) {
                                                                const current = savedAddresses.find(a => a._id === selectedAddressId) || savedAddresses[0];
                                                                handleSelectSavedAddress(current);
                                                            }
                                                        }}
                                                        className="text-orange-600 dark:text-orange-500 font-semibold text-sm hover:underline transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>

                                            <div className="h-px bg-gray-200 dark:bg-gray-700 w-full my-5"></div>

                                            <div className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Full Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="fullName"
                                                        value={shippingAddress.fullName}
                                                        onChange={handleShippingChange}
                                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                        placeholder="Enter your full name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Phone Number *
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        name="phone"
                                                        value={shippingAddress.phone}
                                                        onChange={handleShippingChange}
                                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                        placeholder="10-digit mobile number"
                                                        maxLength={10}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Address *
                                                </label>
                                                <textarea
                                                    name="address"
                                                    value={shippingAddress.address}
                                                    onChange={handleShippingChange}
                                                    rows={3}
                                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                                                    placeholder="House No., Building, Street, Area"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        City *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="city"
                                                        value={shippingAddress.city}
                                                        onChange={handleShippingChange}
                                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                        placeholder="City"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        State *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="state"
                                                        value={shippingAddress.state}
                                                        onChange={handleShippingChange}
                                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                        placeholder="State"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        PIN Code *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="postalCode"
                                                        value={shippingAddress.postalCode}
                                                        onChange={handleShippingChange}
                                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                        placeholder="6-digit PIN"
                                                        maxLength={6}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 mt-6 ml-1">
                                                <input
                                                    type="checkbox"
                                                    id="saveAddress"
                                                    checked={shippingAddress.saveToProfile !== false}
                                                    onChange={(e) => setShippingAddress({ ...shippingAddress, saveToProfile: e.target.checked })}
                                                    className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                                                />
                                                <label htmlFor="saveAddress" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                                                    Save this address for future orders
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    )}
                                </div>
                            )}

                            {/* Step 3: Order Review */}
                            {currentStep === 3 && (
                                <div className="p-6 sm:p-8">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                        <ClipboardCheck className="text-primary" size={24} />
                                        Review Your Order
                                    </h2>

                                    {/* Shipping Info Block - Matching Image */}
                                    <div className="mb-8">
                                        <div className="flex justify-between items-start mb-4">
                                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                                Delivery Address
                                            </h2>
                                            <button
                                                onClick={() => setCurrentStep(2)}
                                                className="text-orange-600 dark:text-orange-500 font-semibold text-sm border-b-2 border-orange-600 dark:border-orange-500 hover:opacity-80 transition-opacity"
                                            >
                                                Change
                                            </button>
                                        </div>
                                        
                                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800/50">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <MapPin className="text-gray-400 dark:text-gray-500 shrink-0 mt-1" size={20} />
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">
                                                            {shippingAddress.fullName}
                                                        </h3>
                                                        <div className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed space-y-0.5">
                                                            <p>{shippingAddress.address}</p>
                                                            <p>{shippingAddress.city}, {shippingAddress.state}</p>
                                                            <p>{shippingAddress.country} - {shippingAddress.postalCode}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 shrink-0">
                                                    <Phone size={16} className="text-gray-400" />
                                                    <span className="font-medium text-sm">{shippingAddress.phone}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Method Selection */}
                                    <div className="mb-6">
                                        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Payment Method</h3>
                                        <div className="space-y-3">
                                            <label
                                                className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'stripe'
                                                    ? 'border-[#8c1c1c] bg-[#fcf5f5] ring-0'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value="stripe"
                                                    checked={paymentMethod === 'stripe'}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                    className="w-4 h-4 text-[#0066ff] focus:ring-[#0066ff] cursor-pointer"
                                                />
                                                <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <CreditCard size={18} className="text-[#3b2dff]" />
                                                            <span className="font-medium text-gray-900 dark:text-white text-[15px]">Pay Online</span>
                                                            <span className="text-[11px] font-medium bg-[#ccf0dd] text-[#00703c] px-2 py-0.5 rounded-full ml-1">Recommended</span>
                                                        </div>
                                                        <p className="text-[13px] text-gray-500 dark:text-gray-400">
                                                            Cards, UPI, QR Code (GPay, PhonePe, Paytm)
                                                        </p>
                                                    </div>
                                                    
                                                    {/* Payment Method Badges */}
                                                    <div className="flex flex-wrap gap-2 items-center">
                                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 text-xs text-gray-700 dark:text-gray-300 font-medium">
                                                            <QrCode size={12} className="text-gray-600 dark:text-gray-400" />
                                                            UPI
                                                        </div>
                                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 text-xs text-gray-700 dark:text-gray-300 font-medium">
                                                            <CreditCard size={12} className="text-gray-600 dark:text-gray-400" />
                                                            Card
                                                        </div>
                                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 text-xs text-gray-700 dark:text-gray-300 font-medium">
                                                            <Smartphone size={12} className="text-gray-600 dark:text-gray-400" />
                                                            GPay
                                                        </div>
                                                    </div>
                                                </div>
                                            </label>

                                            {/* Cash On Delivery */}
                                            <label
                                                className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'cod'
                                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
                                                        <Package size={20} className="text-amber-600" />
                                                        <span className="font-medium">Cash on Delivery</span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        Pay when your order arrives
                                                    </p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Order Items Summary */}
                                    <div>
                                        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Order Items</h3>
                                        <div className="space-y-2">
                                            {cartItems.map((item) => (
                                                <div
                                                    key={item._id}
                                                    className="flex items-center justify-between py-2 text-sm"
                                                >
                                                    <span className="text-gray-700 dark:text-gray-300">
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
                                                <Loader small text="" />
                                            ) : (
                                                <CreditCard className="text-primary" size={32} />
                                            )}
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                            {processingPayment ? 'Verifying Payment...' : 'Processing...'}
                                        </h2>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            {processingPayment
                                                ? 'Please wait while we confirm your payment'
                                                : 'Stripe checkout will open shortly'}
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
                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
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
                                            <Loader small text="Processing..." />
                                        ) : currentStep === 3 ? (
                                            paymentMethod === 'cod' ? (
                                                'Place Order'
                                            ) : (
                                                <>
                                                    Pay ₹{totalPrice.toLocaleString()} →
                                                    <ChevronRight size={18} />
                                                </>
                                            )
                                        ) : (
                                            <>
                                                {currentStep === 2 && isAddingNewAddress ? 'SAVE & CONTINUE' : 'Continue'}
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
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sticky top-24">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">
                                Order Summary
                            </h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>Subtotal ({cartItems.length} items)</span>
                                    <span>₹{itemsPrice.toLocaleString()}</span>
                                </div>

                                {/* First-order discount */}
                                {isFirstOrder && (
                                    <div className="flex justify-between text-green-600 dark:text-green-400 font-medium">
                                        <span className="flex items-center gap-1 text-sm">
                                            🎉 First Order Discount (10%)
                                        </span>
                                        <span>− ₹{firstOrderDiscount.toLocaleString()}</span>
                                    </div>
                                )}

                                {/* Shipping */}
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>Shipping</span>
                                    <span className={shippingPrice === 0 ? 'text-green-600 font-semibold' : ''}>
                                        {shippingPrice === 0 ? 'FREE' : `₹${shippingPrice}`}
                                    </span>
                                </div>

                                {shippingPrice > 0 && (
                                    <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                                        Add ₹{(FREE_SHIPPING_THRESHOLD - itemsPrice).toLocaleString()} more for FREE shipping
                                    </p>
                                )}

                                {/* Coupon Discount line */}
                                {appliedCoupon && couponDiscount > 0 && (
                                    <div className="flex justify-between text-green-600 dark:text-green-400 font-medium">
                                        <span className="flex items-center gap-1 text-sm">
                                            <Tag size={14} />
                                            Coupon ({appliedCoupon.couponCode})
                                        </span>
                                        <span>− ₹{couponDiscount.toLocaleString()}</span>
                                    </div>
                                )}

                                <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex justify-between font-bold text-lg text-gray-900 dark:text-white">
                                    <span>Total</span>
                                    <span className="text-primary">₹{totalPrice.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* ─── Coupon Section ─────────────────────────────────── */}
                            {/* ─── Offers Section (Click to Open Modal) ─────────────────────────── */}
                            <div className="mb-6">
                                {appliedCoupon ? (
                                    // Applied coupon badge
                                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg cursor-pointer" onClick={() => setIsCouponModalOpen(true)}>
                                        <div className="flex-1 min-w-0 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                                <Tag size={16} className="fill-red-600 text-red-600" />
                                            </div>
                                            <div>
                                                <p className="text-gray-900 dark:text-gray-100 font-semibold text-sm tracking-wide">
                                                    1 Offer Applied
                                                </p>
                                                <p className="text-red-600 dark:text-red-400 text-xs font-medium">
                                                    You saved ₹{couponDiscount.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveCoupon();
                                            }}
                                            className="text-red-600 font-semibold text-sm hover:underline transition-all"
                                            title="Remove coupon"
                                        >
                                            REMOVE
                                        </button>
                                    </div>
                                ) : (
                                    // Coupon trigger box
                                    <div 
                                        onClick={() => setIsCouponModalOpen(true)}
                                        className="flex flex-col gap-2 p-3 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/50 rounded-lg cursor-pointer hover:bg-red-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                                <Tag size={16} className="fill-red-600 text-red-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-gray-900 dark:text-white font-semibold text-sm tracking-wide">
                                                    Apply Coupon
                                                </p>
                                            </div>
                                            <ChevronRight size={18} className="text-red-600" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Savings summary */}
                            {(shippingPrice === 0 || isFirstOrder || couponDiscount > 0) && (
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-6 space-y-1">
                                    {shippingPrice === 0 && (
                                        <p className="text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
                                            <Check size={16} /> FREE shipping applied!
                                        </p>
                                    )}
                                    {isFirstOrder && (
                                        <p className="text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
                                            <Check size={16} /> 10% first order discount — saving ₹{firstOrderDiscount.toLocaleString()}!
                                        </p>
                                    )}
                                    {couponDiscount > 0 && (
                                        <p className="text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
                                            <Check size={16} /> Coupon {appliedCoupon?.couponCode} — saving ₹{couponDiscount.toLocaleString()}!
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Trust Badges */}
                            <div className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-3">
                                    <Shield className="text-green-600 shrink-0" size={18} />
                                    <span>100% Secure Payments</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Truck className="text-blue-600 shrink-0" size={18} />
                                    <span>Free Shipping on orders above ₹2,000</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Package className="text-orange-600 shrink-0" size={18} />
                                    <span>Easy 3-day returns (wrong/damaged items)</span>
                                </div>
                            </div>

                            {/* Payment Provider */}
                            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
                                <p className="text-xs text-gray-400 mb-2">Secured by</p>
                                <div className="flex items-center justify-center gap-2">
                                    <Lock size={14} className="text-gray-400" />
                                    <span className="font-medium text-gray-600 dark:text-gray-400">Stripe</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Coupons Modal ──────────────────────────────────────────────── */}
            {isCouponModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsCouponModalOpen(false)}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Header */}
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-10 sticky top-0">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Offers & Coupons</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Below offers you can apply on your cart</p>
                            </div>
                            <button onClick={() => setIsCouponModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-5 bg-gray-50 dark:bg-gray-950 flex-1">
                            
                            {/* Manual Enter Form */}
                            <div className={`mb-6 bg-white dark:bg-gray-800 rounded-xl border ${couponError ? 'border-[#e66c61]' : 'border-gray-200 dark:border-gray-700'} p-2 shadow-sm flex items-center focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500 transition-all`}>
                                <input
                                    type="text"
                                    value={couponInput}
                                    onChange={(e) => {
                                        setCouponInput(e.target.value.toUpperCase());
                                        setCouponError(null);
                                    }}
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium tracking-wide uppercase px-3 py-2 text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
                                    placeholder="Enter Coupon Code"
                                />
                                {couponError ? (
                                    <button 
                                        onClick={() => { setCouponInput(''); setCouponError(null); }}
                                        className="w-10 h-10 flex items-center justify-center text-[#e66c61] border border-[#e66c61] rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mr-1 shrink-0"
                                    >
                                        <X size={18} />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleApplyCoupon}
                                        disabled={couponLoading || !couponInput.trim()}
                                        className="px-4 py-2 text-[#e66c61] font-bold uppercase text-sm hover:text-red-700 disabled:opacity-50 transition-colors shrink-0"
                                    >
                                        {couponLoading && !appliedCoupon ? '...' : 'APPLY'}
                                    </button>
                                )}
                            </div>
                            {couponError && (
                                <p className="mb-4 text-sm font-medium text-[#e66c61] px-2 -mt-4">
                                    {couponError}
                                </p>
                            )}

                            {/* Active Offers List */}
                            <div className="space-y-4">
                                {activeCoupons.map((coupon) => {
                                    // Calculate if applicable based on current itemsPrice
                                    const isApplicable = itemsPrice >= coupon.minimumPurchaseAmount;
                                    const amountNeeded = coupon.minimumPurchaseAmount - itemsPrice;
                                    const ribbonLabel = coupon.discountType === 'percentage' 
                                        ? `${coupon.discountValue}% OFF` 
                                        : `FLAT ₹${coupon.discountValue}`;

                                    return (
                                        <div 
                                            key={coupon._id} 
                                            className={`relative flex bg-white dark:bg-gray-800 rounded-lg overflow-hidden border ${isApplicable ? 'border-red-200 dark:border-red-800 shadow-sm' : 'border-gray-200 dark:border-gray-700 opacity-80'}`}
                                        >
                                            {/* Ribbon (Left side) */}
                                            <div className={`w-12 flex items-center justify-center writing-vertical-r transform rotate-180 p-2 text-white font-bold text-sm text-center ${isApplicable ? 'bg-[#b64b5a]' : 'bg-gray-400'}`}>
                                                <span className="truncate max-w-30 pb-1">{ribbonLabel}</span>
                                            </div>

                                            {/* Zig-Zag separator */}
                                            <div className="h-full border-r-[3px] border-dashed border-gray-100 dark:border-gray-900 bg-transparent absolute left-12 w-1 shadow-sm"></div>

                                            {/* Content */}
                                            <div className="p-4 flex-1 flex flex-col justify-between pl-6 relative">
                                                <div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <Tag size={16} className={isApplicable ? "text-[#b64b5a]" : "text-gray-400"} />
                                                            <span className={`font-bold tracking-wide uppercase ${isApplicable ? 'text-[#b64b5a]' : 'text-gray-500'}`}>
                                                                {coupon.couponCode}
                                                            </span>
                                                        </div>
                                                        {isApplicable ? (
                                                            <button 
                                                                onClick={() => handleApplySpecificCoupon(coupon.couponCode)}
                                                                className="text-[#b64b5a] text-sm font-semibold hover:underline"
                                                                disabled={appliedCoupon?.couponCode === coupon.couponCode}
                                                            >
                                                                {appliedCoupon?.couponCode === coupon.couponCode ? 'Applied' : 'Tap to Apply'}
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs font-medium uppercase">
                                                                Not Applicable
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <p className="text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
                                                        {coupon.description || `${coupon.discountType === 'percentage' ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} discount`} on this order`}
                                                    </p>
                                                </div>

                                                <div className="mt-2 text-xs font-semibold">
                                                    {isApplicable ? (
                                                        <span className="text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded inline-block">
                                                            Save ₹{coupon.discountType === 'percentage' 
                                                                ? Math.round((coupon.discountValue / 100) * itemsPrice) 
                                                                : coupon.discountValue} on this order
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded inline-block">
                                                            Add ₹{amountNeeded.toLocaleString()} to avail this offer
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {activeCoupons.length === 0 && (
                                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                                        <Tag size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                        <p>No active coupons available right now.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <style jsx>{`
                .writing-vertical-r {
                    writing-mode: vertical-rl;
                    text-orientation: mixed;
                }
            `}</style>
        </div>
    );
};

export default Checkout;

import React, { useContext } from 'react';
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft, Truck, Tag, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';

const FREE_SHIPPING_THRESHOLD = 2000;   // ₹2000
const SHIPPING_CHARGE        = 99;      // ₹99 below threshold
const FIRST_ORDER_DISCOUNT   = 0.10;   // 10%

const Cart = () => {
    const { cartItems, removeFromCart, updateQuantity, isFirstOrder } = useContext(ShopContext);

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // Shipping: free above ₹2000
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;

    // First-order discount: from context (persisted in localStorage)
    const discountAmount = isFirstOrder ? Math.round(subtotal * FIRST_ORDER_DISCOUNT) : 0;

    const total = subtotal + shipping - discountAmount;
    const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;

    return (
        <div className="bg-gray-50 dark:bg-slate-950 min-h-screen pt-8 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-8">Shopping Bag</h1>

                {cartItems.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-sm shadow-sm">
                        <h2 className="text-2xl font-serif text-gray-400 dark:text-gray-500 mb-4">Your bag is empty</h2>
                        <Link to="/products" className="btn-primary inline-flex items-center">
                            Start Shopping <ArrowRight size={18} className="ml-2" />
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Cart Items */}
                        <div className="flex-1 bg-white dark:bg-gray-900 p-6 rounded-sm shadow-sm">

                            {/* Free-shipping progress bar */}
                            {subtotal < FREE_SHIPPING_THRESHOLD && (
                                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Truck size={16} className="text-amber-700 dark:text-amber-400" />
                                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                                            Add <span className="font-bold">₹{amountToFreeShipping.toLocaleString()}</span> more to get <span className="font-bold">FREE shipping!</span>
                                        </p>
                                    </div>
                                    <div className="w-full bg-amber-200 dark:bg-amber-800 rounded-full h-2">
                                        <div
                                            className="bg-amber-600 dark:bg-amber-400 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* First-order discount banner */}
                            {isFirstOrder && (
                                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
                                    <Tag size={18} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-green-800 dark:text-green-300">🎉 First Order Discount Applied!</p>
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                                            You're saving <span className="font-bold">₹{discountAmount.toLocaleString()}</span> (10% off) on your first order.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-6">
                                {cartItems.map((item) => (
                                    <div key={item._id} className="flex flex-col sm:flex-row border-b border-gray-100 dark:border-gray-800 pb-6 last:border-0 last:pb-0">
                                        <div className="w-full sm:w-32 h-40 bg-gray-100 dark:bg-gray-800 mb-4 sm:mb-0">
                                            <img src={item.image || item.images?.[0]} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 sm:ml-6 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{item.name}</h3>
                                                    <button
                                                        onClick={() => removeFromCart(item._id)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">{item.category}</p>
                                            </div>

                                            <div className="flex justify-between items-end mt-4">
                                                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-sm">
                                                    <button
                                                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                                        className="p-2 hover:text-primary"
                                                    >
                                                        <Minus size={16} />
                                                    </button>
                                                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                                        className="p-2 hover:text-primary"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                                <div className="font-bold text-lg text-primary">₹{(item.price * item.quantity).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                                <Link to="/products" className="inline-flex items-center text-primary font-medium hover:underline text-sm uppercase tracking-wide">
                                    <ArrowLeft size={16} className="mr-2" /> Continue Shopping
                                </Link>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="w-full lg:w-96">
                            <div className="bg-white dark:bg-gray-900 p-6 rounded-sm shadow-sm sticky top-24">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">Order Summary</h2>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                        <span>Subtotal</span>
                                        <span>₹{subtotal.toLocaleString()}</span>
                                    </div>

                                    {/* Discount row */}
                                    {isFirstOrder && (
                                        <div className="flex justify-between text-green-600 dark:text-green-400 font-medium">
                                            <span className="flex items-center gap-1">
                                                <Tag size={14} />
                                                First Order Discount (10%)
                                            </span>
                                            <span>− ₹{discountAmount.toLocaleString()}</span>
                                        </div>
                                    )}

                                    {/* Shipping row */}
                                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Truck size={14} />
                                            Shipping
                                        </span>
                                        {shipping === 0 ? (
                                            <span className="text-green-600 font-semibold">FREE</span>
                                        ) : (
                                            <span>₹{shipping}</span>
                                        )}
                                    </div>

                                    {/* Free shipping nudge */}
                                    {shipping > 0 && (
                                        <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                                            Add ₹{amountToFreeShipping.toLocaleString()} more for FREE shipping
                                        </p>
                                    )}

                                    <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex justify-between font-bold text-lg text-gray-900 dark:text-white">
                                        <span>Total</span>
                                        <span>₹{total.toLocaleString()}</span>
                                    </div>
                                </div>

                                {shipping === 0 && (
                                    <div className="mb-4 flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
                                        <Truck size={16} />
                                        You qualify for FREE shipping!
                                    </div>
                                )}

                                <Link to="/checkout" className="block text-center w-full btn-primary py-4 text-base shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
                                    Proceed to Checkout
                                </Link>

                                <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
                                    <p>Secure Checkout — SSL Encrypted</p>
                                    {shipping === 0
                                        ? <p className="mt-1 text-green-600 font-medium">✓ Free shipping applied</p>
                                        : <p className="mt-1">Free shipping on orders above ₹2,000</p>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;

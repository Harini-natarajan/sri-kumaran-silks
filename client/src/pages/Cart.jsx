import React, { useContext } from 'react';
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';

const Cart = () => {
    const { cartItems, removeFromCart, updateQuantity } = useContext(ShopContext);

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shipping = 0; // Free shipping
    const total = subtotal + shipping;

    return (
        <div className="bg-gray-50 min-h-screen pt-8 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8">Shopping Bag</h1>

                {cartItems.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-sm shadow-sm">
                        <h2 className="text-2xl font-serif text-gray-400 mb-4">Your bag is empty</h2>
                        <Link to="/products" className="btn-primary inline-flex items-center">
                            Start Shopping <ArrowRight size={18} className="ml-2" />
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Cart Items */}
                        <div className="flex-1 bg-white p-6 rounded-sm shadow-sm">
                            <div className="space-y-6">
                                {cartItems.map((item) => (
                                    <div key={item._id} className="flex flex-col sm:flex-row border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                                        <div className="w-full sm:w-32 h-40 bg-gray-100 mb-4 sm:mb-0">
                                            {/* Handle both mock image structure or backend if exists */}
                                            <img src={item.image || item.images?.[0]} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 sm:ml-6 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
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
                                                <div className="flex items-center border border-gray-300 rounded-sm">
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

                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <Link to="/products" className="inline-flex items-center text-primary font-medium hover:underline text-sm uppercase tracking-wide">
                                    <ArrowLeft size={16} className="mr-2" /> Continue Shopping
                                </Link>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="w-full lg:w-96">
                            <div className="bg-white p-6 rounded-sm shadow-sm sticky top-24">
                                <h2 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wider">Order Summary</h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span>₹{subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Shipping</span>
                                        <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                                    </div>
                                    <div className="border-t border-gray-100 pt-4 flex justify-between font-bold text-lg text-gray-900">
                                        <span>Total</span>
                                        <span>₹{total.toLocaleString()}</span>
                                    </div>
                                </div>

                                <Link to="/checkout" className="block text-center w-full btn-primary py-4 text-base shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
                                    Proceed to Checkout
                                </Link>

                                <div className="mt-6 text-xs text-gray-500 text-center">
                                    <p>Secure Checkout - SSL Encrypted</p>
                                    <p className="mt-2">Free shipping on all orders</p>
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

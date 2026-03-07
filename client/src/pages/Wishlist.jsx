import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowLeft } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';

const Wishlist = () => {
    const { wishlist, removeFromWishlist, addToCart } = useContext(ShopContext);

    const moveToCart = (product) => {
        addToCart(product, 1);
        removeFromWishlist(product._id);
    };

    return (
        <div className="bg-gray-50 dark:bg-slate-950 min-h-screen py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Heart className="text-primary" fill="currentColor" size={32} />
                            My Wishlist
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
                        </p>
                    </div>
                    <Link to="/products" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
                        <ArrowLeft size={20} />
                        Continue Shopping
                    </Link>
                </div>

                {wishlist.length === 0 ? (
                    /* Empty State */
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-16 text-center">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <Heart size={40} className="text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-gray-200 mb-3">Your wishlist is empty</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                            Save items you love by clicking the heart icon on any product. They'll appear here so you can easily find them later.
                        </p>
                        <Link
                            to="/products"
                            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 font-medium hover:bg-opacity-90 transition-colors rounded-sm"
                        >
                            <ShoppingBag size={20} />
                            Explore Products
                        </Link>
                    </div>
                ) : (
                    /* Wishlist Items */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {wishlist.map((product) => (
                            <div key={product._id} className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                                {/* Product Image */}
                                <Link to={`/product/${product._id}`} className="block relative aspect-[3/4] overflow-hidden">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/400x500?text=No+Image'; }}
                                    />
                                    {/* Remove Button */}
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            removeFromWishlist(product._id);
                                        }}
                                        className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                                        title="Remove from wishlist"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    {/* Stock Badge */}
                                    {product.countInStock === 0 && (
                                        <div className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-3 py-1 rounded">
                                            Out of Stock
                                        </div>
                                    )}
                                </Link>

                                {/* Product Details */}
                                <div className="p-4">
                                    <Link to={`/product/${product._id}`}>
                                        <h3 className="font-medium text-gray-900 dark:text-white mb-1 hover:text-primary transition-colors line-clamp-2">
                                            {product.name}
                                        </h3>
                                    </Link>
                                    <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                                    <p className="text-lg font-bold text-primary mb-4">
                                        ₹{product.price?.toLocaleString()}
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => moveToCart(product)}
                                            disabled={product.countInStock === 0}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 font-medium text-sm transition-colors rounded ${product.countInStock === 0
                                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                : 'bg-primary text-white hover:bg-opacity-90'
                                                }`}
                                        >
                                            <ShoppingBag size={16} />
                                            Move to Cart
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Additional Info */}
                {wishlist.length > 0 && (
                    <div className="mt-12 bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="text-center md:text-left">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Want to see more?</h3>
                                <p className="text-gray-600 dark:text-gray-400">Discover our complete collection of premium silk sarees</p>
                            </div>
                            <Link
                                to="/products"
                                className="inline-flex items-center gap-2 border-2 border-primary text-primary px-6 py-2.5 font-medium hover:bg-primary hover:text-white transition-colors rounded-sm"
                            >
                                Browse All Products
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wishlist;

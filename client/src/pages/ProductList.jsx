import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Filter, ChevronDown, ChevronUp, Heart, X } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import { Link, useSearchParams } from 'react-router-dom';
import { getProducts } from '../services/api';
import Loader from '../components/Loader';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { addToCart, toggleWishlist, isInWishlist } = useContext(ShopContext);

    // Filter states
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
    const [selectedColors, setSelectedColors] = useState([]);
    const [sortBy, setSortBy] = useState('featured');
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [showPriceFilter, setShowPriceFilter] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('search') || '';
    const categoryParam = searchParams.get('category') || '';

    // Get max price from products
    const maxProductPrice = useMemo(() => {
        if (products.length === 0) return 100000;
        return Math.ceil(Math.max(...products.map(p => p.price)) / 1000) * 1000;
    }, [products]);

    // Color definitions with display colors
    const colorOptions = [
        { name: 'Red', class: 'bg-red-600', match: ['red', 'crimson', 'scarlet'] },
        { name: 'Maroon', class: 'bg-[#800000]', match: ['maroon', 'burgundy', 'wine'] },
        { name: 'Pink', class: 'bg-pink-500', match: ['pink', 'rose', 'blush'] },
        { name: 'Magenta', class: 'bg-fuchsia-600', match: ['magenta', 'fuchsia', 'rani'] },
        { name: 'Orange', class: 'bg-orange-500', match: ['orange', 'saffron', 'rust'] },
        { name: 'Peach', class: 'bg-[#FFCBA4]', match: ['peach', 'coral', 'salmon'] },
        { name: 'Yellow', class: 'bg-yellow-400', match: ['yellow', 'lemon', 'mustard'] },
        { name: 'Gold', class: 'bg-[#FFD700]', match: ['gold', 'golden', 'antique gold'] },
        { name: 'Beige', class: 'bg-[#F5F5DC] border border-gray-300', match: ['beige', 'cream', 'ivory', 'off-white'] },
        { name: 'Green', class: 'bg-green-600', match: ['green', 'emerald', 'olive', 'parrot'] },
        { name: 'Teal', class: 'bg-teal-600', match: ['teal', 'turquoise', 'aqua', 'cyan'] },
        { name: 'Blue', class: 'bg-blue-600', match: ['blue', 'navy', 'royal blue', 'sky blue'] },
        { name: 'Purple', class: 'bg-purple-600', match: ['purple', 'violet', 'lavender'] },
        { name: 'Brown', class: 'bg-amber-800', match: ['brown', 'coffee', 'chocolate', 'copper'] },
        { name: 'Grey', class: 'bg-gray-500', match: ['grey', 'gray', 'silver', 'charcoal'] },
        { name: 'Black', class: 'bg-black', match: ['black'] },
        { name: 'White', class: 'bg-white border border-gray-300', match: ['white', 'off white'] }
    ];

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const { data } = await getProducts();
            setProducts(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load products');
            console.error('Error fetching products:', err);
        } finally {
            setLoading(false);
        }
    };

    // Get unique categories from products
    const availableCategories = useMemo(() => {
        const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
        return categories.sort();
    }, [products]);

    // Toggle category filter
    const toggleCategory = (category) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    // Toggle price range filter - removed, using slider now

    // Toggle color filter
    const toggleColor = (colorName) => {
        setSelectedColors(prev =>
            prev.includes(colorName)
                ? prev.filter(c => c !== colorName)
                : [...prev, colorName]
        );
    };

    // Clear all filters
    const clearFilters = () => {
        setSelectedCategories([]);
        setPriceRange({ min: 0, max: maxProductPrice });
        setSelectedColors([]);
    };

    // Check if any filters are active
    const hasActiveFilters = selectedCategories.length > 0 || priceRange.min > 0 || priceRange.max < maxProductPrice || selectedColors.length > 0;

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        let result = [...products];

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.name?.toLowerCase().includes(query) ||
                p.category?.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query) ||
                p.color?.toLowerCase().includes(query) ||
                p.material?.toLowerCase().includes(query)
            );
        }

        // Filter by category from URL (flexible matching)
        if (categoryParam) {
            const catLower = categoryParam.toLowerCase();
            result = result.filter(p =>
                p.category?.toLowerCase().includes(catLower) ||
                p.name?.toLowerCase().includes(catLower) ||
                p.description?.toLowerCase().includes(catLower)
            );
        }
        // Filter by selected categories from checkboxes (exact match)
        else if (selectedCategories.length > 0) {
            result = result.filter(p => selectedCategories.includes(p.category));
        }

        // Filter by price range (slider)
        if (priceRange.min > 0 || priceRange.max < maxProductPrice) {
            result = result.filter(p => p.price >= priceRange.min && p.price <= priceRange.max);
        }

        // Filter by color
        if (selectedColors.length > 0) {
            result = result.filter(p => {
                if (!p.color) return false;
                const productColor = p.color.toLowerCase();
                return selectedColors.some(colorName => {
                    const colorOption = colorOptions.find(c => c.name === colorName);
                    if (colorOption) {
                        return colorOption.match.some(m => productColor.includes(m.toLowerCase()));
                    }
                    return false;
                });
            });
        }

        // Sort products
        switch (sortBy) {
            case 'price-low':
                result.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                result.sort((a, b) => b.price - a.price);
                break;
            case 'newest':
                result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'name':
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
            default:
                // Featured - keep original order or prioritize featured items
                result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        }

        return result;
    }, [products, selectedCategories, priceRange, maxProductPrice, selectedColors, sortBy, searchQuery, categoryParam]);

    return (
        <div className="bg-amber-50 dark:bg-slate-950 pt-24 md:pt-28">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 dark:text-white">
                            {searchQuery
                                ? `Search Results for "${searchQuery}"`
                                : categoryParam
                                    ? `${categoryParam} Collection`
                                    : 'Silk Saree Collection'}
                        </h1>
                        {(searchQuery || categoryParam) && (
                            <Link to="/products" className="text-sm text-primary hover:underline mt-1 inline-block">
                                ← Back to all products
                            </Link>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between w-full md:w-auto gap-3 mt-2 md:mt-0">
                        {/* Mobile Filter Button */}
                        <button
                            onClick={() => setShowMobileFilters(true)}
                            className="lg:hidden flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 shrink-0"
                        >
                            <Filter size={16} />
                            Filters
                            {hasActiveFilters && (
                                <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {selectedCategories.length + selectedColors.length + (priceRange.min > 0 || priceRange.max < maxProductPrice ? 1 : 0)}
                                </span>
                            )}
                        </button>
                        <span className="text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap">{filteredProducts.length} Products</span>
                        <div className="relative inline-block text-left shrink-0">
                            <button
                                className="flex items-center justify-end text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary whitespace-nowrap"
                                onClick={() => setShowSortDropdown(!showSortDropdown)}
                            >
                                <span className="hidden sm:inline mr-1">Sort by: </span>
                                <span className="sm:hidden">Sort: </span>
                                {sortBy === 'featured' ? 'Featured' : sortBy === 'price-low' ? 'Low to High' : sortBy === 'price-high' ? 'High to Low' : sortBy === 'newest' ? 'Newest' : 'Name'}
                                <ChevronDown size={16} className="ml-1" />
                            </button>
                            {showSortDropdown && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
                                    {[
                                        { value: 'featured', label: 'Featured' },
                                        { value: 'price-low', label: 'Price: Low to High' },
                                        { value: 'price-high', label: 'Price: High to Low' },
                                        { value: 'newest', label: 'Newest' },
                                        { value: 'name', label: 'Name' }
                                    ].map(option => (
                                        <button
                                            key={option.value}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${sortBy === option.value ? 'text-primary font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                                            onClick={() => {
                                                setSortBy(option.value);
                                                setShowSortDropdown(false);
                                            }}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Filter Overlay */}
                {showMobileFilters && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setShowMobileFilters(false)}
                    />
                )}

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters - Mobile Drawer / Desktop Sidebar */}
                    <div className={`
                        fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
                        w-80 lg:w-64 bg-white dark:bg-gray-900 lg:bg-transparent
                        transform transition-transform duration-300 ease-in-out
                        ${showMobileFilters ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                        overflow-y-auto lg:overflow-visible
                        shadow-xl lg:shadow-none
                        flex-shrink-0
                    `}>
                        {/* Mobile Header */}
                        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                                <Filter size={18} className="mr-2" /> Filters
                            </h3>
                            <button
                                onClick={() => setShowMobileFilters(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 lg:p-0 border-b border-gray-200 dark:border-gray-700 pb-6 mb-6 lg:border-b lg:pb-6 lg:mb-6">
                            {/* Desktop Header */}
                            <div className="hidden lg:flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                                    <Filter size={18} className="mr-2" /> Filters
                                </h3>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                                    >
                                        <X size={14} /> Clear All
                                    </button>
                                )}
                            </div>

                            {/* Mobile Clear Button */}
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="lg:hidden w-full mb-4 py-2 text-sm text-primary hover:text-primary/80 flex items-center justify-center gap-1 border border-primary/30 rounded-lg"
                                >
                                    <X size={14} /> Clear All Filters
                                </button>
                            )}

                            {/* Categories */}
                            <div className="mb-6">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Category</h4>
                                <div className="space-y-1">
                                    {availableCategories.length > 0 ? (
                                        availableCategories.map(cat => {
                                            const count = products.filter(p => p.category === cat).length;
                                            return (
                                                <label
                                                    key={cat}
                                                    className={`flex items-center justify-between cursor-pointer group py-2 px-3 rounded-lg transition-colors ${selectedCategories.includes(cat)
                                                        ? 'bg-primary/10'
                                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                                        }`}
                                                >
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedCategories.includes(cat)}
                                                            onChange={() => toggleCategory(cat)}
                                                            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                                                        />
                                                        <span className={`ml-2 text-sm ${selectedCategories.includes(cat) ? 'text-primary font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                                            {cat}
                                                        </span>
                                                    </div>
                                                    <span className={`text-sm ${count > 0
                                                        ? selectedCategories.includes(cat)
                                                            ? 'text-primary font-medium'
                                                            : 'text-gray-500'
                                                        : 'text-gray-300'
                                                        }`}>
                                                        {count}
                                                    </span>
                                                </label>
                                            );
                                        })
                                    ) : (
                                        <p className="text-sm text-gray-400">No categories available</p>
                                    )}
                                </div>
                            </div>

                            {/* Price */}
                            <div className="mb-6">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Price</h4>
                                <div className="space-y-4">
                                    {/* Dual Range Slider */}
                                    <div className="relative pt-2 pb-4 overflow-hidden">
                                        <div className="relative h-2 bg-gray-200 rounded-full">
                                            {/* Active track */}
                                            <div
                                                className="absolute h-2 bg-primary rounded-full"
                                                style={{
                                                    left: `${(priceRange.min / maxProductPrice) * 100}%`,
                                                    right: `${100 - (priceRange.max / maxProductPrice) * 100}%`
                                                }}
                                            />
                                        </div>

                                        {/* Min slider */}
                                        <input
                                            type="range"
                                            min="0"
                                            max={maxProductPrice}
                                            step="100"
                                            value={priceRange.min}
                                            onChange={(e) => {
                                                const value = Math.min(Number(e.target.value), priceRange.max - 100);
                                                setPriceRange(prev => ({ ...prev, min: value }));
                                            }}
                                            className="absolute top-2 left-0 right-0 h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-gray-400 [&::-moz-range-thumb]:cursor-pointer"
                                        />

                                        {/* Max slider */}
                                        <input
                                            type="range"
                                            min="0"
                                            max={maxProductPrice}
                                            step="100"
                                            value={priceRange.max}
                                            onChange={(e) => {
                                                const value = Math.max(Number(e.target.value), priceRange.min + 100);
                                                setPriceRange(prev => ({ ...prev, max: value }));
                                            }}
                                            className="absolute top-2 left-0 right-0 h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-gray-400 [&::-moz-range-thumb]:cursor-pointer"
                                        />
                                    </div>

                                    {/* Price Input Fields */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                                                <input
                                                    type="number"
                                                    value={priceRange.min}
                                                    onChange={(e) => {
                                                        const value = Math.min(Number(e.target.value), priceRange.max - 100);
                                                        setPriceRange(prev => ({ ...prev, min: Math.max(0, value) }));
                                                    }}
                                                    className="w-full pl-7 pr-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                                    min="0"
                                                    max={priceRange.max - 100}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-gray-400">—</span>
                                        <div className="flex-1">
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                                                <input
                                                    type="number"
                                                    value={priceRange.max}
                                                    onChange={(e) => {
                                                        const value = Math.max(Number(e.target.value), priceRange.min + 100);
                                                        setPriceRange(prev => ({ ...prev, max: Math.min(maxProductPrice, value) }));
                                                    }}
                                                    className="w-full pl-7 pr-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                                    min={priceRange.min + 100}
                                                    max={maxProductPrice}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Colors */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Color</h4>
                                <div className="flex flex-wrap gap-2">
                                    {colorOptions.map((color) => (
                                        <button
                                            key={color.name}
                                            onClick={() => toggleColor(color.name)}
                                            title={color.name}
                                            className={`w-7 h-7 rounded-full ${color.class} focus:outline-none transition-all ${selectedColors.includes(color.name)
                                                ? 'ring-2 ring-offset-2 ring-primary scale-110'
                                                : 'hover:scale-110'
                                                }`}
                                        />
                                    ))}
                                </div>
                                {selectedColors.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        Selected: {selectedColors.join(', ')}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Mobile Apply Button */}
                        <div className="lg:hidden sticky bottom-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setShowMobileFilters(false)}
                                className="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                Show {filteredProducts.length} Results
                            </button>
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1">
                        {loading ? (
                            <Loader text="Loading collection..." />
                        ) : error ? (
                            <div className="text-center py-16">
                                <div className="text-red-500 mb-4">
                                    <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Error Loading Products</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
                                <button onClick={fetchProducts} className="btn-primary">Try Again</button>
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredProducts.map((product) => (
                                    <div key={product._id} className="group bg-white dark:bg-gray-900 flex flex-col">
                                        <div className="block relative overflow-hidden mb-4 bg-gray-100 dark:bg-gray-800 aspect-[3/4] rounded-2xl shadow-sm">
                                            <Link to={`/product/${product._id}`}>
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/400x500?text=No+Image'; }}
                                                />
                                            </Link>

                                            {/* Discount Badge */}
                                            {product.originalPrice > product.price && (
                                                <div className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-2 py-1 rounded">
                                                    {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                                                </div>
                                            )}

                                            {/* Wishlist Button */}
                                            <button
                                                onClick={() => toggleWishlist(product)}
                                                className={`absolute top-3 right-3 w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-all z-10 ${isInWishlist(product._id)
                                                    ? 'bg-red-500 text-white'
                                                    : 'bg-white text-gray-500 hover:text-red-500 hover:bg-red-50'
                                                    }`}
                                                title={isInWishlist(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                                            >
                                                <Heart size={18} fill={isInWishlist(product._id) ? 'currentColor' : 'none'} />
                                            </button>

                                            {/* Stock Badge */}
                                            {product.countInStock === 0 && (
                                                <div className="absolute top-12 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                                                    Out of Stock
                                                </div>
                                            )}

                                            {/* Add to Cart Button */}
                                            <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (product.countInStock > 0) {
                                                            addToCart(product);
                                                        }
                                                    }}
                                                    disabled={product.countInStock === 0}
                                                    className={`w-full py-3 font-medium uppercase text-sm shadow-md transition-colors ${product.countInStock === 0
                                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                        : 'bg-white text-dark hover:bg-primary hover:text-white'
                                                        }`}
                                                >
                                                    {product.countInStock === 0 ? 'Out of Stock' : 'Add to Cart'}
                                                </button>
                                            </div>
                                        </div>
                                        <Link to={`/product/${product._id}`}>
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1 group-hover:text-primary transition-colors cursor-pointer">{product.name}</h3>
                                        </Link>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{product.category}</p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-lg font-bold text-gray-900 dark:text-white">₹{product.price?.toLocaleString()}</span>
                                            {product.originalPrice > product.price && (
                                                <>
                                                    <span className="text-sm text-gray-400 line-through">₹{product.originalPrice?.toLocaleString()}</span>
                                                    <span className="text-sm font-semibold text-green-600">{Math.round((1 - product.price / product.originalPrice) * 100)}% Off</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="text-gray-400 mb-4">
                                    <svg className="mx-auto h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                {hasActiveFilters ? (
                                    <>
                                        <h3 className="text-2xl font-serif font-bold text-gray-700 dark:text-gray-300 mb-2">No Products Match Your Filters</h3>
                                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
                                            Try adjusting your filter criteria to find what you're looking for.
                                        </p>
                                        <button onClick={clearFilters} className="btn-primary">
                                            Clear All Filters
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-2xl font-serif font-bold text-gray-700 dark:text-gray-300 mb-2">No Products Available</h3>
                                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                            Our collection is being updated. Please check back soon for our amazing silk sarees!
                                        </p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductList;

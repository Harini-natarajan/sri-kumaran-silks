import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, Menu, X, ChevronDown, Trash2, Sun, Moon } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import { ThemeContext } from '../context/ThemeContext';
import { getProducts, getCategories } from '../services/api';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [wishlistOpen, setWishlistOpen] = useState(false);
    const { cartItems, user, wishlist, removeFromWishlist } = useContext(ShopContext);
    const { isDarkMode, toggleDarkMode } = useContext(ThemeContext);
    const location = useLocation();
    const navigate = useNavigate();

    // Search suggestions state
    const [allProducts, setAllProducts] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const searchRef = useRef(null);
    const suggestionsRef = useRef(null);
    const wishlistRef = useRef(null);
    const debounceTimer = useRef(null);

    // Dynamic categories for navbar dropdown
    const [navCategories, setNavCategories] = useState([]);
    const DEFAULT_ANNOUNCEMENTS = [
        { text: "Welcome to SRIKUMARANSILKS - Premium Silk Sarees", bgColor: "#9A3412", textColor: "#ffffff" },
        { text: "Free Shipping on orders above ₹2000", bgColor: "#9A3412", textColor: "#ffffff" },
        { text: "10% OFF on your first order", bgColor: "#9A3412", textColor: "#ffffff" },
        { text: "100% Pure Silk Collection", bgColor: "#9A3412", textColor: "#ffffff" },
        { text: "New Arrivals Every Week", bgColor: "#9A3412", textColor: "#ffffff" }
    ];

    const [announcements, setAnnouncements] = useState(DEFAULT_ANNOUNCEMENTS);

    useEffect(() => {
        getCategories()
            .then(({ data }) => setNavCategories(data))
            .catch(() => {
                // Fallback to defaults if API fails
                setNavCategories(['Kanchipuram', 'Banarasi', 'Soft Silk', 'Cotton Silk', 'Handloom', 'Wedding']);
            });

        import('../services/api').then(({ getPromotions }) => {
            getPromotions().then(({ data }) => {
                if (data.announcements && data.announcements.length > 0) {
                    // Combine default announcements with backend ones
                    setAnnouncements([...DEFAULT_ANNOUNCEMENTS, ...data.announcements]);
                }
            }).catch(e => console.error("Failed to load announcements", e));
        });
    }, []);

    // Fetch products once for autocomplete
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data } = await getProducts();
                setAllProducts(data);
            } catch (err) {
                console.error('Error loading products for search:', err);
            }
        };
        fetchProducts();
    }, []);

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSuggestions(false);
                setSelectedIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close wishlist dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wishlistRef.current && !wishlistRef.current.contains(e.target)) {
                setWishlistOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Toggle wishlist dropdown
    const toggleWishlist = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setWishlistOpen(!wishlistOpen);
    };

    // Filter suggestions with debounce
    const updateSuggestions = useCallback((query) => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        if (!query.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            setSelectedIndex(-1);
            return;
        }

        debounceTimer.current = setTimeout(() => {
            const q = query.toLowerCase();
            const matched = allProducts
                .filter(p =>
                    p.name?.toLowerCase().includes(q) ||
                    p.category?.toLowerCase().includes(q) ||
                    p.color?.toLowerCase().includes(q) ||
                    p.material?.toLowerCase().includes(q)
                )
                .slice(0, 6); // Show top 6 suggestions

            setSuggestions(matched);
            setShowSuggestions(matched.length > 0);
            setSelectedIndex(-1);
        }, 200);
    }, [allProducts]);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        updateSuggestions(value);
    };

    const handleKeyDown = (e) => {
        if (!showSuggestions) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            navigateToProduct(suggestions[selectedIndex]);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setSelectedIndex(-1);
        }
    };

    const navigateToProduct = (product) => {
        setSearchQuery('');
        setSuggestions([]);
        setShowSuggestions(false);
        setSearchOpen(false);
        setSelectedIndex(-1);
        navigate(`/product/${product._id}`);
    };

    // Announcements fetched from state above

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchOpen(false);
            setSearchQuery('');
            setSuggestions([]);
            setShowSuggestions(false);
            setSelectedIndex(-1);
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show shadow after 10px
            setIsScrolled(currentScrollY > 10);

            // Hide/Show logic
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                // Scrolling down & passed 100px - Hide
                setIsVisible(false);
            } else {
                // Scrolling up or at top - Show
                setIsVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    useEffect(() => {
        setIsOpen(false);
        setActiveDropdown(null);
    }, [location]);

    const menuItems = [
        { name: 'Home', path: '/' },
        {
            name: 'Silk Sarees',
            path: '/products',
            dropdown: navCategories.length > 0
                ? navCategories.map(cat => ({ name: cat, path: `/products?category=${encodeURIComponent(cat)}` }))
                : [{ name: 'All Sarees', path: '/products' }]
        },
        { name: 'About Us', path: '/about' },
        { name: 'Contact Us', path: '/contact' },
    ];

    const cartCount = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);

    return (
        <>
        <header className={`fixed top-0 left-0 right-0 z-40 transition-transform duration-500 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'
            }`}>
            {/* Horizontal Right-to-Left Scrolling Announcement Bar */}
            <div className="bg-[#9A3412] text-white h-7 flex items-center overflow-hidden relative"
                style={announcements.length === 1 && announcements[0].bgColor ? { backgroundColor: announcements[0].bgColor } : {}}
            >
                <div className="announcement-scroll-container">
                    {/* First set */}
                    {announcements.map((promo, index) => (
                        <span
                            key={`first-${index}`}
                            className="text-xs font-medium uppercase tracking-wider whitespace-nowrap px-6 h-7 inline-flex items-center"
                            style={promo.textColor ? { color: promo.textColor } : {}}
                        >
                            {promo.text}
                            <span className="ml-6 opacity-60">✦</span>
                        </span>
                    ))}
                    {/* Duplicate set for seamless loop */}
                    {announcements.map((promo, index) => (
                        <span
                            key={`second-${index}`}
                            className="text-xs font-medium uppercase tracking-wider whitespace-nowrap px-6 h-7 inline-flex items-center"
                            style={promo.textColor ? { color: promo.textColor } : {}}
                        >
                            {promo.text}
                            <span className="ml-6 opacity-60">✦</span>
                        </span>
                    ))}
                </div>
            </div>

            <nav className={`bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-amber-100 dark:border-gray-800 transition-shadow duration-300 ${isScrolled ? 'shadow-md' : 'shadow-sm'
                }`}>
                <div className="max-w-7xl mx-auto px-1 sm:px-4 lg:px-8">
                    <div className="flex items-center justify-between h-14">

                        {/* Logo */}
                        <Link to="/" className="flex min-w-0 max-w-[calc(100%-7rem)] items-center shrink sm:max-w-none sm:shrink-0">
                            <h1 className="font-serif font-bold leading-none text-[13px] tracking-[0.18em] sm:text-xl sm:tracking-[0.2em] md:text-2xl md:tracking-wider">
                                <span className="text-amber-800 dark:text-amber-400">SRI </span>
                                <span className="text-amber-700 dark:text-amber-500">KUMARAN</span>
                                <span className="block text-amber-600 dark:text-amber-400 sm:inline sm:ml-1">SILKS</span>
                            </h1>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center gap-8">
                            {menuItems.map((item, index) => (
                                <div
                                    key={index}
                                    className="relative group"
                                    onMouseEnter={() => setActiveDropdown(item.dropdown ? index : null)}
                                    onMouseLeave={() => setActiveDropdown(null)}
                                >
                                    <Link
                                        to={item.path}
                                        className={`text-sm font-medium transition-colors flex items-center gap-1 ${location.pathname === item.path
                                            ? 'text-amber-700 dark:text-amber-400'
                                            : 'text-gray-600 dark:text-gray-300 hover:text-amber-700 dark:hover:text-amber-400'
                                            }`}
                                    >
                                        {item.name}
                                        {item.dropdown && (
                                            <ChevronDown size={14} className={`transition-transform ${activeDropdown === index ? 'rotate-180' : ''}`} />
                                        )}
                                    </Link>

                                    {/* Dropdown */}
                                    {item.dropdown && (
                                        <div className={`absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-200 ${activeDropdown === index
                                            ? 'opacity-100 visible translate-y-0'
                                            : 'opacity-0 invisible -translate-y-2'
                                            }`}>
                                            <div className="py-2">
                                                {item.dropdown.map((subItem, subIndex) => (
                                                    <Link
                                                        key={subIndex}
                                                        to={subItem.path}
                                                        className="block px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-gray-700 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                                                    >
                                                        {subItem.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Right Section */}
                        <div className="hidden lg:flex items-center gap-3">
                            {/* Dark Mode Toggle */}
                            <button
                                onClick={toggleDarkMode}
                                className="p-2 text-gray-600 dark:text-gray-300 hover:text-amber-700 dark:hover:text-amber-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                            >
                                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </button>

                            {/* Search */}
                            <button
                                onClick={() => setSearchOpen(!searchOpen)}
                                className="p-2 text-gray-600 dark:text-gray-300 hover:text-amber-700 dark:hover:text-amber-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <Search size={20} />
                            </button>

                            {/* Wishlist Widget */}
                            <div className="relative" ref={wishlistRef}>
                                <button
                                    onClick={toggleWishlist}
                                    className={`relative p-2 transition-all rounded-full ${
                                        wishlistOpen 
                                        ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' 
                                        : 'text-gray-600 dark:text-gray-300 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                                    aria-label="Wishlist"
                                >
                                    <Heart size={20} className={wishlistOpen ? 'fill-current' : ''} />
                                    {wishlist.length > 0 && (
                                        <span className="absolute top-0 right-0 w-5 h-5 bg-amber-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900 transform translate-x-1 -translate-y-1">
                                            {wishlist.length}
                                        </span>
                                    )}
                                </button>

                                {/* Wishlist Dropdown */}
                                <div className={`absolute right-0 top-full mt-3 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 origin-top-right ${
                                    wishlistOpen 
                                    ? 'opacity-100 visible scale-100 translate-y-0' 
                                    : 'opacity-0 invisible scale-95 -translate-y-2'
                                } z-50`}>
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-700 dark:to-gray-750 border-b border-gray-200 dark:border-gray-600">
                                        <div>
                                            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">My Wishlist</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}</p>
                                        </div>
                                        <Link 
                                            to="/wishlist" 
                                            onClick={() => setWishlistOpen(false)}
                                            className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-semibold hover:underline"
                                        >
                                            View All
                                        </Link>
                                    </div>

                                    {wishlist.length === 0 ? (
                                        <div className="px-5 py-12 text-center">
                                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                                <Heart size={32} className="text-gray-300 dark:text-gray-600" />
                                            </div>
                                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Your wishlist is empty</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Save items you love by clicking the ❤️ icon</p>
                                            <Link 
                                                to="/products" 
                                                onClick={() => setWishlistOpen(false)}
                                                className="inline-block px-6 py-2 bg-amber-700 text-white text-xs font-semibold rounded-full hover:bg-amber-800 transition-colors"
                                            >
                                                Browse Products
                                            </Link>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Items List */}
                                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                                {wishlist.slice(0, 5).map((item, index) => (
                                                    <div 
                                                        key={item._id} 
                                                        className={`group flex items-start gap-3 px-5 py-4 hover:bg-amber-50/50 dark:hover:bg-gray-700/50 transition-all ${
                                                            index !== wishlist.slice(0, 5).length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                                                        }`}
                                                    >
                                                        {/* Image */}
                                                        <Link 
                                                            to={`/product/${item._id}`} 
                                                            onClick={() => setWishlistOpen(false)}
                                                            className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-700 shadow-sm group-hover:shadow-md transition-shadow"
                                                        >
                                                            <img
                                                                src={item.images?.[0] || item.image}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                onError={(e) => { e.target.src = 'https://via.placeholder.com/80x80?text=No+Image'; }}
                                                            />
                                                        </Link>
                                                        
                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <Link 
                                                                to={`/product/${item._id}`} 
                                                                onClick={() => setWishlistOpen(false)}
                                                                className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 hover:text-amber-700 dark:hover:text-amber-400 transition-colors mb-1 leading-tight"
                                                            >
                                                                {item.name}
                                                            </Link>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                                                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                                                {item.category}
                                                            </p>
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-base font-bold text-amber-700 dark:text-amber-400">
                                                                    ₹{item.price?.toLocaleString('en-IN')}
                                                                </p>
                                                                {item.originalPrice && item.originalPrice > item.price && (
                                                                    <span className="text-xs text-gray-400 line-through">₹{item.originalPrice?.toLocaleString('en-IN')}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Remove Button */}
                                                        <button
                                                            onClick={(e) => { 
                                                                e.preventDefault(); 
                                                                e.stopPropagation();
                                                                removeFromWishlist(item._id); 
                                                            }}
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all opacity-0 group-hover:opacity-100 shrink-0"
                                                            title="Remove from wishlist"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {/* More Items Indicator */}
                                            {wishlist.length > 5 && (
                                                <div className="px-5 py-2 text-center bg-gray-50 dark:bg-gray-750 border-t border-gray-100 dark:border-gray-700">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">+{wishlist.length - 5} more {wishlist.length - 5 === 1 ? 'item' : 'items'} in your wishlist</p>
                                                </div>
                                            )}
                                            
                                            {/* Footer Button */}
                                            <div className="p-4 bg-gray-50 dark:bg-gray-750 border-t border-gray-100 dark:border-gray-700">
                                                <Link
                                                    to="/wishlist"
                                                    onClick={() => setWishlistOpen(false)}
                                                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-amber-700 text-white text-sm font-semibold rounded-xl hover:bg-amber-800 transition-all shadow-md hover:shadow-lg"
                                                >
                                                    <Heart size={16} />
                                                    View All Wishlist Items
                                                </Link>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Cart */}
                            <Link
                                to="/cart"
                                className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-amber-700 dark:hover:text-amber-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <ShoppingBag size={20} />
                                {cartCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-amber-700 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>

                            {/* Login/Profile */}
                            {user ? (
                                <div className="flex items-center gap-2 ml-2">
                                    <Link
                                        to="/profile"
                                        className="w-9 h-9 bg-amber-700 rounded-full flex items-center justify-center text-white font-semibold text-sm hover:bg-amber-800 transition-colors"
                                    >
                                        {user.name.charAt(0).toUpperCase()}
                                    </Link>
                                    {user.isAdmin && (
                                        <Link
                                            to="/admin"
                                            className="px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium rounded-full hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                                        >
                                            Admin
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    className="ml-2 px-5 py-2 bg-amber-700 text-white text-sm font-medium rounded-full hover:bg-amber-800 transition-colors"
                                >
                                    Login
                                </Link>
                            )}
                        </div>

                        {/* Mobile Menu Toggle */}
                        <div className="flex items-center gap-1 sm:gap-2 lg:hidden">
                            <button
                                onClick={toggleDarkMode}
                                className="p-1 sm:p-2 text-gray-600 dark:text-gray-300"
                                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                            >
                                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                            <Link to="/wishlist" className="relative p-1 sm:p-2 text-gray-600 dark:text-gray-300">
                                <Heart size={20} />
                                {wishlist.length > 0 && (
                                    <span className="absolute top-0 right-0 w-4 h-4 sm:w-5 sm:h-5 bg-amber-700 text-white text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900 transform translate-x-1 -translate-y-1">
                                        {wishlist.length}
                                    </span>
                                )}
                            </Link>
                            <Link to="/cart" className="relative p-1 sm:p-2 text-gray-600 dark:text-gray-300">
                                <ShoppingBag size={20} className="sm:w-[22px] sm:h-[22px]" />
                                {cartCount > 0 && (
                                    <span className="absolute top-0 right-0 w-4 h-4 sm:w-5 sm:h-5 bg-amber-700 text-white text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900 transform translate-x-1 -translate-y-1">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="p-1 sm:p-2 text-gray-600 dark:text-gray-300 hover:text-amber-700 dark:hover:text-amber-400 transition-colors ml-1"
                            >
                                {isOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search Bar with Autocomplete */}
                <div className={`border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 transition-all duration-300 overflow-hidden ${searchOpen ? 'max-h-100 py-3' : 'max-h-0 py-0'
                    }`}>
                    <div className="max-w-xl mx-auto px-4" ref={searchRef}>
                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onKeyDown={handleKeyDown}
                                onFocus={() => searchQuery.trim() && suggestions.length > 0 && setShowSuggestions(true)}
                                placeholder="Search for silk sarees..."
                                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-700/20 focus:border-amber-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                autoFocus={searchOpen}
                                autoComplete="off"
                            />
                            <button
                                type="submit"
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-amber-700 text-white rounded-full hover:bg-amber-800 transition-colors"
                            >
                                <Search size={16} />
                            </button>
                        </form>

                        {/* Suggestions Dropdown */}
                        {showSuggestions && (
                            <div
                                ref={suggestionsRef}
                                className="mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50"
                            >
                                {suggestions.map((product, index) => (
                                    <button
                                        key={product._id}
                                        onClick={() => navigateToProduct(product)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                                            index === selectedIndex
                                                ? 'bg-amber-50 dark:bg-gray-700'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        } ${index !== suggestions.length - 1 ? 'border-b border-gray-50 dark:border-gray-700' : ''}`}
                                    >
                                        {/* Product Image */}
                                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-700">
                                            <img
                                                src={product.images?.[0] || product.image}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        {/* Product Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {product.name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {product.category}
                                                {product.color ? ` · ${product.color}` : ''}
                                            </p>
                                        </div>
                                        {/* Price */}
                                        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400 shrink-0">
                                            ₹{product.price?.toLocaleString('en-IN')}
                                        </span>
                                    </button>
                                ))}

                                {/* View all results link */}
                                {searchQuery.trim() && (
                                    <button
                                        onClick={handleSearch}
                                        className="w-full px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400 font-medium bg-amber-50/50 dark:bg-gray-700/50 hover:bg-amber-50 dark:hover:bg-gray-700 transition-colors text-center"
                                    >
                                        View all results for "{searchQuery}"
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </header>

            {/* Mobile Menu Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-50 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                    }`}
                onClick={() => setIsOpen(false)}
            />

            {/* Mobile Menu */}
            <div className={`fixed top-0 right-0 bottom-0 w-72 bg-white dark:bg-gray-900 z-[60] lg:hidden flex flex-col transition-transform duration-300 shadow-xl ${isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}>
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-lg font-serif font-bold text-amber-700 dark:text-amber-400">Menu</span>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Mobile Search */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <form onSubmit={(e) => { handleSearch(e); setIsOpen(false); }} className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Search for silk sarees..."
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-700/20 focus:border-amber-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                        <button
                            type="submit"
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-amber-700 text-white rounded-full hover:bg-amber-800 transition-colors"
                        >
                            <Search size={14} />
                        </button>
                    </form>
                </div>

                {/* Mobile Nav Items */}
                <div className="py-2 flex-1 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item, index) => (
                        <div key={index}>
                            <Link
                                to={item.path}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center justify-between px-5 py-3 text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-gray-800 hover:text-amber-700 dark:hover:text-amber-400 transition-colors ${location.pathname === item.path ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-gray-800' : ''
                                    }`}
                            >
                                <span className="font-medium">{item.name}</span>
                                {item.dropdown && <ChevronDown size={16} />}
                            </Link>
                            {item.dropdown && (
                                <div className="bg-gray-50 dark:bg-gray-800/50">
                                    {item.dropdown.map((subItem, subIndex) => (
                                        <Link
                                            key={subIndex}
                                            to={subItem.path}
                                            onClick={() => setIsOpen(false)}
                                            className="block px-8 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                                        >
                                            {subItem.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Mobile Bottom */}
                <div className="mt-auto p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                    {user ? (
                        <Link
                            to="/profile"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3"
                        >
                            <div className="w-10 h-10 bg-amber-700 rounded-full flex items-center justify-center text-white font-semibold">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">View Profile</p>
                            </div>
                        </Link>
                    ) : (
                        <Link
                            to="/login"
                            onClick={() => setIsOpen(false)}
                            className="block w-full py-2.5 bg-amber-700 text-white text-center font-medium rounded-full hover:bg-amber-800 transition-colors"
                        >
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </>
    );
};

export default Navbar;

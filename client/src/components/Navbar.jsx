import React, { useState, useContext, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, Menu, X, ChevronDown } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const { cartItems, user, wishlist } = useContext(ShopContext);
    const location = useLocation();
    const navigate = useNavigate();

    const [currentAnnouncement, setCurrentAnnouncement] = useState(0);
    const announcements = [
        "Welcome to KUMARAN SILKS",
        "Free Shipping on orders above ₹2000",
        "20% OFF on your first order"
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentAnnouncement((prev) => (prev + 1) % announcements.length);
        }, 2000);
        return () => clearInterval(timer);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchOpen(false);
            setSearchQuery('');
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
            dropdown: [
                { name: 'Kanchipuram Silk', path: '/products?category=Kanchipuram' },
                { name: 'Banarasi Silk', path: '/products?category=Banarasi' },
                { name: 'Soft Silk', path: '/products?category=Soft Silk' },
                { name: 'Cotton Silk', path: '/products?category=Cotton Silk' },
                { name: 'Handloom Silk', path: '/products?category=Handloom' },
                { name: 'Wedding Silk', path: '/products?category=Wedding' },
            ]
        },
        { name: 'About Us', path: '/about' },
        { name: 'Contact Us', path: '/contact' },
    ];

    const cartCount = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-500 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'
            }`}>
            {/* Sliding Announcement Bar */}
            <div className="bg-[#9A3412] text-white h-7 flex items-center justify-center overflow-hidden">
                <div className="relative w-full h-full flex items-center justify-center">
                    {announcements.map((text, index) => (
                        <div
                            key={index}
                            className={`absolute transition-all duration-700 ease-in-out text-xs font-medium uppercase tracking-wider ${currentAnnouncement === index
                                ? 'opacity-100 translate-y-0'
                                : 'opacity-0 translate-y-4'
                                }`}
                        >
                            {text}
                        </div>
                    ))}
                </div>
            </div>

            <nav className={`bg-white/95 backdrop-blur-md border-b border-amber-100 transition-shadow duration-300 ${isScrolled ? 'shadow-md' : 'shadow-sm'
                }`}>
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="flex items-center justify-between h-14">

                        {/* Logo */}
                        <Link to="/" className="flex items-center">
                            <h1 className="text-2xl font-serif font-bold tracking-wider">
                                <span className="text-amber-800">KUMARAN</span>
                                <span className="text-amber-600">SILKS</span>
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
                                            ? 'text-amber-700'
                                            : 'text-gray-600 hover:text-amber-700'
                                            }`}
                                    >
                                        {item.name}
                                        {item.dropdown && (
                                            <ChevronDown size={14} className={`transition-transform ${activeDropdown === index ? 'rotate-180' : ''}`} />
                                        )}
                                    </Link>

                                    {/* Dropdown */}
                                    {item.dropdown && (
                                        <div className={`absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden transition-all duration-200 ${activeDropdown === index
                                            ? 'opacity-100 visible translate-y-0'
                                            : 'opacity-0 invisible -translate-y-2'
                                            }`}>
                                            <div className="py-2">
                                                {item.dropdown.map((subItem, subIndex) => (
                                                    <Link
                                                        key={subIndex}
                                                        to={subItem.path}
                                                        className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-amber-50 hover:text-amber-700 transition-colors"
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
                            {/* Search */}
                            <button
                                onClick={() => setSearchOpen(!searchOpen)}
                                className="p-2 text-gray-600 hover:text-amber-700 transition-colors rounded-full hover:bg-gray-100"
                            >
                                <Search size={20} />
                            </button>

                            {/* Wishlist */}
                            <Link
                                to="/wishlist"
                                className="relative p-2 text-gray-600 hover:text-amber-700 transition-colors rounded-full hover:bg-gray-100"
                            >
                                <Heart size={20} />
                                {wishlist.length > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-amber-700 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                        {wishlist.length}
                                    </span>
                                )}
                            </Link>

                            {/* Cart */}
                            <Link
                                to="/cart"
                                className="relative p-2 text-gray-600 hover:text-amber-700 transition-colors rounded-full hover:bg-gray-100"
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
                                            className="px-4 py-2 bg-amber-100 text-amber-700 text-sm font-medium rounded-full hover:bg-amber-200 transition-colors"
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
                        <div className="flex items-center gap-2 lg:hidden">
                            <Link to="/cart" className="relative p-2 text-gray-600">
                                <ShoppingBag size={22} />
                                {cartCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-amber-700 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="p-2 text-gray-600 hover:text-amber-700 transition-colors"
                            >
                                {isOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className={`border-t border-gray-100 bg-gray-50 transition-all duration-300 overflow-hidden ${searchOpen ? 'max-h-20 py-3' : 'max-h-0 py-0'
                    }`}>
                    <div className="max-w-xl mx-auto px-4">
                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for silk sarees..."
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-700/20 focus:border-amber-700 text-sm"
                                autoFocus={searchOpen}
                            />
                            <button
                                type="submit"
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-amber-700 text-white rounded-full hover:bg-amber-800 transition-colors"
                            >
                                <Search size={16} />
                            </button>
                        </form>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                    }`}
                onClick={() => setIsOpen(false)}
            />

            {/* Mobile Menu */}
            <div className={`fixed top-0 right-0 bottom-0 w-72 bg-white z-50 lg:hidden transition-transform duration-300 shadow-xl ${isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}>
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <span className="text-lg font-serif font-bold text-amber-700">Menu</span>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-gray-600 hover:text-amber-700 transition-colors"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Mobile Nav Items */}
                <div className="py-2">
                    {menuItems.map((item, index) => (
                        <div key={index}>
                            <Link
                                to={item.path}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center justify-between px-5 py-3 text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors ${location.pathname === item.path ? 'text-amber-700 bg-amber-50' : ''
                                    }`}
                            >
                                <span className="font-medium">{item.name}</span>
                                {item.dropdown && <ChevronDown size={16} />}
                            </Link>
                            {item.dropdown && (
                                <div className="bg-gray-50">
                                    {item.dropdown.map((subItem, subIndex) => (
                                        <Link
                                            key={subIndex}
                                            to={subItem.path}
                                            onClick={() => setIsOpen(false)}
                                            className="block px-8 py-2.5 text-sm text-gray-600 hover:text-amber-700 transition-colors"
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
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
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
                                <p className="font-medium text-gray-900">{user.name}</p>
                                <p className="text-sm text-gray-500">View Profile</p>
                            </div>
                        </Link>
                    ) : (
                        <Link
                            to="/login"
                            onClick={() => setIsOpen(false)}
                            className="block w-full py-2.5 bg-amber-700 text-white text-amber-600enter font-medium rounded-full hover:bg-amber-800 transition-colors"
                        >
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;

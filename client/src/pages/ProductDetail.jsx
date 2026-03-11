import React, { useState, useEffect, useContext, useRef } from 'react';
import { Star, Minus, Plus, ShoppingBag, Heart, Share2, ArrowLeft, X, ZoomIn, ChevronLeft, ChevronRight, Truck, RotateCcw, IndianRupee, CheckCircle, Tag, Copy } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { getProductById, getProducts, getActiveCoupons } from '../services/api';

/* ─── Keyframe styles injected once ─────────────────────────────────────── */
const ANIM_STYLES = `
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeSlideLeft {
    from { opacity: 0; transform: translateX(40px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes pricePulse {
    0%, 100% { transform: scale(1); }
    50%       { transform: scale(1.06); }
  }
  @keyframes badgeFloat {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-4px); }
  }
  @keyframes heartbeat {
    0%   { transform: scale(1); }
    14%  { transform: scale(1.3); }
    28%  { transform: scale(1); }
    42%  { transform: scale(1.2); }
    70%  { transform: scale(1); }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  @keyframes cartBounce {
    0%, 100% { transform: translateY(0); }
    30%       { transform: translateY(-6px); }
    60%       { transform: translateY(-2px); }
  }
  @keyframes rowReveal {
    from { opacity: 0; transform: translateX(-16px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes iconSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes successPop {
    0%   { transform: scale(0.5); opacity: 0; }
    70%  { transform: scale(1.15); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes toastSlide {
    0%   { transform: translateY(80px); opacity: 0; }
    15%  { transform: translateY(0);    opacity: 1; }
    80%  { transform: translateY(0);    opacity: 1; }
    100% { transform: translateY(80px); opacity: 0; }
  }
  @keyframes lightboxIn {
    from { opacity: 0; transform: scale(0.92); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes imageFade {
    from { opacity: 0; transform: scale(1.04); }
    to   { opacity: 1; transform: scale(1); }
  }
`;

function useInView(ref, threshold = 0.15) {
    const [inView, setInView] = React.useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
        obs.observe(el);
        return () => obs.disconnect();
    }, [ref, threshold]);
    return inView;
}

/* ─── Toast notification ─────────────────────────────────────────────────── */
function Toast({ message, show }) {
    if (!show) return null;
    return (
        <div style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #7c2d12, #b45309)',
            color: '#fff', padding: '12px 28px', borderRadius: 40,
            fontWeight: 600, fontSize: 15, zIndex: 9999,
            display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            animation: 'toastSlide 3s ease forwards',
            whiteSpace: 'nowrap'
        }}>
            <CheckCircle size={18} />
            {message}
        </div>
    );
}

const ProductDetail = () => {
    const { id } = useParams();
    const [quantity, setQuantity] = useState(1);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [showLightbox, setShowLightbox] = useState(false);
    const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
    const [isZooming, setIsZooming] = useState(false);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [cartAnimating, setCartAnimating] = useState(false);
    const [wishAnimating, setWishAnimating] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '' });
    const [imgKey, setImgKey] = useState(0);
    const [activeCoupons, setActiveCoupons] = useState([]);

    const relatedScrollRef = useRef(null);
    const offersScrollRef = useRef(null);
    const imageRef = useRef(null);
    const galleryRef = useRef(null);
    const infoRef = useRef(null);
    const relatedRef = useRef(null);

    const galleryInView = useInView(galleryRef);
    const infoInView = useInView(infoRef);
    const relatedInView = useInView(relatedRef);

    const { addToCart, toggleWishlist, isInWishlist } = useContext(ShopContext);

    // Inject keyframes once
    useEffect(() => {
        const id = '__pd_anims__';
        if (!document.getElementById(id)) {
            const s = document.createElement('style');
            s.id = id;
            s.textContent = ANIM_STYLES;
            document.head.appendChild(s);
        }
    }, []);

    useEffect(() => {
        fetchProduct();
        fetchCoupons();
        setSelectedImage(0);
    }, [id]);

    const fetchCoupons = async () => {
        try {
            const { data } = await getActiveCoupons();
            setActiveCoupons(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching active coupons:', error);
        }
    };

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const { data } = await getProductById(id);
            setProduct(data);
            try {
                const allProducts = await getProducts();
                const similar = allProducts.data
                    .filter(p => p.category === data.category && p._id !== data._id)
                    .slice(0, 8);
                setSimilarProducts(similar);
            } catch (e) {
                console.log('Could not fetch similar products');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Product not found');
        } finally {
            setLoading(false);
        }
    };

    const getGalleryImages = () => {
        if (!product) return [];
        if (product.images && product.images.length > 0) return product.images;
        return [product.image, product.image, product.image, product.image];
    };

    const showToast = (msg) => {
        setToast({ show: true, message: msg });
        setTimeout(() => setToast({ show: false, message: '' }), 3100);
    };

    const handleQuantityChange = (type) => {
        if (type === 'dec' && quantity > 1) setQuantity(quantity - 1);
        if (type === 'inc' && quantity < (product?.countInStock || 10)) setQuantity(quantity + 1);
    };

    const handleAddToCart = () => {
        if (product) {
            addToCart(product, quantity);
            setCartAnimating(true);
            setTimeout(() => setCartAnimating(false), 700);
            showToast(`${quantity} item${quantity > 1 ? 's' : ''} added to cart!`);
        }
    };

    const handleWishlist = () => {
        if (product) {
            toggleWishlist(product);
            setWishAnimating(true);
            setTimeout(() => setWishAnimating(false), 700);
        }
    };

    const handleMouseMove = (e) => {
        if (!imageRef.current) return;
        const rect = imageRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setZoomPosition({ x, y });
    };

    const changeImage = (newIdx) => {
        setSelectedImage(newIdx);
        setImgKey(k => k + 1);
    };

    const handlePrevImage = () => {
        const images = getGalleryImages();
        changeImage(selectedImage === 0 ? images.length - 1 : selectedImage - 1);
    };

    const handleNextImage = () => {
        const images = getGalleryImages();
        changeImage(selectedImage === images.length - 1 ? 0 : selectedImage + 1);
    };

    const inWishlist = product ? isInWishlist(product._id) : false;
    const galleryImages = getGalleryImages();

    /* ─── Loading skeleton ────────────────────────────────────────────────── */
    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-950 min-h-screen flex items-center justify-center">
                <div className="text-center" style={{ animation: 'fadeIn 0.5s ease' }}>
                    <div style={{
                        width: 60, height: 60, borderRadius: '50%',
                        border: '4px solid #f3e8d0', borderTop: '4px solid #b45309',
                        animation: 'iconSpin 0.9s linear infinite', margin: '0 auto 16px'
                    }} />
                    <p style={{ color: '#9ca3af', fontWeight: 500, animation: 'fadeSlideUp 0.6s ease 0.2s both' }}>
                        Loading product details…
                    </p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="bg-white dark:bg-slate-950 min-h-screen pt-16 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
                    style={{ animation: 'fadeSlideUp 0.6s ease both' }}>
                    <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-gray-200 mb-3">Product Not Found</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">{error || 'The product you are looking for does not exist.'}</p>
                    <Link to="/products" className="inline-flex items-center gap-2 btn-primary">
                        <ArrowLeft size={18} />
                        Back to Products
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-950 pt-8 pb-16">
            <Toast show={toast.show} message={toast.message} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Breadcrumbs */}
                <nav className="text-sm text-gray-500 dark:text-gray-400 mb-8 flex items-center space-x-2"
                    style={{ animation: 'fadeIn 0.5s ease 0.1s both' }}>
                    <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                    <span>/</span>
                    <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
                    <span>/</span>
                    <Link to={`/products?category=${product.category}`} className="hover:text-primary transition-colors">{product.category}</Link>
                    <span>/</span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[200px]">{product.name}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

                    {/* ── Image Gallery ─────────────────────────────────────────────── */}
                    <div ref={galleryRef} className="space-y-4"
                        style={{
                            animation: galleryInView ? 'fadeSlideUp 0.7s cubic-bezier(.22,1,.36,1) both' : 'none',
                        }}>

                        {/* Main Image with Zoom */}
                        <div
                            ref={imageRef}
                            className="relative aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-xl cursor-zoom-in group"
                            style={{ boxShadow: '0 12px 48px rgba(0,0,0,0.12)', transition: 'box-shadow 0.3s' }}
                            onMouseEnter={() => setIsZooming(true)}
                            onMouseLeave={() => setIsZooming(false)}
                            onMouseMove={handleMouseMove}
                            onClick={() => setShowLightbox(true)}
                        >
                            <img
                                key={imgKey}
                                src={galleryImages[selectedImage]}
                                alt={product.name}
                                className={`w-full h-full object-cover transition-transform duration-300 ${isZooming ? 'scale-150' : 'scale-100'}`}
                                style={{
                                    transformOrigin: isZooming ? `${zoomPosition.x}% ${zoomPosition.y}%` : 'center',
                                    animation: 'imageFade 0.35s ease both',
                                }}
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/600x800?text=No+Image'; }}
                            />

                            {/* Gradient overlay for depth */}
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.18))',
                                pointerEvents: 'none'
                            }} />

                            {/* Zoom indicator */}
                            <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-2 rounded-full flex items-center gap-2 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ backdropFilter: 'blur(4px)' }}>
                                <ZoomIn size={16} />
                                Click to expand
                            </div>

                            {/* Wishlist Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleWishlist(); }}
                                style={{
                                    position: 'absolute', top: 16, right: 16,
                                    width: 48, height: 48, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: inWishlist ? '#ef4444' : 'rgba(255,255,255,0.92)',
                                    color: inWishlist ? '#fff' : '#6b7280',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                                    border: 'none', cursor: 'pointer', zIndex: 10,
                                    transition: 'transform 0.2s, background 0.3s',
                                    animation: wishAnimating ? 'heartbeat 0.7s ease' : 'none',
                                    backdropFilter: 'blur(4px)',
                                }}
                            >
                                <Heart size={22} fill={inWishlist ? 'currentColor' : 'none'} />
                            </button>

                            {/* Badges */}
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                {product.countInStock === 0 && (
                                    <div style={{
                                        background: '#ef4444', color: '#fff',
                                        padding: '6px 14px', fontWeight: 600, borderRadius: 8,
                                        boxShadow: '0 4px 12px rgba(239,68,68,0.35)',
                                        animation: 'badgeFloat 2.5s ease-in-out infinite',
                                    }}>
                                        Out of Stock
                                    </div>
                                )}
                                {product.isFeatured && product.countInStock > 0 && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                                        color: '#fff', padding: '6px 14px', fontWeight: 600, borderRadius: 8,
                                        boxShadow: '0 4px 12px rgba(124,58,237,0.4)',
                                        animation: 'badgeFloat 2.2s ease-in-out infinite',
                                    }}>
                                        ⭐ Featured
                                    </div>
                                )}
                            </div>

                            {/* Navigation Arrows */}
                            {galleryImages.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                                        style={{ transition: 'opacity 0.3s, transform 0.2s', backdropFilter: 'blur(6px)' }}
                                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                                        style={{ transition: 'opacity 0.3s, transform 0.2s', backdropFilter: 'blur(6px)' }}
                                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </>
                            )}

                            {/* Dot indicators */}
                            {galleryImages.length > 1 && (
                                <div style={{
                                    position: 'absolute', bottom: 14, left: '50%',
                                    transform: 'translateX(-50%)', display: 'flex', gap: 6
                                }}>
                                    {galleryImages.map((_, i) => (
                                        <button key={i} onClick={(e) => { e.stopPropagation(); changeImage(i); }}
                                            style={{
                                                width: selectedImage === i ? 20 : 6, height: 6, borderRadius: 4, border: 'none', cursor: 'pointer',
                                                background: selectedImage === i ? '#fff' : 'rgba(255,255,255,0.5)',
                                                transition: 'all 0.3s ease',
                                                padding: 0,
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Thumbnail Gallery */}
                        {galleryImages.length > 1 && (
                            <div className="grid grid-cols-4 gap-3">
                                {galleryImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        style={{
                                            borderRadius: 10, overflow: 'hidden', aspectRatio: '1/1',
                                            border: selectedImage === idx ? '2px solid #b45309' : '2px solid transparent',
                                            boxShadow: selectedImage === idx ? '0 0 0 3px rgba(180,83,9,0.25)' : 'none',
                                            transform: selectedImage === idx ? 'scale(1.04)' : 'scale(1)',
                                            transition: 'all 0.25s ease',
                                            padding: 0, cursor: 'pointer', background: 'none',
                                        }}
                                        onClick={() => changeImage(idx)}
                                    >
                                        <img
                                            src={img}
                                            alt={`View ${idx + 1}`}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Tip */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <ZoomIn size={16} />
                                Hover to zoom • Click to view full screen
                            </p>
                        </div>
                    </div>

                    {/* ── Product Info ───────────────────────────────────────────────── */}
                    <div ref={infoRef}
                        style={{ animation: infoInView ? 'fadeSlideLeft 0.7s cubic-bezier(.22,1,.36,1) 0.15s both' : 'none' }}>

                        {/* Brand & Category */}
                        <div className="flex items-center gap-3 mb-3"
                            style={{ animation: infoInView ? 'fadeIn 0.6s ease 0.3s both' : 'none' }}>
                            <span className="text-sm font-semibold text-primary uppercase tracking-wider">{product.brand}</span>
                            {product.brand && <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></span>}
                            <span className="text-sm text-gray-500 dark:text-gray-400">{product.category}</span>
                        </div>

                        {/* Title with Share */}
                        <div className="flex items-start justify-between gap-4 mb-4"
                            style={{ animation: infoInView ? 'fadeSlideUp 0.6s ease 0.35s both' : 'none' }}>
                            <h1 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900 dark:text-white leading-tight">
                                {product.name}
                            </h1>
                            <button
                                className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-primary hover:border-primary transition-all"
                                style={{ transition: 'transform 0.2s, color 0.2s, border-color 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'rotate(15deg) scale(1.1)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'rotate(0deg) scale(1)'}
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    showToast('Link copied to clipboard!');
                                }}
                                title="Share"
                            >
                                <Share2 size={18} />
                            </button>
                        </div>

                        {/* Rating & Stock */}
                        <div className="flex items-center flex-wrap gap-4 mb-6"
                            style={{ animation: infoInView ? 'fadeIn 0.6s ease 0.45s both' : 'none' }}>
                            <div className="flex items-center gap-1">
                                <div className="flex text-secondary">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={18}
                                            fill={i < Math.floor(product.rating || 4) ? 'currentColor' : 'none'}
                                            className={i < Math.floor(product.rating || 4) ? '' : 'text-gray-300'}
                                            style={{
                                                animation: infoInView
                                                    ? `fadeSlideUp 0.4s ease ${0.5 + i * 0.07}s both`
                                                    : 'none',
                                                filter: i < Math.floor(product.rating || 4) ? 'drop-shadow(0 0 3px rgba(245,158,11,0.5))' : 'none'
                                            }}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm text-gray-500 ml-1">({product.numReviews || 0} reviews)</span>
                            </div>
                            <span className="text-gray-300">|</span>
                            <span className={`font-medium text-sm px-3 py-1 rounded-full ${product.countInStock > 10
                                ? 'bg-green-100 text-green-700'
                                : product.countInStock > 0
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                                style={{
                                    animation: infoInView ? 'badgeFloat 3s ease-in-out infinite' : 'none',
                                    boxShadow: product.countInStock > 10
                                        ? '0 2px 8px rgba(21,128,61,0.2)'
                                        : product.countInStock > 0
                                            ? '0 2px 8px rgba(161,98,7,0.2)'
                                            : '0 2px 8px rgba(185,28,28,0.2)'
                                }}>
                                {product.countInStock > 10 ? `✓ In Stock`
                                    : product.countInStock > 0 ? `Only ${product.countInStock} left!`
                                        : 'Out of Stock'}
                            </span>
                        </div>

                        {/* Price */}
                        <div className="mb-8"
                            style={{ animation: infoInView ? 'fadeSlideUp 0.6s ease 0.5s both' : 'none' }}>
                            <div className="flex items-baseline gap-3 flex-wrap">
                                <span className="text-4xl font-bold text-gray-900 dark:text-white"
                                    style={{ animation: infoInView ? 'pricePulse 1.8s ease 1s 2' : 'none' }}>
                                    ₹{product.price?.toLocaleString()}
                                </span>
                                {product.originalPrice > product.price && (
                                    <>
                                        <span className="text-xl text-gray-400 line-through">
                                            ₹{product.originalPrice?.toLocaleString()}
                                        </span>
                                        <span className="text-lg font-semibold text-green-600"
                                            style={{
                                                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                            }}>
                                            {Math.round((1 - product.price / product.originalPrice) * 100)}% Off
                                        </span>
                                    </>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Inclusive of all taxes</p>
                        </div>

                        {/* Product Information Table */}
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl mb-8 overflow-hidden"
                            style={{
                                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                                animation: infoInView ? 'fadeSlideUp 0.7s ease 0.55s both' : 'none'
                            }}>
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700"
                                style={{ background: 'linear-gradient(90deg, #fef3c7 0%, #fff7ed 100%)' }}>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Product Information</h3>
                            </div>
                            <div className="px-6">
                                {[
                                    product.material && ['Fabric Type', product.material],
                                    ['Occasion', 'Party, Festive & Wedding'],
                                    product.careInstructions && ['Fabric Care', product.careInstructions],
                                    ['Ideal For', 'Women'],
                                    ['Product Type', 'Saree'],
                                    product.color && ['Color', product.color],
                                    ['Note', 'Actual Product Color May Vary Due To Brightness And Camera Quality Of Different Devices.'],
                                    ['Saree Length', '5.50 Mtr'],
                                    ['Blouse Length', '0.80 Mtr'],
                                    ['Country', 'Made In India'],
                                ].filter(Boolean).map(([label, value], i) => (
                                    <div key={label} className="flex py-4 border-b border-gray-100 dark:border-gray-700 last:border-0"
                                        style={{
                                            animation: infoInView ? `rowReveal 0.5s ease ${0.6 + i * 0.06}s both` : 'none',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#fffbf5'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <span className="w-1/3 text-gray-500 dark:text-gray-400">{label}</span>
                                        <span className="w-2/3 text-gray-700 dark:text-gray-300 font-medium">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Delivery Features */}
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl mb-8 overflow-hidden"
                            style={{
                                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                                animation: infoInView ? 'fadeSlideUp 0.7s ease 0.7s both' : 'none'
                            }}>
                            <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700">
                                {[
                                    { icon: <IndianRupee size={24} />, label: 'Cash on Delivery', sub: null },
                                    { icon: <RotateCcw size={24} />, label: '3 days Return', sub: '(Wrong/damaged items only)' },
                                    { icon: <Truck size={24} />, label: 'Free Delivery', sub: null },
                                ].map(({ icon, label, sub }, i) => (
                                    <div key={label} className="flex flex-col items-center justify-center py-5 px-2 group"
                                        style={{ cursor: 'default' }}>
                                        <div className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 mb-2"
                                            style={{
                                                transition: 'transform 0.3s, color 0.3s',
                                                animation: infoInView ? `fadeSlideUp 0.5s ease ${0.75 + i * 0.1}s both` : 'none',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.2) rotate(-8deg)'; e.currentTarget.style.color = '#b45309'; }}
                                            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) rotate(0deg)'; e.currentTarget.style.color = ''; }}
                                        >
                                            {icon}
                                        </div>
                                        <span className="text-xs text-gray-700 dark:text-gray-300 text-center font-medium">{label}</span>
                                        {sub && <span className="text-xs text-gray-500 dark:text-gray-400 text-center">{sub}</span>}
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-700 py-3 text-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Get it delivered in <span className="font-semibold text-gray-900 dark:text-white">3-6 days</span>
                                </span>
                            </div>
                        </div>

                        {/* Add to Cart */}
                        {product.countInStock > 0 && (
                            <div className="sticky bottom-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6"
                                style={{
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                    animation: infoInView ? 'fadeSlideUp 0.6s ease 0.8s both' : 'none',
                                }}>
                                <div className="flex items-center gap-4">
                                    {/* Quantity Selector */}
                                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => handleQuantityChange('dec')}
                                            className="p-3 hover:text-primary transition-all hover:bg-amber-50"
                                            style={{ transition: 'transform 0.15s' }}
                                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                        >
                                            <Minus size={18} />
                                        </button>
                                        <span className="w-12 text-center font-bold text-lg"
                                            style={{ transition: 'transform 0.2s' }}>
                                            {quantity}
                                        </span>
                                        <button
                                            onClick={() => handleQuantityChange('inc')}
                                            className="p-3 hover:text-primary transition-all hover:bg-amber-50"
                                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>

                                    {/* Add to Cart Button */}
                                    <button
                                        onClick={handleAddToCart}
                                        style={{
                                            flex: 1,
                                            background: 'linear-gradient(135deg, #b45309, #92400e)',
                                            color: '#fff', padding: '14px 24px',
                                            fontWeight: 700, fontSize: 15, borderRadius: 10,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                            border: 'none', cursor: 'pointer',
                                            boxShadow: '0 6px 20px rgba(180,83,9,0.4)',
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            animation: cartAnimating ? 'cartBounce 0.6s ease' : 'none',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(180,83,9,0.5)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(180,83,9,0.4)'; }}
                                        onMouseDown={e => e.currentTarget.style.transform = 'translateY(1px)'}
                                        onMouseUp={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    >
                                        <ShoppingBag size={20} />
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Wishlist */}
                        <div className="flex items-center gap-6 mb-8"
                            style={{ animation: infoInView ? 'fadeIn 0.6s ease 0.9s both' : 'none' }}>
                            <button
                                onClick={handleWishlist}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    fontWeight: 600, border: 'none', background: 'none',
                                    cursor: 'pointer', padding: '8px 0',
                                    color: inWishlist ? '#ef4444' : '#6b7280',
                                    transition: 'color 0.3s, transform 0.2s',
                                    animation: wishAnimating ? 'heartbeat 0.7s ease' : 'none',
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <Heart size={20} fill={inWishlist ? 'currentColor' : 'none'} />
                                <span>{inWishlist ? 'Saved to Wishlist' : 'Add to Wishlist'}</span>
                            </button>
                        </div>

                        {/* ── Active Offers (Horizontal Scroll) ────────────────────────── */}
                        {activeCoupons.length > 0 && (
                            <div className="bg-orange-50/50 dark:bg-orange-950/20 rounded-2xl p-4 sm:p-5 border border-orange-100 dark:border-orange-900/40 relative"
                                style={{ animation: infoInView ? 'fadeSlideUp 0.7s ease 1s both' : 'none' }}>
                                
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                                        {activeCoupons.length} Limited Time Offers
                                    </h3>
                                </div>

                                {/* Custom Scroll Buttons */}
                                {activeCoupons.length > 2 && (
                                    <>
                                        <button 
                                            onClick={() => offersScrollRef.current?.scrollBy({ left: -250, behavior: 'smooth' })}
                                            className="absolute left-2 top-[60%] -translate-y-1/2 w-8 h-8 bg-white dark:bg-gray-800 rounded-full shadow-md flex items-center justify-center text-gray-600 dark:text-gray-300 z-10 border border-gray-100 dark:border-gray-700 hover:text-primary transition-colors hidden sm:flex"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <button 
                                            onClick={() => offersScrollRef.current?.scrollBy({ left: 250, behavior: 'smooth' })}
                                            className="absolute right-2 top-[60%] -translate-y-1/2 w-8 h-8 bg-white dark:bg-gray-800 rounded-full shadow-md flex items-center justify-center text-gray-600 dark:text-gray-300 z-10 border border-gray-100 dark:border-gray-700 hover:text-primary transition-colors hidden sm:flex"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </>
                                )}

                                <div 
                                    ref={offersScrollRef}
                                    className="flex gap-4 overflow-x-auto pb-2 snap-x hide-scroll"
                                    style={{ scrollBehavior: 'smooth' }}
                                >
                                    {activeCoupons.map((coupon, idx) => {
                                        const ribbonLabel = coupon.discountType === 'percentage' 
                                            ? `${coupon.discountValue}% OFF` 
                                            : `FLAT ₹${coupon.discountValue}`;
                                        
                                        return (
                                            <div 
                                                key={coupon._id}
                                                className="snap-start min-w-[240px] sm:min-w-[280px] bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm relative overflow-hidden group flex-shrink-0 flex flex-col justify-between"
                                            >
                                                {/* Left Accent line */}
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>

                                                <div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-widest pl-2">
                                                            {ribbonLabel}
                                                        </span>
                                                        {coupon.minimumPurchaseAmount > 0 && (
                                                            <span className="text-[10px] text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                                                Min ₹{coupon.minimumPurchaseAmount}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white capitalize mb-4 pl-2">
                                                        {coupon.description || 'Special Discount'}
                                                    </h4>
                                                </div>

                                                <div className="mt-2 pl-2 flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                        <span>Code:</span>
                                                        <span className="font-mono font-bold text-gray-800 dark:text-white border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                                                            {coupon.couponCode}
                                                        </span>
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(coupon.couponCode);
                                                            showToast('Coupon code copied!');
                                                        }}
                                                        className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-800 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 transition-colors text-gray-600 dark:text-gray-400"
                                                        title="Copy Code"
                                                    >
                                                        <Copy size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        
                    </div>
                </div>
            </div>

            <style>{`
                .hide-scroll::-webkit-scrollbar {
                    display: none;
                }
                .hide-scroll {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                }
            `}</style>

            {/* ── Lightbox ──────────────────────────────────────────────────────── */}
            {showLightbox && (
                <div
                    className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
                    style={{ animation: 'fadeIn 0.25s ease' }}
                    onClick={() => setShowLightbox(false)}
                >
                    <button
                        onClick={() => setShowLightbox(false)}
                        className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
                        style={{ backdropFilter: 'blur(6px)', transition: 'transform 0.2s, background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'rotate(0deg) scale(1)'}
                    >
                        <X size={24} />
                    </button>

                    {galleryImages.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                                className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
                                style={{ backdropFilter: 'blur(6px)' }}
                            ><ChevronLeft size={28} /></button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                                className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
                                style={{ backdropFilter: 'blur(6px)' }}
                            ><ChevronRight size={28} /></button>
                        </>
                    )}

                    <img
                        key={`lb-${imgKey}`}
                        src={galleryImages[selectedImage]}
                        alt={product.name}
                        className="max-w-[90vw] max-h-[85vh] object-contain"
                        style={{ animation: 'lightboxIn 0.3s cubic-bezier(.22,1,.36,1) both', borderRadius: 8 }}
                        onClick={(e) => e.stopPropagation()}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/800x1000?text=No+Image'; }}
                    />

                    {galleryImages.length > 1 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                            {galleryImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); changeImage(idx); }}
                                    style={{
                                        width: 60, height: 60, borderRadius: 8, overflow: 'hidden', padding: 0,
                                        border: selectedImage === idx ? '2px solid #fff' : '2px solid rgba(255,255,255,0.3)',
                                        transform: selectedImage === idx ? 'scale(1.08)' : 'scale(1)',
                                        transition: 'all 0.25s ease', cursor: 'pointer', background: 'none',
                                    }}
                                >
                                    <img src={img} alt={`View ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="absolute top-6 left-6 bg-white/10 text-white px-4 py-2 rounded-full text-sm"
                        style={{ backdropFilter: 'blur(6px)' }}>
                        {selectedImage + 1} / {galleryImages.length}
                    </div>
                </div>
            )}

            {/* ── Related Products ──────────────────────────────────────────────── */}
            {similarProducts.length > 0 && (
                <div ref={relatedRef}
                    className="bg-gradient-to-b from-amber-50/50 to-orange-50/30 dark:from-gray-900 dark:to-slate-950 py-16 mt-8"
                    style={{ animation: relatedInView ? 'fadeSlideUp 0.7s ease 0.1s both' : 'none' }}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Heading */}
                        <div className="text-center mb-12">
                            <div className="flex items-center justify-center gap-4 mb-4">
                                <div className="w-16 h-px bg-gradient-to-r from-transparent to-secondary"></div>
                                <span className="text-secondary text-lg" style={{ animation: relatedInView ? 'badgeFloat 2s ease-in-out infinite' : 'none' }}>✦</span>
                                <div className="w-16 h-px bg-gradient-to-l from-transparent to-secondary"></div>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-serif tracking-wide text-gray-900 dark:text-white">
                                RELATED PRODUCTS
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Explore similar styles you might love</p>
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => relatedScrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-12 h-12 bg-white dark:bg-gray-800 border border-secondary/30 rounded-full shadow-lg flex items-center justify-center text-primary hover:bg-primary hover:text-white hover:border-primary transition-all hidden md:flex"
                                style={{ transition: 'transform 0.2s, background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
                            ><ChevronLeft size={24} /></button>

                            <div
                                ref={relatedScrollRef}
                                className="flex gap-6 overflow-x-auto pb-4 scroll-smooth px-2"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {similarProducts.map((item, i) => (
                                    <Link
                                        key={item._id}
                                        to={`/product/${item._id}`}
                                        className="flex-shrink-0 w-64 group"
                                        style={{ animation: relatedInView ? `fadeSlideUp 0.5s ease ${0.1 + i * 0.08}s both` : 'none' }}
                                    >
                                        <div style={{
                                            position: 'relative', overflow: 'hidden',
                                            background: '#fff', borderRadius: 12,
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                            aspectRatio: '3/4', marginBottom: 14,
                                            border: '1px solid #fef3c7',
                                            transition: 'box-shadow 0.3s, transform 0.3s',
                                        }}
                                            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 36px rgba(0,0,0,0.18)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                        >
                                            {item.originalPrice > item.price && (
                                                <div style={{
                                                    position: 'absolute', top: 12, left: 12,
                                                    background: '#b45309', color: '#fff',
                                                    fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, zIndex: 10,
                                                    boxShadow: '0 2px 8px rgba(180,83,9,0.4)'
                                                }}>
                                                    SAVE {Math.round((1 - item.price / item.originalPrice) * 100)}%
                                                </div>
                                            )}
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease', display: 'block' }}
                                                className="group-hover:scale-105"
                                                onError={(e) => { e.target.src = 'https://via.placeholder.com/400x500?text=No+Image'; }}
                                            />
                                            <div style={{
                                                position: 'absolute', bottom: 12, left: '50%',
                                                transform: 'translateX(-50%) translateY(60px)',
                                                transition: 'transform 0.3s ease',
                                            }} className="group-hover:[transform:translateX(-50%)_translateY(0)]">
                                                <div style={{
                                                    width: 40, height: 40, background: '#fff', borderRadius: '50%',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#b45309', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                    transition: 'background 0.2s, color 0.2s',
                                                }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = '#b45309'; e.currentTarget.style.color = '#fff'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#b45309'; }}
                                                >
                                                    <ShoppingBag size={18} />
                                                </div>
                                            </div>
                                        </div>
                                        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 uppercase tracking-wide text-center mb-2 group-hover:text-primary transition-colors line-clamp-2 px-2">
                                            {item.name}
                                        </h3>
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="text-lg font-bold text-primary">₹{item.price?.toLocaleString()}</span>
                                            {item.originalPrice > item.price && (
                                                <span className="text-sm text-gray-400 line-through">₹{item.originalPrice?.toLocaleString()}</span>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            <button
                                onClick={() => relatedScrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
                                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-12 h-12 bg-white dark:bg-gray-800 border border-secondary/30 rounded-full shadow-lg flex items-center justify-center text-primary hover:bg-primary hover:text-white hover:border-primary transition-all hidden md:flex"
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
                            ><ChevronRight size={24} /></button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetail;

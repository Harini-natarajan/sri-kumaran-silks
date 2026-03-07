import React, { useState, useEffect, useContext, useRef } from 'react';
import { Star, Minus, Plus, ShoppingBag, Heart, Share2, ArrowLeft, X, ZoomIn, ChevronLeft, ChevronRight, Truck, RotateCcw, IndianRupee } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { getProductById, getProducts } from '../services/api';

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
    const relatedScrollRef = useRef(null);
    const imageRef = useRef(null);
    const { addToCart, toggleWishlist, isInWishlist } = useContext(ShopContext);

    useEffect(() => {
        fetchProduct();
        setSelectedImage(0);
    }, [id]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const { data } = await getProductById(id);
            setProduct(data);

            // Fetch similar products from same category
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

    // Generate multiple gallery images from single image
    const getGalleryImages = () => {
        if (!product) return [];
        // If product has multiple images, use them; otherwise create variations
        if (product.images && product.images.length > 0) {
            return product.images;
        }
        // Create gallery with same image (in production, you'd have multiple angles)
        return [
            product.image,
            product.image,
            product.image,
            product.image
        ];
    };

    const handleQuantityChange = (type) => {
        if (type === 'dec' && quantity > 1) setQuantity(quantity - 1);
        if (type === 'inc' && quantity < (product?.countInStock || 10)) setQuantity(quantity + 1);
    };

    const handleAddToCart = () => {
        if (product) {
            addToCart(product, quantity);
            alert(`Added ${quantity} item(s) to cart!`);
        }
    };

    const handleWishlist = () => {
        if (product) {
            toggleWishlist(product);
        }
    };

    const handleMouseMove = (e) => {
        if (!imageRef.current) return;
        const rect = imageRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setZoomPosition({ x, y });
    };

    const handlePrevImage = () => {
        const images = getGalleryImages();
        setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNextImage = () => {
        const images = getGalleryImages();
        setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const inWishlist = product ? isInWishlist(product._id) : false;
    const galleryImages = getGalleryImages();

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-950 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading product...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="bg-white dark:bg-slate-950 min-h-screen pt-16 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Breadcrumbs */}
                <nav className="text-sm text-gray-500 dark:text-gray-400 mb-8 flex items-center space-x-2">
                    <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                    <span>/</span>
                    <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
                    <span>/</span>
                    <Link to={`/products?category=${product.category}`} className="hover:text-primary transition-colors">{product.category}</Link>
                    <span>/</span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[200px]">{product.name}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

                    {/* Image Gallery Section */}
                    <div className="space-y-4">
                        {/* Main Image with Zoom */}
                        <div
                            ref={imageRef}
                            className="relative aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-lg cursor-zoom-in group"
                            onMouseEnter={() => setIsZooming(true)}
                            onMouseLeave={() => setIsZooming(false)}
                            onMouseMove={handleMouseMove}
                            onClick={() => setShowLightbox(true)}
                        >
                            {/* Main Image */}
                            <img
                                src={galleryImages[selectedImage]}
                                alt={product.name}
                                className={`w-full h-full object-cover transition-transform duration-300 ${isZooming ? 'scale-150' : 'scale-100'}`}
                                style={isZooming ? {
                                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                                } : {}}
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/600x800?text=No+Image'; }}
                            />

                            {/* Zoom Indicator */}
                            <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-2 rounded-full flex items-center gap-2 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                <ZoomIn size={16} />
                                Click to expand
                            </div>

                            {/* Wishlist Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleWishlist(); }}
                                className={`absolute top-4 right-4 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all z-10 ${inWishlist
                                    ? 'bg-red-500 text-white'
                                    : 'bg-white text-gray-600 hover:text-red-500 hover:bg-red-50'
                                    }`}
                            >
                                <Heart size={22} fill={inWishlist ? 'currentColor' : 'none'} />
                            </button>

                            {/* Stock/Featured Badges */}
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                {product.countInStock === 0 && (
                                    <div className="bg-red-500 text-white px-4 py-2 font-medium rounded-lg shadow-md">
                                        Out of Stock
                                    </div>
                                )}
                                {product.isFeatured && product.countInStock > 0 && (
                                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 font-medium rounded-lg shadow-md">
                                        ⭐ Featured
                                    </div>
                                )}
                            </div>

                            {/* Navigation Arrows */}
                            {galleryImages.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnail Gallery */}
                        {galleryImages.length > 1 && (
                            <div className="grid grid-cols-4 gap-3">
                                {galleryImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx
                                            ? 'border-primary shadow-md'
                                            : 'border-transparent hover:border-gray-300'
                                            }`}
                                        onClick={() => setSelectedImage(idx)}
                                    >
                                        <img
                                            src={img}
                                            alt={`View ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Image Tips */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <ZoomIn size={16} />
                                Hover to zoom • Click to view full screen
                            </p>
                        </div>
                    </div>

                    {/* Product Info Section */}
                    <div>
                        {/* Brand & Category */}
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-sm font-semibold text-primary uppercase tracking-wider">{product.brand}</span>
                            {product.brand && <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></span>}
                            <span className="text-sm text-gray-500 dark:text-gray-400">{product.category}</span>
                        </div>

                        {/* Title with Share Button */}
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <h1 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900 dark:text-white leading-tight">
                                {product.name}
                            </h1>
                            <button
                                className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-primary hover:border-primary transition-colors"
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    alert('Link copied to clipboard!');
                                }}
                                title="Share"
                            >
                                <Share2 size={18} />
                            </button>
                        </div>

                        {/* Rating & Stock */}
                        <div className="flex items-center flex-wrap gap-4 mb-6">
                            <div className="flex items-center gap-1">
                                <div className="flex text-secondary">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={18} fill={i < Math.floor(product.rating || 4) ? "currentColor" : "none"}
                                            className={i < Math.floor(product.rating || 4) ? "" : "text-gray-300"} />
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
                                }`}>
                                {product.countInStock > 10
                                    ? `✓ In Stock`
                                    : product.countInStock > 0
                                        ? `Only ${product.countInStock} left!`
                                        : 'Out of Stock'}
                            </span>
                        </div>

                        {/* Price */}
                        <div className="mb-8">
                            <div className="flex items-baseline gap-3 flex-wrap">
                                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                    ₹{product.price?.toLocaleString()}
                                </span>
                                {product.originalPrice > product.price && (
                                    <>
                                        <span className="text-xl text-gray-400 line-through">
                                            ₹{product.originalPrice?.toLocaleString()}
                                        </span>
                                        <span className="text-lg font-semibold text-green-600">
                                            {Math.round((1 - product.price / product.originalPrice) * 100)}% Off
                                        </span>
                                    </>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Inclusive of all taxes</p>
                        </div>

                        {/* Product Information */}
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg mb-8">
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Product Information</h3>
                            </div>
                            <div className="px-6">
                                {product.material && (
                                    <div className="flex py-4 border-b border-gray-100 dark:border-gray-700">
                                        <span className="w-1/3 text-gray-500 dark:text-gray-400">Fabric Type</span>
                                        <span className="w-2/3 text-gray-700 dark:text-gray-300 font-medium">{product.material}</span>
                                    </div>
                                )}
                                <div className="flex py-4 border-b border-gray-100 dark:border-gray-700">
                                    <span className="w-1/3 text-gray-500 dark:text-gray-400">Occasion</span>
                                    <span className="w-2/3 text-gray-700 dark:text-gray-300 font-medium">Party, Festive & Wedding</span>
                                </div>
                                {product.careInstructions && (
                                    <div className="flex py-4 border-b border-gray-100">
                                        <span className="w-1/3 text-gray-500">Fabric Care</span>
                                        <span className="w-2/3 text-gray-700 font-medium">{product.careInstructions}</span>
                                    </div>
                                )}
                                <div className="flex py-4 border-b border-gray-100">
                                    <span className="w-1/3 text-gray-500">Ideal For</span>
                                    <span className="w-2/3 text-gray-700 font-medium">Women</span>
                                </div>
                                <div className="flex py-4 border-b border-gray-100">
                                    <span className="w-1/3 text-gray-500">Product Type</span>
                                    <span className="w-2/3 text-gray-700 font-medium">Saree</span>
                                </div>
                                {product.color && (
                                    <div className="flex py-4 border-b border-gray-100">
                                        <span className="w-1/3 text-gray-500">Color</span>
                                        <span className="w-2/3 text-gray-700 font-medium">{product.color}</span>
                                    </div>
                                )}
                                <div className="flex py-4 border-b border-gray-100">
                                    <span className="w-1/3 text-gray-500">Note</span>
                                    <span className="w-2/3 text-gray-700 font-medium">Actual Product Color May Vary Due To Brightness And Camera Quality Of Different Devices.</span>
                                </div>
                                <div className="flex py-4 border-b border-gray-100">
                                    <span className="w-1/3 text-gray-500">Saree Length</span>
                                    <span className="w-2/3 text-gray-700 font-medium">5.50 Mtr</span>
                                </div>
                                <div className="flex py-4 border-b border-gray-100">
                                    <span className="w-1/3 text-gray-500">Blouse Length</span>
                                    <span className="w-2/3 text-gray-700 font-medium">0.80 Mtr</span>
                                </div>
                                <div className="flex py-4">
                                    <span className="w-1/3 text-gray-500">Country</span>
                                    <span className="w-2/3 text-gray-700 font-medium">Made In India</span>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Features */}
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg mb-8">
                            <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700">
                                <div className="flex flex-col items-center justify-center py-4 px-2">
                                    <div className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 mb-2">
                                        <IndianRupee size={24} />
                                    </div>
                                    <span className="text-xs text-gray-700 dark:text-gray-300 text-center font-medium">Cash on Delivery</span>
                                </div>
                                <div className="flex flex-col items-center justify-center py-4 px-2">
                                    <div className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 mb-2">
                                        <RotateCcw size={24} />
                                    </div>
                                    <span className="text-xs text-gray-700 dark:text-gray-300 text-center font-medium">3 days Return</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 text-center">(Wrong/damaged items only)</span>
                                </div>
                                <div className="flex flex-col items-center justify-center py-4 px-2">
                                    <div className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 mb-2">
                                        <Truck size={24} />
                                    </div>
                                    <span className="text-xs text-gray-700 dark:text-gray-300 text-center font-medium">Free Delivery</span>
                                </div>
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-700 py-3 text-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Get it delivered in <span className="font-semibold text-gray-900 dark:text-white">3-6 days</span></span>
                            </div>
                        </div>

                        {/* Add to Cart Section */}
                        {product.countInStock > 0 && (
                            <div className="sticky bottom-4 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
                                <div className="flex items-center gap-4">
                                    {/* Quantity Selector */}
                                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                                        <button
                                            onClick={() => handleQuantityChange('dec')}
                                            className="p-3 hover:text-primary transition-colors hover:bg-gray-50"
                                        >
                                            <Minus size={18} />
                                        </button>
                                        <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                                        <button
                                            onClick={() => handleQuantityChange('inc')}
                                            className="p-3 hover:text-primary transition-colors hover:bg-gray-50"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>

                                    {/* Add to Cart Button */}
                                    <button
                                        onClick={handleAddToCart}
                                        className="flex-1 bg-primary text-white py-4 px-8 font-semibold rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                                    >
                                        <ShoppingBag size={20} />
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-6">
                            <button
                                onClick={handleWishlist}
                                className={`flex items-center gap-2 font-medium transition-colors ${inWishlist
                                    ? 'text-red-500'
                                    : 'text-gray-600 hover:text-primary'
                                    }`}
                            >
                                <Heart size={20} fill={inWishlist ? 'currentColor' : 'none'} />
                                <span>{inWishlist ? 'Saved to Wishlist' : 'Add to Wishlist'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lightbox Modal */}
            {showLightbox && (
                <div
                    className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
                    onClick={() => setShowLightbox(false)}
                >
                    {/* Close Button */}
                    <button
                        onClick={() => setShowLightbox(false)}
                        className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                        <X size={24} />
                    </button>

                    {/* Navigation */}
                    {galleryImages.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                                className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                            >
                                <ChevronLeft size={28} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                                className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                            >
                                <ChevronRight size={28} />
                            </button>
                        </>
                    )}

                    {/* Image */}
                    <img
                        src={galleryImages[selectedImage]}
                        alt={product.name}
                        className="max-w-[90vw] max-h-[85vh] object-contain"
                        onClick={(e) => e.stopPropagation()}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/800x1000?text=No+Image'; }}
                    />

                    {/* Thumbnails */}
                    {galleryImages.length > 1 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                            {galleryImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); setSelectedImage(idx); }}
                                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx
                                        ? 'border-white'
                                        : 'border-white/30 hover:border-white/60'
                                        }`}
                                >
                                    <img
                                        src={img}
                                        alt={`View ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Image Counter */}
                    <div className="absolute top-6 left-6 bg-white/10 text-white px-4 py-2 rounded-full text-sm">
                        {selectedImage + 1} / {galleryImages.length}
                    </div>
                </div>
            )}

            {/* Related Products Section */}
            {similarProducts.length > 0 && (
                <div className="bg-gradient-to-b from-amber-50/50 to-orange-50/30 dark:from-gray-900 dark:to-slate-950 py-16 mt-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Decorative heading */}
                        <div className="text-center mb-12">
                            <div className="flex items-center justify-center gap-4 mb-4">
                                <div className="w-16 h-px bg-gradient-to-r from-transparent to-secondary"></div>
                                <span className="text-secondary text-lg">✦</span>
                                <div className="w-16 h-px bg-gradient-to-l from-transparent to-secondary"></div>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-serif tracking-wide text-gray-900 dark:text-white">
                                RELATED PRODUCTS
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Explore similar styles you might love</p>
                        </div>

                        <div className="relative">
                            {/* Left Arrow */}
                            <button
                                onClick={() => {
                                    if (relatedScrollRef.current) {
                                        relatedScrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
                                    }
                                }}
                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-12 h-12 bg-white dark:bg-gray-800 border border-secondary/30 dark:border-gray-600 rounded-full shadow-lg flex items-center justify-center text-primary hover:bg-primary hover:text-white hover:border-primary transition-all hidden md:flex"
                            >
                                <ChevronLeft size={24} />
                            </button>

                            {/* Scrollable Container */}
                            <div
                                ref={relatedScrollRef}
                                className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth px-2"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {similarProducts.map((item) => (
                                    <Link
                                        key={item._id}
                                        to={`/product/${item._id}`}
                                        className="flex-shrink-0 w-64 group"
                                    >
                                        <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-md aspect-[3/4] mb-4 border border-amber-100 dark:border-gray-700">
                                            {/* Save Badge */}
                                            {item.originalPrice > item.price && (
                                                <div className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded z-10">
                                                    SAVE {Math.round((1 - item.price / item.originalPrice) * 100)}%
                                                </div>
                                            )}
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                onError={(e) => { e.target.src = 'https://via.placeholder.com/400x500?text=No+Image'; }}
                                            />
                                            {/* Quick View Icon */}
                                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                                <div className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors">
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

                            {/* Right Arrow */}
                            <button
                                onClick={() => {
                                    if (relatedScrollRef.current) {
                                        relatedScrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
                                    }
                                }}
                                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-12 h-12 bg-white dark:bg-gray-800 border border-secondary/30 dark:border-gray-600 rounded-full shadow-lg flex items-center justify-center text-primary hover:bg-primary hover:text-white hover:border-primary transition-all hidden md:flex"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetail;

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Star, Truck, Shield, Award, Sparkles, Heart } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getProducts } from '../services/api';
import Loader from '../components/Loader';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [currentPromo, setCurrentPromo] = useState(0);
    const [currentTestimonial, setCurrentTestimonial] = useState(0);
    const scrollRef = useRef(null);
    const [catIndex, setCatIndex] = useState(0);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const { data } = await getProducts();
            setProducts(data.slice(0, 8));
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const banners = [
        {
            id: 1,
            image: "https://www.kumaransilksonline.com/cdn/shop/articles/Significance-of-the-Peacock-Motif-in-Kanchipuram-Silk-Sarees_047b739c-5831-4421-9ec2-8dd96f442a2e.jpg?v=1766576608&width=1024",
            subtitle: "Handwoven Excellence",
            title: "Timeless Elegance of Silk",
            description: "Explore our exclusive collection of Kanchipuram and Banarasi sarees, woven with tradition and passion.",
            link: "/products?category=Kanchipuram"
        },
        {
            id: 2,
            image: "https://2.wlimg.com/product_images/bc-full/2021/2/1818401/golden-bridal-silk-sarees-1614519409-5737874.jpeg",
            subtitle: "Royal Banarasi Collection",
            title: "Weaving Stories in Gold",
            description: "Adorn yourself with the intricate artistry of Banarasi silk, perfect for weddings and festivities.",
            link: "/products?category=Banarasi"
        },
        {
            id: 3,
            image: "https://www.palamsilk.com/cdn/shop/files/DSC_6450_1024x1024.jpg?v=1685651913",
            subtitle: "Contemporary Soft Silk",
            title: "Modern Grace & Comfort",
            description: "Experience the perfect blend of tradition and comfort with our lightweight soft silk collection.",
            link: "/products?category=Soft Silk"
        }
    ];

    useEffect(() => {
        const bannerTimer = setInterval(() => {
            setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
        }, 2000);
        return () => clearInterval(bannerTimer);
    }, [banners.length]);

    const promoSlides = [
        {
            tag: "Limited Offer",
            title: "Get 20% Off Your First Order",
            subtitle: "Use code",
            code: "SILK20",
            afterCode: "at checkout",
            cta: "Shop Now",
            link: "/products"
        },
        {
            tag: "New Arrivals",
            title: "The Royal Kanchipuram Collection",
            subtitle: "Explore",
            code: "NEW50",
            afterCode: "exclusive designs",
            cta: "Explore Now",
            link: "/products?category=Kanchipuram"
        },
        {
            tag: "Free Shipping",
            title: "Complimentary Global Delivery",
            subtitle: "On orders above",
            code: "₹2000",
            afterCode: "across India",
            cta: "Buy Now",
            link: "/products"
        }
    ];

    useEffect(() => {
        const promoTimer = setInterval(() => {
            setCurrentPromo((prev) => (prev === promoSlides.length - 1 ? 0 : prev + 1));
        }, 2000);
        return () => clearInterval(promoTimer);
    }, [promoSlides.length]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    };

    const categories = [
        { name: 'Kanchipuram Silk', desc: 'Temple-inspired luxury', img: 'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcQWNrHuRDDW_1pZwqv4maCB87JCRjp4ySa17h2l22s9zNcaCMF8ON8m2mR4UjWqd93ZS75d2_Af5uTDWTx-IB_UEnzhdGVYqpKdilwlJvZV', link: '/products?category=Kanchipuram' },
        { name: 'Banarasi Silk', desc: 'Royal heritage weaves', img: 'https://www.taneira.com/dw/image/v2/BKMH_PRD/on/demandware.static/-/Sites-Taneira-product-catalog/default/dw916b56cc/images/Taneira/Catalog/SHG08A00476_2.jpg?sw=1000&sh=1500', link: '/products?category=Banarasi' },
        { name: 'Soft Silk', desc: 'Modern comfort', img: 'https://vannamayil.com/cdn/shop/files/softsilksaree_9_2f62c0ca-26b0-4112-b8ca-b9054be7061b.jpg?v=1753196093', link: '/products?category=Soft Silk' },
        { name: 'Silk Cotton', desc: 'Breathable elegance', img: 'https://madhurya.com/cdn/shop/files/DSC_6932.jpg?v=1702370132', link: '/products?category=Cotton Silk' },
        { name: 'Handloom Silk', desc: 'Crafted by master weavers', img: 'https://kosigam.com/cdn/shop/files/26EE5C1D-1402-47FA-A9FA-0FB5302C3B4D.jpg?v=1702612172', link: '/products?category=Handloom' },
        { name: 'Wedding Silk', desc: 'Bridal heritage collection', img: 'https://2.wlimg.com/product_images/bc-full/2021/2/1818401/golden-bridal-silk-sarees-1614519409-5737874.jpeg', link: '/products?category=Wedding' }
    ];


    const nextCat = () => {
        if (scrollRef.current) {
            const cardWidth = scrollRef.current.offsetWidth / 4;
            scrollRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
    };

    const prevCat = () => {
        if (scrollRef.current) {
            const cardWidth = scrollRef.current.offsetWidth / 4;
            scrollRef.current.scrollBy({ left: -cardWidth, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const catTimer = setInterval(() => {
            if (scrollRef.current) {
                const isAtEnd = scrollRef.current.scrollLeft + scrollRef.current.offsetWidth >= scrollRef.current.scrollWidth - 10;
                if (isAtEnd) {
                    scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    nextCat();
                }
            }
        }, 2000);
        return () => clearInterval(catTimer);
    }, []);

    const features = [
        { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹2,000' },
        { icon: Shield, title: 'Secure Payment', desc: '100% secure checkout' },
        { icon: Award, title: 'Authentic Silk', desc: 'Certified pure silk' },
        { icon: Sparkles, title: 'Handcrafted', desc: 'By master weavers' }
    ];

    const testimonials = [
        {
            name: 'Priya Sharma',
            location: 'Mumbai',
            text: 'The Kanchipuram saree I bought was absolutely stunning! The craftsmanship is impeccable. It felt so light yet looked extremely royal.',
            rating: 5
        },
        {
            name: 'Lakshmi Menon',
            location: 'Chennai',
            text: 'Kumaran Silks has the best collection of traditional sarees. My wedding saree was perfect! Everyone was asking where I got it from.',
            rating: 5
        },
        {
            name: 'Anita Reddy',
            location: 'Hyderabad',
            text: 'Exceptional quality and beautiful designs. The customer service was outstanding. They helped me pick the right color for my skin tone.',
            rating: 5
        },
        {
            name: 'Meera Kapur',
            location: 'Delhi',
            text: 'The Silk Cotton collection is a lifesaver for summer weddings. So breathable and elegant. I have already recommended it to my friends.',
            rating: 5
        },
        {
            name: 'Sonal Verma',
            location: 'Bangalore',
            text: 'Ordering online was so easy, and the delivery was incredibly fast. The packaging was beautiful too! A truly premium experience.',
            rating: 5
        }
    ];

    useEffect(() => {
        const testimonialTimer = setInterval(() => {
            setCurrentTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
        }, 2000);
        return () => clearInterval(testimonialTimer);
    }, [testimonials.length]);

    return (
        <div className="bg-amber-100 dark:bg-slate-950">
            {/* Hero Slider */}
            <section className="relative bg-gray-900 overflow-hidden group" style={{ height: '100vh', minHeight: '700px' }}>
                {banners.map((banner, index) => (
                    <div
                        key={banner.id}
                        className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
                            }`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent z-10"></div>
                        <img
                            src={banner.image}
                            alt={banner.title}
                            className="absolute inset-0 w-full h-full object-cover"
                        />

                        <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
                            <motion.div
                                key={currentSlide}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className="max-w-xl text-white"
                            >
                                <p className="text-amber-400 font-medium tracking-widest uppercase mb-4">
                                    {banner.subtitle}
                                </p>
                                <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight">
                                    {banner.title}
                                </h1>
                                <p className="text-lg text-gray-200 mb-8 font-light">
                                    {banner.description}
                                </p>
                                <Link
                                    to={banner.link}
                                    className="inline-flex items-center px-8 py-4 bg-amber-700 text-white font-semibold rounded hover:bg-amber-800 transition-all"
                                >
                                    Shop Collection <ArrowRight className="ml-2" size={18} />
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                ))}

                {/* Navigation */}
                <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/20 text-white hover:bg-amber-600 transition-all opacity-0 group-hover:opacity-100"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/20 text-white hover:bg-amber-600 transition-all opacity-0 group-hover:opacity-100"
                >
                    <ChevronRight size={24} />
                </button>

                {/* Dots */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex space-x-3">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`h-2 rounded-full transition-all ${index === currentSlide ? 'bg-amber-500 w-8' : 'bg-white/50 w-2'
                                }`}
                        />
                    ))}
                </div>
            </section>

            {/* Categories */}
            <section className="py-20 relative overflow-hidden group/cat">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="text-amber-600 dark:text-amber-400 font-medium tracking-widest uppercase text-sm">Our Collections</span>
                        <h2 className="text-4xl font-serif font-bold text-gray-900 dark:text-white mt-3 mb-4">Shop by Category</h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Discover the finest varieties of silk, each with its own unique heritage.</p>
                    </div>

                    <div className="relative">
                        {/* Navigation Arrows - Floating on sides */}
                        <button
                            onClick={prevCat}
                            className="absolute -left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg text-amber-900 dark:text-amber-400 hover:bg-amber-900 hover:text-white transition-all opacity-0 group-hover/cat:opacity-100 -translate-x-4 group-hover/cat:translate-x-0 hidden lg:flex"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={nextCat}
                            className="absolute -right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg text-amber-900 dark:text-amber-400 hover:bg-amber-900 hover:text-white transition-all opacity-0 group-hover/cat:opacity-100 translate-x-4 group-hover/cat:translate-x-0 hidden lg:flex"
                        >
                            <ChevronRight size={24} />
                        </button>
                        <div
                            ref={scrollRef}
                            className="flex overflow-x-auto gap-6 scroll-smooth snap-x snap-mandatory no-scrollbar pb-4"
                        >
                            {categories.map((cat, idx) => (
                                <div key={idx} className="min-w-[70%] sm:min-w-[45%] lg:min-w-[calc(25%-18px)] group snap-start">
                                    <Link to={cat.link}>
                                        <motion.div
                                            whileHover={{ y: -10 }}
                                            className="relative overflow-hidden rounded-xl shadow-lg"
                                            style={{ height: '400px' }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 opacity-60 group-hover:opacity-80 transition-opacity"></div>
                                            <img
                                                src={cat.img}
                                                alt={cat.name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute bottom-0 left-0 right-0 p-6 z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                                <p className="text-amber-400 text-[10px] md:text-xs font-medium mb-1 uppercase tracking-wider">{cat.desc}</p>
                                                <h3 className="text-xl md:text-2xl font-serif font-bold text-white">{cat.name}</h3>
                                                <div className="h-0.5 w-0 bg-amber-400 mt-2 group-hover:w-full transition-all duration-500"></div>
                                            </div>
                                        </motion.div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Promotional Banner Slider */}
            <section className="bg-[#9A3412] relative overflow-hidden flex items-center" style={{ height: '450px' }}>
                <div className="max-w-7xl mx-auto px-4 w-full text-center relative z-10">
                    <div className="relative h-80 flex items-center justify-center">
                        <AnimatePresence initial={false} mode="wait">
                            <motion.div
                                key={currentPromo}
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                            >
                                <div className="pointer-events-auto flex flex-col items-center">
                                    <span className="inline-block px-4 py-1.5 bg-white/10 text-white/90 rounded-full text-[10px] md:text-xs font-medium uppercase tracking-widest mb-6 border border-white/20 backdrop-blur-sm">
                                        {promoSlides[currentPromo].tag}
                                    </span>
                                    <h2 className="text-3xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight max-w-4xl mx-auto px-4">
                                        {promoSlides[currentPromo].title}
                                    </h2>
                                    <p className="text-base md:text-xl text-white/80 mb-10 flex flex-wrap items-center justify-center gap-2 md:gap-3 px-4">
                                        {promoSlides[currentPromo].subtitle}
                                        <span className="font-bold bg-[#C6941F] text-white px-3 py-1 md:px-4 md:py-1.5 rounded shadow-lg transform -rotate-1 whitespace-nowrap">
                                            {promoSlides[currentPromo].code}
                                        </span>
                                        {promoSlides[currentPromo].afterCode}
                                    </p>
                                    <Link to={promoSlides[currentPromo].link} className="inline-flex items-center px-8 py-3 md:px-10 md:py-4 bg-white text-[#9A3412] font-bold rounded shadow-xl hover:bg-amber-50 transition-all hover:scale-105 active:scale-95 group">
                                        {promoSlides[currentPromo].cta} <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" size={18} />
                                    </Link>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Promo Dots */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                        {promoSlides.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentPromo(idx)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentPromo ? 'bg-white w-6' : 'bg-white/30 w-1.5'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-black/10 rounded-full blur-3xl"></div>
            </section>

            {/* New Arrivals */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="text-amber-600 dark:text-amber-400 font-medium tracking-widest uppercase text-sm">Fresh Styles</span>
                        <h2 className="text-4xl font-serif font-bold text-gray-900 dark:text-white mt-3 mb-4">New Arrivals</h2>
                    </div>

                    {loading ? (
                        <Loader text="Loading new arrivals..." />
                    ) : products.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {products.map((product) => (
                                <div key={product._id} className="group">
                                    <Link to={`/product/${product._id}`}>
                                        <div className="relative overflow-hidden mb-4 bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-sm" style={{ paddingBottom: '133%' }}>
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                onError={(e) => { e.target.src = 'https://via.placeholder.com/400x500?text=No+Image'; }}
                                            />
                                            {product.originalPrice > product.price && (
                                                <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                                                    {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors truncate">{product.name}</h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{product.category}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-amber-900 dark:text-amber-400">₹{product.price?.toLocaleString()}</span>
                                            {product.originalPrice > product.price && (
                                                <span className="text-sm text-gray-400 line-through">₹{product.originalPrice?.toLocaleString()}</span>
                                            )}
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Coming Soon</h3>
                            <p className="text-gray-500 dark:text-gray-400">Our new collection is being curated for you!</p>
                        </div>
                    )}

                    <div className="text-center mt-12">
                        <Link to="/products" className="inline-flex items-center px-8 py-4 border-2 border-amber-600 dark:border-amber-500 text-amber-700 dark:text-amber-400 font-semibold rounded hover:bg-amber-600 hover:text-white transition-all">
                            View All Products <ArrowRight className="ml-2" size={18} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="text-amber-600 dark:text-amber-400 font-medium tracking-widest uppercase text-sm">Testimonials</span>
                        <h2 className="text-4xl font-serif font-bold text-gray-900 dark:text-white mt-3 mb-4">What Our Customers Say</h2>
                    </div>

                    <div className="relative max-w-4xl mx-auto h-[350px] md:h-64 flex items-center justify-center overflow-hidden">
                        <AnimatePresence initial={false} mode="wait">
                            <motion.div
                                key={currentTestimonial}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                className="absolute inset-0 flex items-center justify-center p-4"
                            >
                                <div className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-2xl shadow-xl border border-amber-100 dark:border-gray-700 max-w-3xl w-full text-center relative">
                                    <div className="flex justify-center gap-1 mb-6">
                                        {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                                            <Star key={i} size={20} className="text-amber-500 fill-amber-500" />
                                        ))}
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 text-lg md:text-xl mb-8 italic leading-relaxed">
                                        "{testimonials[currentTestimonial].text}"
                                    </p>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white text-lg">{testimonials[currentTestimonial].name}</h4>
                                        <p className="text-amber-600 dark:text-amber-400 font-medium text-sm">{testimonials[currentTestimonial].location}</p>
                                    </div>

                                    {/* Quote Icon */}
                                    <div className="absolute top-4 left-4 opacity-5">
                                        <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V15C14.017 15.5523 13.5693 16 13.017 16H11.017C10.4647 16 10.017 15.5523 10.017 15V9C10.017 7.89543 10.9124 7 12.017 7H19.017C20.1216 7 21.017 7.89543 21.017 9V15C21.017 18.3137 18.3307 21 15.017 21H14.017ZM5.017 21L5.017 18C5.017 16.8954 5.91243 16 7.017 16H10.017C10.5693 16 11.017 15.5523 11.017 15V9C11.017 8.44772 10.5693 8 10.017 8H6.017C5.46472 8 5.017 8.44772 5.017 9V15C5.017 15.5523 4.56929 16 4.017 16H2.017C1.46472 16 1.017 15.5523 1.017 15V9C1.017 7.89543 1.91243 7 3.017 7H10.017C11.1216 7 12.017 7.89543 12.017 9V15C12.017 18.3137 9.33071 21 6.017 21H5.017Z" />
                                        </svg>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Testimonial Nav */}
                    <div className="flex justify-center space-x-3 mt-8">
                        {testimonials.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentTestimonial(idx)}
                                className={`h-2 rounded-full transition-all duration-300 ${idx === currentTestimonial ? 'bg-[#9A3412] w-8' : 'bg-amber-200 w-2'
                                    }`}
                                aria-label={`Go to testimonial ${idx + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Newsletter */}
            <section className="py-16 bg-gradient-to-r from-amber-100 to-amber-50 dark:from-gray-900 dark:to-gray-950">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-4">Join Our Family</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">Subscribe to receive updates on new arrivals and exclusive discounts!</p>
                    <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 px-6 py-3 rounded border border-amber-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <button type="submit" className="px-8 py-3 bg-amber-900 text-white font-semibold rounded hover:bg-amber-800 transition-colors">
                            Subscribe
                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
};

export default Home;

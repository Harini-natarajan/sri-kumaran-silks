import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube, MapPin, Phone, Mail, Clock, CreditCard, Truck, Shield, Award } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-gradient-to-b from-gray-900 to-gray-950">
            {/* Trust Badges */}
            <div className="border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="flex items-center gap-4 justify-start sm:justify-center">
                            <div className="w-12 h-12 rounded-full bg-amber-900/30 flex items-center justify-center">
                                <Truck className="text-amber-500" size={24} />
                            </div>
                            <div>
                                <h4 className="text-white font-semibold text-sm">Free Shipping</h4>
                                <p className="text-gray-500 text-xs">On orders above ₹5,000</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 justify-start sm:justify-center">
                            <div className="w-12 h-12 rounded-full bg-amber-900/30 flex items-center justify-center">
                                <Shield className="text-amber-500" size={24} />
                            </div>
                            <div>
                                <h4 className="text-white font-semibold text-sm">Secure Payment</h4>
                                <p className="text-gray-500 text-xs">100% secure checkout</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 justify-start sm:justify-center">
                            <div className="w-12 h-12 rounded-full bg-amber-900/30 flex items-center justify-center">
                                <Award className="text-amber-500" size={24} />
                            </div>
                            <div>
                                <h4 className="text-white font-semibold text-sm">Pure Silk</h4>
                                <p className="text-gray-500 text-xs">Certified authentic</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 justify-start sm:justify-center">
                            <div className="w-12 h-12 rounded-full bg-amber-900/30 flex items-center justify-center">
                                <CreditCard className="text-amber-500" size={24} />
                            </div>
                            <div>
                                <h4 className="text-white font-semibold text-sm">Easy Returns</h4>
                                <p className="text-gray-500 text-xs">7 days return policy</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <h2 className="mb-2 font-serif text-2xl font-bold leading-tight tracking-[0.14em] sm:text-3xl sm:tracking-wider">
                            <span className="text-white">SRI </span>
                            <span className="text-amber-200">KUMARAN</span>
                            <span className="block text-amber-500 sm:inline sm:ml-1">SILKS</span>
                        </h2>
                        <p className="text-amber-600 text-sm tracking-widest mb-6">SINCE 1965</p>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm">
                            Celebrating the timeless elegance of Indian heritage through exquisite silk sarees. Each piece is a masterwork of tradition, handwoven with passion by skilled artisans.
                        </p>

                        {/* Social Links */}
                        <div className="flex gap-3">
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-amber-600 hover:text-white transition-all duration-300">
                                <Facebook size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500 hover:text-white transition-all duration-300">
                                <Instagram size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-sky-500 hover:text-white transition-all duration-300">
                                <Twitter size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition-all duration-300">
                                <Youtube size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-6 relative inline-block">
                            Quick Links
                            <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-amber-500"></span>
                        </h3>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/" className="text-gray-400 hover:text-amber-500 transition-colors text-sm flex items-center gap-2 group">
                                    <span className="w-1 h-1 bg-amber-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link to="/products" className="text-gray-400 hover:text-amber-500 transition-colors text-sm flex items-center gap-2 group">
                                    <span className="w-1 h-1 bg-amber-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                    Shop Collection
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="text-gray-400 hover:text-amber-500 transition-colors text-sm flex items-center gap-2 group">
                                    <span className="w-1 h-1 bg-amber-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                    Our Story
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="text-gray-400 hover:text-amber-500 transition-colors text-sm flex items-center gap-2 group">
                                    <span className="w-1 h-1 bg-amber-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                    Contact Us
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Customer Care */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-6 relative inline-block">
                            Customer Care
                            <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-amber-500"></span>
                        </h3>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/track-order" className="text-gray-400 hover:text-amber-500 transition-colors text-sm flex items-center gap-2 group">
                                    <span className="w-1 h-1 bg-amber-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                    Track Order
                                </Link>
                            </li>
                            <li>
                                <Link to="/shipping" className="text-gray-400 hover:text-amber-500 transition-colors text-sm flex items-center gap-2 group">
                                    <span className="w-1 h-1 bg-amber-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                    Shipping Policy
                                </Link>
                            </li>
                            <li>
                                <Link to="/returns" className="text-gray-400 hover:text-amber-500 transition-colors text-sm flex items-center gap-2 group">
                                    <span className="w-1 h-1 bg-amber-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                    Returns & Exchange
                                </Link>
                            </li>
                            <li>
                                <Link to="/faq" className="text-gray-400 hover:text-amber-500 transition-colors text-sm flex items-center gap-2 group">
                                    <span className="w-1 h-1 bg-amber-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                    FAQs
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy" className="text-gray-400 hover:text-amber-500 transition-colors text-sm flex items-center gap-2 group">
                                    <span className="w-1 h-1 bg-amber-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-6 relative inline-block">
                            Get in Touch
                            <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-amber-500"></span>
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <MapPin className="text-amber-500" size={16} />
                                </div>
                                <span className="text-gray-400 text-sm leading-relaxed">38 A, Perumal Chetty Street, Chamrajpet,<br />Mecheri - 636451, Salem (DT)</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                                    <Phone className="text-amber-500" size={16} />
                                </div>
                                <span className="text-gray-400 text-sm leading-relaxed">
                                    <a href="tel:9443517510" className="hover:text-amber-500 transition-colors block">9443517510</a>
                                    <a href="tel:9994510259" className="hover:text-amber-500 transition-colors block">9994510259</a>
                                    <a href="tel:994006744" className="hover:text-amber-500 transition-colors block">9994006744</a>
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                                    <Mail className="text-amber-500" size={16} />
                                </div>
                                <a href="mailto:srikumaransilks14@gmail.com" className="text-gray-400 text-sm hover:text-amber-500 transition-colors">srikumaransilks14@gmail.com</a>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                                    <Clock className="text-amber-500" size={16} />
                                </div>
                                <span className="text-gray-400 text-sm">Mon - Sat: 10AM - 8PM</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-gray-500 text-sm">
                            © {new Date().getFullYear()} SriKumaranSilks. All rights reserved. Crafted with ❤️ in India.
                        </p>
                        <div className="flex items-center gap-6">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png" alt="Visa" className="h-6 opacity-50 hover:opacity-100 transition-opacity" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png" alt="Mastercard" className="h-6 opacity-50 hover:opacity-100 transition-opacity" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/200px-UPI-Logo-vector.svg.png" alt="UPI" className="h-6 opacity-50 hover:opacity-100 transition-opacity" />
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

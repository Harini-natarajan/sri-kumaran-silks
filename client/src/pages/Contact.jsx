import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, MessageSquare, Building } from 'lucide-react';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission
        console.log('Form submitted:', formData);
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 5000);
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    };

    const contactInfo = [
        {
            icon: <MapPin size={24} />,
            title: 'Visit Our Store',
            details: ['123 Silk Street, T. Nagar', 'Chennai, Tamil Nadu 600017', 'India'],
        },
        {
            icon: <Phone size={24} />,
            title: 'Call Us',
            details: ['+91 44 2815 1965', '+91 98400 12345', 'Mon-Sat: 9AM - 8PM'],
        },
        {
            icon: <Mail size={24} />,
            title: 'Email Us',
            details: ['info@kumaransilks.com', 'orders@kumaransilks.com', 'support@kumaransilks.com'],
        },
        {
            icon: <Clock size={24} />,
            title: 'Store Hours',
            details: ['Monday - Saturday: 9AM - 8PM', 'Sunday: 10AM - 6PM', 'Holidays: 10AM - 4PM'],
        },
    ];

    return (
        <div className="bg-white pt-24 md:pt-32">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-amber-800 to-amber-900 text-white py-16 md:py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <span className="text-amber-300 text-sm font-medium tracking-[0.3em] uppercase mb-4 block">
                        Get In Touch
                    </span>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Contact Us</h1>
                    <p className="text-amber-100 text-lg max-w-2xl mx-auto">
                        We'd love to hear from you. Whether you have a question about our sarees, need styling advice,
                        or want to visit our store, we're here to help.
                    </p>
                </div>
            </section>

            {/* Contact Info Cards */}
            <section className="py-12 -mt-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {contactInfo.map((info, index) => (
                            <div key={index} className="bg-white rounded-xl shadow-lg border border-amber-100 p-6 hover:shadow-xl transition-shadow">
                                <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center text-amber-700 mb-4">
                                    {info.icon}
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-3">{info.title}</h3>
                                <div className="space-y-1">
                                    {info.details.map((detail, idx) => (
                                        <p key={idx} className="text-sm text-gray-600">{detail}</p>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Form & Map */}
            <section className="py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Contact Form */}
                        <div>
                            <div className="mb-8">
                                <span className="text-amber-600 font-semibold text-sm tracking-wider uppercase mb-4 block">Send a Message</span>
                                <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">We'd Love to Hear From You</h2>
                                <p className="text-gray-600">
                                    Fill out the form below and our team will get back to you within 24 hours.
                                </p>
                            </div>

                            {submitted && (
                                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">✓</div>
                                    <div>
                                        <p className="font-medium text-green-800">Message Sent Successfully!</p>
                                        <p className="text-sm text-green-600">We'll get back to you soon.</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Your Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                            placeholder="Enter your name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                            placeholder="Enter your email"
                                        />
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                            placeholder="Enter your phone"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                                        <select
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                        >
                                            <option value="">Select a subject</option>
                                            <option value="product">Product Inquiry</option>
                                            <option value="order">Order Status</option>
                                            <option value="custom">Custom Order</option>
                                            <option value="wholesale">Wholesale Inquiry</option>
                                            <option value="feedback">Feedback</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Message *</label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows={5}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
                                        placeholder="How can we help you?"
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white px-8 py-4 font-semibold rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg hover:shadow-xl"
                                >
                                    <Send size={18} />
                                    Send Message
                                </button>
                            </form>
                        </div>

                        {/* Map & Store Info */}
                        <div>
                            {/* Map Placeholder */}
                            <div className="aspect-[4/3] bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl overflow-hidden mb-8 flex items-center justify-center">
                                <div className="text-center p-8">
                                    <div className="text-6xl mb-4">📍</div>
                                    <h3 className="text-xl font-serif font-bold text-amber-800 mb-2">Our Store Location</h3>
                                    <p className="text-amber-700">123 Silk Street, T. Nagar, Chennai</p>
                                    <a
                                        href="https://maps.google.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block mt-4 text-amber-600 font-medium hover:text-amber-800 underline"
                                    >
                                        Open in Google Maps →
                                    </a>
                                </div>
                            </div>

                            {/* Quick Contact Options */}
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <MessageSquare size={20} className="text-amber-600" />
                                    Quick Connect
                                </h3>
                                <div className="space-y-4">
                                    <a
                                        href="https://wa.me/919840012345"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-4 bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl">
                                            💬
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">WhatsApp</div>
                                            <div className="text-sm text-gray-500">Chat with us instantly</div>
                                        </div>
                                    </a>
                                    <a
                                        href="tel:+914428151965"
                                        className="flex items-center gap-4 bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white text-2xl">
                                            📞
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">Call Us</div>
                                            <div className="text-sm text-gray-500">+91 44 2815 1965</div>
                                        </div>
                                    </a>
                                    <a
                                        href="mailto:info@kumaransilks.com"
                                        className="flex items-center gap-4 bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl">
                                            ✉️
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">Email Us</div>
                                            <div className="text-sm text-gray-500">info@kumaransilks.com</div>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <span className="text-amber-600 font-semibold text-sm tracking-wider uppercase mb-4 block">FAQ</span>
                        <h2 className="text-3xl font-serif font-bold text-gray-900">Frequently Asked Questions</h2>
                    </div>

                    <div className="space-y-4">
                        {[
                            { q: 'Do you ship internationally?', a: 'Yes! We ship worldwide. International orders typically arrive within 7-14 business days.' },
                            { q: 'Can I return or exchange a saree?', a: 'We accept returns within 7 days of delivery for unused items in original packaging. Custom orders are non-returnable.' },
                            { q: 'Do you offer custom orders?', a: 'Absolutely! We can customize colors, borders, and motifs. Custom orders take 4-8 weeks depending on complexity.' },
                            { q: 'Are your sarees authentic?', a: 'Yes, all our sarees are Silk Mark certified and handwoven by skilled artisans using traditional techniques.' },
                        ].map((faq, index) => (
                            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                                <p className="text-gray-600 text-sm">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Store Visit CTA */}
            <section className="py-16 bg-gradient-to-r from-amber-800 to-amber-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-amber-700 rounded-full flex items-center justify-center text-3xl">
                                <Building size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-serif font-bold mb-1">Visit Our Flagship Store</h3>
                                <p className="text-amber-200">Experience the magic of silk in person at our Chennai showroom</p>
                            </div>
                        </div>
                        <a
                            href="https://maps.google.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-white text-amber-800 px-8 py-3 font-semibold rounded-full hover:bg-amber-50 transition-colors"
                        >
                            Get Directions
                            <MapPin size={18} />
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Contact;

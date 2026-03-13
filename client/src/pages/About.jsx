import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Award, Users, Sparkles, ArrowRight, Shield, CheckCircle, Truck, Star } from 'lucide-react';

const About = () => {
    const stats = [
        { value: '1965', label: 'Established', icon: '🏛️' },
        { value: '50K+', label: 'Happy Customers', icon: '💝' },
        { value: '500+', label: 'Artisans', icon: '🧵' },
        { value: '10K+', label: 'Sarees Crafted', icon: '✨' },
    ];

    const values = [
        {
            icon: <Heart className="w-8 h-8" />,
            title: 'Heritage',
            description: 'Preserving centuries-old weaving techniques passed down through generations.',
        },
        {
            icon: <Award className="w-8 h-8" />,
            title: 'Quality',
            description: 'Every saree undergoes rigorous quality checks to ensure perfection in every thread.',
        },
        {
            icon: <Users className="w-8 h-8" />,
            title: 'Artisans',
            description: 'Empowering over 500 weaver families with fair wages and sustainable livelihoods.',
        },
        {
            icon: <Sparkles className="w-8 h-8" />,
            title: 'Authenticity',
            description: 'Handcrafted using traditional looms and authentic materials like real gold zari.',
        },
    ];

    return (
        <div className="bg-amber-100 dark:bg-slate-950 pt-24 md:pt-32">
            {/* Simple Hero Section */}
            <section className="relative bg-[#9A3412] text-white py-20 overflow-hidden">
                <div className="relative max-w-7xl mx-auto px-4 text-center">
                    <span className="text-amber-300 text-xs font-medium tracking-[0.3em] uppercase mb-4 block">
                        Our Legacy Since 1965
                    </span>
                    <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
                        Weaving Tradition <br />
                        <span className="text-amber-300">With Love</span>
                    </h1>
                    <p className="text-lg text-amber-100 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                        For over 50 years, SriKumaranSilks has been the trusted destination for authentic Kanchipuram and Banarasi silk sarees,
                        preserving the rich artistry of Indian weaving for generations to come.
                    </p>
                    <Link to="/products" className="inline-flex items-center gap-2 bg-white text-[#9A3412] px-8 py-3.5 font-bold rounded-full hover:bg-amber-50 transition-all shadow-lg transform hover:-translate-y-1">
                        Explore Collection <ArrowRight size={18} />
                    </Link>
                </div>
            </section>

            {/* Quick Stats */}
            <section className="py-12 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, index) => (
                        <div key={index} className="text-center group">
                            <div className="text-3xl mb-2 transition-transform group-hover:scale-110 duration-300">{stat.icon}</div>
                            <div className="text-2xl font-bold text-[#800000]">{stat.value}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-medium mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Our Story & Values */}
            <section className="py-20 bg-amber-50/30 dark:bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
                        <div>
                            <span className="text-amber-600 dark:text-amber-400 font-bold text-xs tracking-widest uppercase mb-4 block">The Beginning</span>
                            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                                A Legacy Woven in <br /> Gold & Silk
                            </h2>
                            <div className="space-y-6 text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base">
                                <p>
                                    In 1965, SriKumaranSilks started with just three looms in the heart of Kanchipuram.
                                    Our founder's vision was simple yet profound: to make the majestic beauty of pure
                                    handcrafted silk accessible to women who celebrate traditional artistry.
                                </p>
                                <p>
                                    Today, we stand as a heritage brand, working directly with master weavers across
                                    South India and Varanasi. Each saree is a labor of love, taking weeks of intricate
                                    work to reach perfection.
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {values.map((value, index) => (
                                <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-amber-100/50 dark:border-gray-700 hover:shadow-md transition-all group">
                                    <div className="w-12 h-12 mb-4 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-700 dark:text-amber-400 group-hover:bg-[#9A3412] group-hover:text-white transition-colors duration-300">
                                        {React.cloneElement(value.icon, { size: 24 })}
                                    </div>
                                    <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-white mb-2">{value.title}</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">{value.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Final Promise */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12 shadow-xl border border-amber-100 dark:border-gray-700 relative overflow-hidden text-center max-w-4xl mx-auto">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-4 text-center">Our Commitment</h3>
                            <div className="flex flex-wrap justify-center gap-6 md:gap-12">
                                <div className="flex items-center gap-2">
                                    <Shield className="text-amber-600" size={20} />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Silk Mark Certified</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="text-amber-600" size={20} />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">100% Authentic Zari</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Truck className="text-amber-600" size={20} />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Global Delivery</span>
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-amber-50 rounded-full opacity-50 blur-3xl"></div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;

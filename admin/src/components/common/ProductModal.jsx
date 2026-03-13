import React, { useState, useEffect } from 'react';
import { X, Info, Package, Image as ImageIcon, Check, ChevronRight, ChevronLeft, Upload, Trash2, IndianRupee } from 'lucide-react';

const ProductModal = ({ isOpen, onClose, product, onSubmit, categories, saving, processingImage, onImageUpload, onRemoveImage, onSetPrimaryImage, errorText }) => {
    const [activeTab, setActiveTab] = useState('basic');
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        price: '',
        originalPrice: '',
        description: '',
        stock: '',
        image: '',
        images: [],
        material: '',
        color: '',
        careInstructions: '',
        brand: '',
        isFeatured: false
    });

    useEffect(() => {
        if (!isOpen) return;

        if (product) {
            setFormData(prev => ({
                ...product,
                // Keep local changes if we are already editing, but sync images
                ...(prev.id === product.id ? prev : {}),
                price: String(product.price || ''),
                stock: String(product.stock || ''),
                originalPrice: String(product.originalPrice || ''),
                material: product.material || '',
                color: product.color || '',
                careInstructions: product.careInstructions || '',
                brand: product.brand || '',
                isFeatured: !!product.isFeatured,
                images: product.images || [],
                image: product.image || ''
            }));
        } else {
            setFormData({
                name: '',
                category: '',
                price: '',
                originalPrice: '',
                description: '',
                stock: '',
                image: '',
                images: [],
                material: '',
                color: '',
                careInstructions: '',
                brand: '',
                isFeatured: false
            });
        }
    }, [product, isOpen]);

    // Only reset tab when modal is actually opened (not when product updates while open)
    useEffect(() => {
        if (isOpen) {
            setActiveTab('basic');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const tabs = [
        { id: 'basic', label: 'Identity', icon: Info },
        { id: 'details', label: 'Inventory', icon: Package },
        { id: 'media', label: 'Colleagues', icon: ImageIcon },
    ];

    const currentIdx = tabs.findIndex(t => t.id === activeTab);

    const handleNext = () => {
        if (currentIdx < tabs.length - 1) setActiveTab(tabs[currentIdx + 1].id);
    };

    const handleBack = () => {
        if (currentIdx > 0) setActiveTab(tabs[currentIdx - 1].id);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (activeTab !== 'media') {
                handleNext();
            }
        }
    };

    const handleFinalSubmit = () => {
        // Double check we are on the media tab (though UI prevents this anyway)
        if (activeTab === 'media' && !saving) {
            onSubmit(formData);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-10 bg-black/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
            <div className="bg-[#12111a] w-full max-w-2xl rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden flex flex-col my-8">

                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-lg">
                            <Package size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">
                                {product?.id ? 'Edit Masterpiece' : 'Curate New Design'}
                            </h2>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">
                                {product?.id ? `Product ID: ${product.id.slice(-8).toUpperCase()}` : 'Define product specifications'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all transform hover:rotate-90"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Stepper Navigation */}
                <div className="grid grid-cols-3 bg-[#0c0b14]/50 border-b border-white/5">
                    {tabs.map((tab, idx) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-4 transition-all relative flex flex-col items-center gap-1.5 ${activeTab === tab.id ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <tab.icon size={16} />
                            <span className="font-bold text-[10px] uppercase tracking-widest">{tab.label}</span>
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {errorText && (
                        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold uppercase tracking-widest animate-in zoom-in-95 duration-300">
                            Error: {errorText}
                        </div>
                    )}

                    <form id="product-form" onSubmit={(e) => e.preventDefault()} onKeyDown={handleKeyDown} className="space-y-8">

                        {activeTab === 'basic' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Product Designation</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="Ex: Pure Kanchipuram Gold Brocade"
                                            className="w-full bg-[#0c0b14] border border-white/5 rounded-2xl py-4 px-5 text-white focus:border-indigo-500/50 outline-none transition-all shadow-inner placeholder:text-gray-700"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Category Classification</label>
                                            <div className="relative">
                                                <select
                                                    name="category"
                                                    value={formData.category}
                                                    onChange={handleInputChange}
                                                    className="w-full bg-[#0c0b14] border border-white/5 rounded-2xl py-4 px-5 text-white focus:border-indigo-500/50 outline-none transition-all appearance-none cursor-pointer placeholder:text-gray-700"
                                                    required
                                                >
                                                    <option value="" className="bg-[#0c0b14]">Select Category</option>
                                                    {categories.map(cat => (
                                                        <option key={cat} value={cat} className="bg-[#0c0b14]">{cat}</option>
                                                    ))}
                                                </select>
                                                <ChevronRight size={16} className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-gray-600 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Brand / Collections</label>
                                            <input
                                                type="text"
                                                name="brand"
                                                value={formData.brand}
                                                onChange={handleInputChange}
                                                placeholder="Ex: Signature Wedding"
                                                className="w-full bg-[#0c0b14] border border-white/5 rounded-2xl py-4 px-5 text-white focus:border-indigo-500/50 outline-none transition-all placeholder:text-gray-700"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Product Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Describe the weave, material, and specialty..."
                                            rows={4}
                                            className="w-full bg-[#0c0b14] border border-white/5 rounded-2xl py-4 px-5 text-white focus:border-indigo-500/50 outline-none transition-all resize-none shadow-inner placeholder:text-gray-700"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                        <input
                                            type="checkbox"
                                            name="isFeatured"
                                            id="isFeatured"
                                            checked={formData.isFeatured}
                                            onChange={handleInputChange}
                                            className="w-5 h-5 rounded-lg border-white/10 bg-black text-indigo-500 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="isFeatured" className="text-sm font-bold text-gray-300 cursor-pointer">Mark as Featured Product</label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'details' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 font-semibold">Listing Price</label>
                                        <div className="relative">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600">₹</div>
                                            <input
                                                type="number"
                                                name="price"
                                                value={formData.price}
                                                onChange={handleInputChange}
                                                placeholder="0"
                                                className="w-full bg-[#0c0b14] border border-white/5 rounded-2xl py-4 pl-10 pr-5 text-white focus:border-indigo-500/50 outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Market Price (MRP)</label>
                                        <div className="relative">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600">₹</div>
                                            <input
                                                type="number"
                                                name="originalPrice"
                                                value={formData.originalPrice}
                                                onChange={handleInputChange}
                                                placeholder="0"
                                                className="w-full bg-[#0c0b14] border border-white/5 rounded-2xl py-4 pl-10 pr-5 text-white focus:border-indigo-500/50 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Material Composition</label>
                                        <input
                                            type="text"
                                            name="material"
                                            value={formData.material}
                                            onChange={handleInputChange}
                                            placeholder="Ex: Pure Silk / Zari"
                                            className="w-full bg-[#0c0b14] border border-white/5 rounded-2xl py-4 px-5 text-white focus:border-indigo-500/50 outline-none transition-all placeholder:text-gray-700"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Color Palette</label>
                                        <input
                                            type="text"
                                            name="color"
                                            value={formData.color}
                                            onChange={handleInputChange}
                                            placeholder="Ex: Royal Blue"
                                            className="w-full bg-[#0c0b14] border border-white/5 rounded-2xl py-4 px-5 text-white focus:border-indigo-500/50 outline-none transition-all placeholder:text-gray-700"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Care & Maintenance</label>
                                    <input
                                        type="text"
                                        name="careInstructions"
                                        value={formData.careInstructions}
                                        onChange={handleInputChange}
                                        placeholder="Ex: Dry Clean Only"
                                        className="w-full bg-[#0c0b14] border border-white/5 rounded-2xl py-4 px-5 text-white focus:border-indigo-500/50 outline-none transition-all placeholder:text-gray-700"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Inventory Count</label>
                                    <input
                                        type="number"
                                        name="stock"
                                        value={formData.stock}
                                        onChange={handleInputChange}
                                        placeholder="Available units"
                                        className="w-full bg-[#0c0b14] border border-white/5 rounded-2xl py-4 px-5 text-white focus:border-indigo-500/50 outline-none transition-all shadow-inner"
                                        required
                                    />
                                    <p className="text-[10px] text-gray-600 italic mt-2 ml-1">Live updates are synchronized across all platforms.</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'media' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                                <div className="grid grid-cols-3 gap-4">
                                    <label className={`aspect-square rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${processingImage ? 'border-white/5 opacity-50 cursor-wait' : 'border-white/10 hover:border-indigo-500/40 hover:bg-indigo-500/[0.02]'
                                        }`}>
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-indigo-400">
                                            <Upload size={20} />
                                        </div>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">
                                            {processingImage ? 'Syncing...' : 'Add Frame'}
                                        </span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            multiple
                                            accept="image/*"
                                            onChange={onImageUpload}
                                        />
                                    </label>

                                    {formData.images?.map((img, idx) => (
                                        <div key={idx} className="aspect-square rounded-[2rem] overflow-hidden bg-[#0c0b14] border border-white/5 relative group shadow-2xl">
                                            <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                {idx === 0 ? (
                                                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-indigo-500 text-[8px] font-black rounded-full text-white tracking-widest shadow-lg">HERO</span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => onSetPrimaryImage(idx)}
                                                        className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all transform translate-y-2 group-hover:translate-y-0"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => onRemoveImage(idx)}
                                                    className="p-2.5 bg-white/10 hover:bg-rose-500/80 rounded-full text-white transition-all transform translate-y-2 group-hover:translate-y-0"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-gray-700 text-center font-medium">Supported formats: JPG, PNG, WEBP. Max 6 frames.</p>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-8 py-3.5 rounded-2xl text-gray-500 font-bold text-sm hover:text-white transition-colors"
                    >
                        Discard
                    </button>

                    <div className="flex gap-4">
                        {currentIdx > 0 && (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="px-6 py-3.5 rounded-2xl bg-white/5 text-gray-300 font-bold text-sm hover:bg-white/10 transition-all flex items-center gap-2"
                            >
                                <ChevronLeft size={16} />
                                Prev
                            </button>
                        )}

                        {currentIdx < tabs.length - 1 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/20 transition-all flex items-center gap-2 active:scale-95"
                            >
                                Continue
                                <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleFinalSubmit}
                                disabled={saving}
                                className="px-10 py-3.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/20 transition-all flex items-center gap-3 disabled:opacity-50 active:scale-95"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Commiting...
                                    </>
                                ) : (
                                    <>
                                        <Check size={18} strokeWidth={3} />
                                        {product?.id ? 'Publish Changes' : 'Initialize Product'}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductModal;

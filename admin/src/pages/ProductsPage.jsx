import React, { useCallback, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Search, Filter, MoreVertical, LayoutGrid, List as ListIcon, Loader2 } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import useAdminData from '../hooks/useAdminData';
import { fetchCategories, fetchProducts, removeProductById, saveProduct } from '../services/adminApi';
import { useSocket } from '../context/SocketContext';
import ProductModal from '../components/common/ProductModal';

const money = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

export default function ProductsPage() {
  const loadProducts = useCallback(() => fetchProducts(), []);
  const loadCategories = useCallback(() => fetchCategories(), []);

  const { data: products, setData: setProducts, loading } = useAdminData(loadProducts, []);
  const { data: categories } = useAdminData(loadCategories, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured'); // 'featured', 'price-low', 'price-high', 'stock-low'
  
  const socket = useSocket();

  React.useEffect(() => {
    if (socket) {
      const stockHandler = ({ productId, countInStock }) => {
        setProducts(prevProducts => 
          prevProducts.map(p => 
            p.id === productId ? { ...p, stock: countInStock } : p
          )
        );
      };

      const creationHandler = (newProduct) => {
        setProducts(prev => {
          if (prev.find(p => p.id === newProduct.id)) return prev;
          return [newProduct, ...prev];
        });
      };

      const deletionHandler = ({ productId }) => {
        setProducts(prev => prev.filter(p => p.id !== productId));
      };

      socket.on('stockUpdate', stockHandler);
      socket.on('productCreated', creationHandler);
      socket.on('productDeleted', deletionHandler);

      return () => {
        socket.off('stockUpdate', stockHandler);
        socket.off('productCreated', creationHandler);
        socket.off('productDeleted', deletionHandler);
      };
    }
  }, [socket, setProducts]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by search
    if (searchQuery) {
        const lower = searchQuery.toLowerCase();
        result = result.filter(p => 
            p.name.toLowerCase().includes(lower) || 
            p.category.toLowerCase().includes(lower)
        );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
        result = result.filter(p => p.category === selectedCategory);
    }

    // Sort
    if (sortBy === 'price-low') {
        result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
        result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'stock-low') {
        result.sort((a, b) => a.stock - b.stock);
    }

    return result;
  }, [products, searchQuery, selectedCategory, sortBy]);

  const openAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingProduct(item);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (formData) => {
    setSaving(true);
    setErrorText('');
    try {
      await saveProduct(formData);
      const refreshed = await fetchProducts();
      setProducts(refreshed);
      setIsModalOpen(false);
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await removeProductById(id);
      const refreshed = await fetchProducts();
      setProducts(refreshed);
    } catch (error) {
      alert('Failed to delete product');
    }
  };

  const onImageUpload = async (event) => {
      const files = Array.from(event.target.files || []);
      if (!files.length) return;
      
      setProcessingImage(true);
      try {
          const readers = files.map(file => {
              return new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result);
                  reader.readAsDataURL(file);
              });
          });
          const results = await Promise.all(readers);
          
          setEditingProduct(prev => ({
              ...(prev || { images: [] }),
              images: [...((prev || {}).images || []), ...results].slice(0, 6),
              image: ((prev || {}).images?.[0] || results[0])
          }));
      } catch (err) {
          console.error(err);
      } finally {
          setProcessingImage(false);
      }
  };

  const onRemoveImage = (index) => {
      setEditingProduct(prev => {
          const nextImages = prev.images.filter((_, i) => i !== index);
          return { ...prev, images: nextImages, image: nextImages[0] || '' };
      });
  };

  const onSetPrimaryImage = (index) => {
      setEditingProduct(prev => {
          const next = [...prev.images];
          const [selected] = next.splice(index, 1);
          next.unshift(selected);
          return { ...prev, image: next[0], images: next };
      });
  };

  if (loading && !products.length) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <Loader2 size={40} className="text-indigo-500 animate-spin" />
            <p className="text-gray-400 font-medium animate-pulse">Synchronizing inventory...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <PageHeader
          title="Inventory"
          subtitle={`${products.length} elegant silk sarees in catalogue`}
        />
        <button 
            onClick={openAddModal}
            className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 group active:scale-95"
        >
          <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform">
            <Plus size={16} />
          </div>
          Add New Product
        </button>
      </div>

      <div className="silk-card overflow-hidden">
        {/* Table Controls */}
        <div className="p-6 border-b border-white/5 flex flex-col xl:flex-row gap-4 justify-between bg-white/[0.02]">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative group max-w-md w-full">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                        <Search size={18} />
                    </div>
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search products..."
                        className="w-full bg-[#0c0b14] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white focus:border-indigo-500/50 outline-none transition-all shadow-inner"
                    />
                </div>

                <div className="flex gap-4">
                    <select 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="bg-[#0c0b14] border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-gray-400 focus:border-indigo-500/50 outline-none appearance-none cursor-pointer hover:bg-white/5"
                    >
                        <option value="All">All Categories</option>
                        {categories?.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>

                    <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-[#0c0b14] border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-gray-400 focus:border-indigo-500/50 outline-none appearance-none cursor-pointer hover:bg-white/5"
                    >
                        <option value="featured">Sort by: Featured</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="stock-low">Stock: Low First</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center gap-3 self-end xl:self-center">
                <div className="flex bg-[#0c0b14] p-1 rounded-xl border border-white/5">
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <ListIcon size={16} />
                    </button>
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <LayoutGrid size={16} />
                    </button>
                </div>
            </div>
        </div>

        {/* Product Display */}
        {viewMode === 'list' ? (
            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left">
                    <thead>
                    <tr className="bg-white/[0.01] text-gray-500 uppercase text-[10px] font-bold tracking-widest border-b border-white/5">
                        <th className="px-8 py-5">Product Details</th>
                        <th className="px-6 py-5">Category</th>
                        <th className="px-6 py-5">Value</th>
                        <th className="px-6 py-5">Status</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                    {filteredProducts.map((item) => (
                        <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#1e1d2b] border border-white/5 group-hover:border-indigo-500/30 transition-all duration-300 relative shadow-2xl">
                                <img src={item.image} alt={item.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                {item.stock <= 5 && (
                                    <div className="absolute top-1 right-1">
                                        <span className="flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-white group-hover:text-indigo-300 transition-colors truncate max-w-[200px]">{item.name}</p>
                                    {item.isFeatured && <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />}
                                </div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">ID: {item.id.slice(-8).toUpperCase()}</p>
                            </div>
                            </div>
                        </td>
                        <td className="px-6 py-5">
                            <span className="silk-badge bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
                            {item.category}
                            </span>
                        </td>
                        <td className="px-6 py-5 font-bold text-white">
                            {money(item.price)}
                        </td>
                        <td className="px-6 py-5">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                    <span className={item.stock > 10 ? 'text-emerald-500' : 'text-rose-400'}>
                                        {item.stock > 10 ? 'IN STOCK' : item.stock > 0 ? 'LOW STOCK' : 'OUT'}
                                    </span>
                                    <span className="text-gray-500">{item.stock} units</span>
                                </div>
                                <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${
                                            item.stock > 10 ? 'bg-emerald-500' : item.stock > 5 ? 'bg-amber-500' : 'bg-rose-500'
                                        }`} 
                                        style={{ width: `${Math.min(100, (item.stock / 50) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                            <button 
                                onClick={() => openEditModal(item)}
                                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-transparent hover:border-white/10 transition-all active:scale-95"
                            >
                                <Pencil size={18} />
                            </button>
                            <button 
                                onClick={() => handleRemoveProduct(item.id)}
                                className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 border border-transparent hover:border-rose-500/10 transition-all active:scale-95"
                            >
                                <Trash2 size={18} />
                            </button>
                            </div>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                {filteredProducts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                        <Search size={48} className="mb-4" />
                        <p className="font-bold uppercase tracking-widest text-xs">No matching designs found</p>
                    </div>
                )}
            </div>
        ) : (
            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[400px]">
                {filteredProducts.map((item) => (
                    <div key={item.id} className="group silk-card p-4 hover:border-indigo-500/30 transition-all duration-500">
                        <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-[#0c0b14] mb-4 relative shadow-2xl">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            {item.isFeatured && (
                                <div className="absolute top-4 left-4">
                                    <div className="bg-amber-500/10 backdrop-blur-md border border-amber-500/20 px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-lg">
                                        <Star size={10} className="fill-amber-400 text-amber-400" />
                                        <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Featured</span>
                                    </div>
                                </div>
                            )}
                            <div className="absolute top-4 right-4 flex flex-col gap-2">
                                <button 
                                    onClick={() => openEditModal(item)}
                                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-indigo-500 transition-colors shadow-lg"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button 
                                    onClick={() => handleRemoveProduct(item.id)}
                                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-rose-500 transition-colors shadow-lg"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <div className="absolute bottom-4 left-4 right-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                                <div className="silk-badge bg-black/60 backdrop-blur-md text-white w-full border-none justify-center">
                                    Quick View
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="font-black text-white truncate group-hover:text-indigo-300 transition-colors">{item.name}</p>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-indigo-400">{money(item.price)}</span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase">{item.stock} Units</span>
                            </div>
                            <div className="pt-2">
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full ${item.stock > 10 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                        style={{ width: `${Math.min(100, (item.stock / 50) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredProducts.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-30">
                        <Search size={48} className="mb-4" />
                        <p className="font-bold uppercase tracking-widest text-xs">No matching designs found</p>
                    </div>
                )}
            </div>
        )}
      </div>

      <ProductModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={editingProduct}
          onSubmit={handleModalSubmit}
          categories={categories}
          saving={saving}
          processingImage={processingImage}
          onImageUpload={onImageUpload}
          onRemoveImage={onRemoveImage}
          onSetPrimaryImage={onSetPrimaryImage}
          errorText={errorText}
      />
    </div>
  );
}

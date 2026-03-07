import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { getAdminProducts, createProduct, updateProduct, deleteProduct } from '../services/api';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [keyword, setKeyword] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        originalPrice: '',
        images: [''],
        category: '',
        countInStock: '',
        material: '',
        color: '',
        careInstructions: '',
        isFeatured: false
    });
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [activeTab, setActiveTab] = useState('basic');

    useEffect(() => {
        fetchProducts();
    }, [page, keyword]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const { data } = await getAdminProducts(page, 10, keyword);
            setProducts(data.products);
            setPages(data.pages);
            setTotal(data.total);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        setKeyword(searchInput);
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const openCreateModal = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            price: '',
            originalPrice: '',
            images: [''],
            category: '',
            countInStock: '',
            material: '',
            color: '',
            careInstructions: '',
            isFeatured: false
        });
        setActiveTab('basic');
        setShowModal(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice || '',
            images: product.images?.length ? product.images : [product.image || ''],
            category: product.category,
            countInStock: product.countInStock,
            material: product.material || '',
            color: product.color || '',
            careInstructions: product.careInstructions || '',
            isFeatured: product.isFeatured || false
        });
        setActiveTab('basic');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const validImages = formData.images.filter(img => img.trim() !== '');
            const productData = {
                ...formData,
                price: Number(formData.price),
                originalPrice: formData.originalPrice ? Number(formData.originalPrice) : 0,
                countInStock: Number(formData.countInStock),
                image: validImages[0] || '',
                images: validImages
            };

            if (editingProduct) {
                await updateProduct(editingProduct._id, productData);
                showToast('Product updated successfully');
            } else {
                await createProduct(productData);
                showToast('Product created successfully');
            }

            setShowModal(false);
            fetchProducts();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to save product', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            await deleteProduct(id);
            showToast('Product deleted successfully');
            fetchProducts();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete product', 'error');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getStockStatus = (count) => {
        if (count === 0) return { class: 'admin-badge-danger', text: 'Out of Stock' };
        if (count < 10) return { class: 'admin-badge-warning', text: 'Low Stock' };
        return { class: 'admin-badge-success', text: 'In Stock' };
    };

    const categories = ['Kanchipuram', 'Banarasi', 'Soft Silk', 'Cotton Silk', 'Designer', 'Wedding', 'Casual'];

    const colors = ['Red', 'Gold', 'Blue', 'Green', 'Pink', 'Purple', 'Black', 'White', 'Maroon', 'Orange'];
    const materials = ['Pure Silk', 'Art Silk', 'Cotton Silk', 'Zari', 'Pattu', 'Organza'];

    return (
        <AdminLayout>
            {/* Page Header */}
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Products</h1>
                    <p className="admin-page-subtitle">Manage your product catalog ({total} total products)</p>
                </div>
                <button className="admin-btn admin-btn-primary" onClick={openCreateModal}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Product
                </button>
            </div>

            {/* Search Bar */}
            <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
                <div className="admin-card-body" style={{ padding: '1rem' }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div className="admin-search" style={{ flex: 1 }}>
                            <svg className="admin-search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                className="admin-search-input"
                                placeholder="Search products by name..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="admin-btn admin-btn-secondary">Search</button>
                        {keyword && (
                            <button
                                type="button"
                                className="admin-btn admin-btn-secondary"
                                onClick={() => { setSearchInput(''); setKeyword(''); setPage(1); }}
                            >
                                Clear
                            </button>
                        )}
                    </form>
                </div>
            </div>

            {/* Products Table */}
            <div className="admin-card">
                <div className="admin-table-wrapper">
                    {loading ? (
                        <div className="admin-loading">
                            <div className="admin-spinner"></div>
                            <p>Loading products...</p>
                        </div>
                    ) : error ? (
                        <div className="admin-empty">
                            <div className="admin-empty-icon">⚠️</div>
                            <div className="admin-empty-title">Error</div>
                            <div className="admin-empty-text">{error}</div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="admin-empty">
                            <div className="admin-empty-icon">📦</div>
                            <div className="admin-empty-title">No Products Found</div>
                            <div className="admin-empty-text">
                                {keyword ? `No products match "${keyword}"` : 'Start by adding your first product'}
                            </div>
                            <button className="admin-btn admin-btn-primary" style={{ marginTop: '1rem' }} onClick={openCreateModal}>
                                Add Your First Product
                            </button>
                        </div>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => {
                                    const stockStatus = getStockStatus(product.countInStock);
                                    return (
                                        <tr key={product._id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="admin-image-preview"
                                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/50?text=No+Image'; }}
                                                    />
                                                    <div>
                                                        <div style={{ fontWeight: 500, color: 'var(--admin-text-primary)' }}>
                                                            {product.name}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                                                            {product.brand}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{product.category}</td>
                                            <td style={{ fontWeight: 500 }}>{formatCurrency(product.price)}</td>
                                            <td>
                                                <div className="stock-indicator">
                                                    <span>{product.countInStock}</span>
                                                    <div className="stock-bar">
                                                        <div
                                                            className={`stock-fill ${product.countInStock === 0 ? 'low' : product.countInStock < 10 ? 'medium' : 'high'}`}
                                                            style={{ width: `${Math.min(product.countInStock, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`admin-badge ${stockStatus.class}`}>
                                                    {stockStatus.text}
                                                </span>
                                                {product.isFeatured && (
                                                    <span className="admin-badge admin-badge-purple" style={{ marginLeft: '0.5rem' }}>
                                                        Featured
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        className="admin-btn admin-btn-secondary admin-btn-sm"
                                                        onClick={() => openEditModal(product)}
                                                        title="Edit"
                                                    >
                                                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        className="admin-btn admin-btn-danger admin-btn-sm"
                                                        onClick={() => handleDelete(product._id, product.name)}
                                                        title="Delete"
                                                    >
                                                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Pagination */}
            {pages > 1 && (
                <div className="admin-pagination">
                    <button
                        className="admin-pagination-btn"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    {[...Array(pages)].map((_, i) => (
                        <button
                            key={i + 1}
                            className={`admin-pagination-btn ${page === i + 1 ? 'active' : ''}`}
                            onClick={() => setPage(i + 1)}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button
                        className="admin-pagination-btn"
                        disabled={page === pages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Enhanced Create/Edit Modal */}
            {showModal && (
                <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
                    <div
                        className="admin-modal"
                        onClick={e => e.stopPropagation()}
                        style={{
                            maxWidth: '900px',
                            maxHeight: '90vh',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {/* Modal Header */}
                        <div className="admin-modal-header" style={{
                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
                            borderBottom: '1px solid var(--admin-border)',
                            padding: '1.5rem 2rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="admin-modal-title" style={{ margin: 0, fontSize: '1.25rem' }}>
                                        {editingProduct ? 'Edit Product' : 'Create New Product'}
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--admin-text-muted)' }}>
                                        {editingProduct ? 'Update product details below' : 'Fill in the details to add a new product'}
                                    </p>
                                </div>
                            </div>
                            <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Tab Navigation */}
                        <div style={{
                            display: 'flex',
                            borderBottom: '1px solid var(--admin-border)',
                            padding: '0 2rem',
                            background: 'var(--admin-bg-secondary)'
                        }}>
                            {[
                                { id: 'basic', label: 'Basic Info', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                                { id: 'details', label: 'Details & Inventory', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                                { id: 'media', label: 'Media & Display', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '1rem 1.25rem',
                                        border: 'none',
                                        background: 'none',
                                        cursor: 'pointer',
                                        color: activeTab === tab.id ? 'var(--admin-accent-primary)' : 'var(--admin-text-muted)',
                                        borderBottom: activeTab === tab.id ? '2px solid var(--admin-accent-primary)' : '2px solid transparent',
                                        fontWeight: activeTab === tab.id ? 600 : 400,
                                        fontSize: '0.875rem',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                                    </svg>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                            <div className="admin-modal-body" style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>

                                {/* Basic Info Tab */}
                                {activeTab === 'basic' && (
                                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                        <div style={{ marginBottom: '2rem' }}>
                                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--admin-text-primary)' }}>
                                                Product Information
                                            </h4>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)', margin: 0 }}>
                                                Enter the basic details about your product
                                            </p>
                                        </div>

                                        <div className="admin-form-group" style={{ marginBottom: '1.5rem' }}>
                                            <label className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                </svg>
                                                Product Name <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="admin-input"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                                placeholder="e.g., Kanchipuram Silk Saree - Royal Blue"
                                                style={{ fontSize: '1rem', padding: '0.875rem 1rem' }}
                                            />
                                        </div>

                                        <div className="admin-form-group" style={{ marginBottom: '1.5rem' }}>
                                            <label className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                </svg>
                                                Category <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <select
                                                className="admin-input admin-select"
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                required
                                                style={{ padding: '0.875rem 1rem' }}
                                            >
                                                <option value="">Select a category</option>
                                                {categories.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Details & Inventory Tab */}
                                {activeTab === 'details' && (
                                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                        <div style={{ marginBottom: '2rem' }}>
                                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--admin-text-primary)' }}>
                                                Pricing & Inventory
                                            </h4>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)', margin: 0 }}>
                                                Set the price and manage stock levels
                                            </p>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                                            <div className="admin-form-group">
                                                <label className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Sale Price (₹) <span style={{ color: '#ef4444' }}>*</span>
                                                </label>
                                                <div style={{ position: 'relative' }}>
                                                    <span style={{
                                                        position: 'absolute',
                                                        left: '1rem',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        color: 'var(--admin-text-muted)',
                                                        fontWeight: 600
                                                    }}>₹</span>
                                                    <input
                                                        type="number"
                                                        className="admin-input"
                                                        value={formData.price}
                                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                        required
                                                        min="0"
                                                        placeholder="0"
                                                        style={{ paddingLeft: '2.5rem', fontSize: '1.125rem', fontWeight: 600 }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="admin-form-group">
                                                <label className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                    </svg>
                                                    Original Price / MRP (₹)
                                                </label>
                                                <div style={{ position: 'relative' }}>
                                                    <span style={{
                                                        position: 'absolute',
                                                        left: '1rem',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        color: 'var(--admin-text-muted)',
                                                        fontWeight: 600
                                                    }}>₹</span>
                                                    <input
                                                        type="number"
                                                        className="admin-input"
                                                        value={formData.originalPrice}
                                                        onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                                                        min="0"
                                                        placeholder="Leave empty for no discount"
                                                        style={{ paddingLeft: '2.5rem' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Discount Preview */}
                                        {formData.originalPrice && Number(formData.originalPrice) > Number(formData.price) && (
                                            <div style={{
                                                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.1) 100%)',
                                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                                borderRadius: 'var(--admin-radius-md)',
                                                padding: '1rem',
                                                marginBottom: '1.5rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem'
                                            }}>
                                                <span style={{ fontSize: '1.5rem' }}>🏷️</span>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                                        Discount Preview
                                                    </div>
                                                    <div style={{ fontSize: '0.875rem', color: 'var(--admin-text-secondary)' }}>
                                                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a' }}>
                                                            ₹{Number(formData.price).toLocaleString()}
                                                        </span>
                                                        {' '}
                                                        <span style={{ textDecoration: 'line-through', color: 'var(--admin-text-muted)' }}>
                                                            ₹{Number(formData.originalPrice).toLocaleString()}
                                                        </span>
                                                        {' '}
                                                        <span style={{ color: '#16a34a', fontWeight: 600 }}>
                                                            {Math.round((1 - Number(formData.price) / Number(formData.originalPrice)) * 100)}% Off
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                            <div className="admin-form-group">
                                                <label className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                    </svg>
                                                    Stock Quantity <span style={{ color: '#ef4444' }}>*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    className="admin-input"
                                                    value={formData.countInStock}
                                                    onChange={(e) => setFormData({ ...formData, countInStock: e.target.value })}
                                                    required
                                                    min="0"
                                                    placeholder="0"
                                                    style={{ fontSize: '1.125rem', fontWeight: 600 }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '2rem' }}>
                                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--admin-text-primary)' }}>
                                                Product Attributes
                                            </h4>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)', margin: 0 }}>
                                                Additional details about the product
                                            </p>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                            <div className="admin-form-group">
                                                <label className="admin-label">Material</label>
                                                <input
                                                    type="text"
                                                    className="admin-input"
                                                    value={formData.material}
                                                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                                                    list="material-options"
                                                    placeholder="Select or type material"
                                                />
                                                <datalist id="material-options">
                                                    {materials.map(mat => (
                                                        <option key={mat} value={mat} />
                                                    ))}
                                                </datalist>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '0.25rem' }}>
                                                    Select from list or type a custom material
                                                </p>
                                            </div>
                                            <div className="admin-form-group">
                                                <label className="admin-label">Color</label>
                                                <input
                                                    type="text"
                                                    className="admin-input"
                                                    value={formData.color}
                                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                    list="color-options"
                                                    placeholder="Select or type color"
                                                />
                                                <datalist id="color-options">
                                                    {colors.map(color => (
                                                        <option key={color} value={color} />
                                                    ))}
                                                </datalist>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '0.25rem' }}>
                                                    Select from list or type a custom color
                                                </p>
                                            </div>
                                        </div>

                                        <div className="admin-form-group" style={{ marginTop: '1.5rem' }}>
                                            <label className="admin-label">Care Instructions</label>
                                            <textarea
                                                className="admin-input"
                                                value={formData.careInstructions}
                                                onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
                                                placeholder="e.g., Dry clean only. Store in a cool, dry place."
                                                style={{ minHeight: '80px' }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Media & Display Tab */}
                                {activeTab === 'media' && (
                                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--admin-text-primary)' }}>
                                                Product Images
                                            </h4>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)', margin: 0 }}>
                                                Add image URLs for your product (first image will be the main image)
                                            </p>
                                        </div>

                                        {/* Image URL Inputs */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                                            {formData.images.map((imageUrl, index) => (
                                                <div key={index} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <label className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                            </svg>
                                                            Image {index + 1} {index === 0 && <span style={{ color: '#ef4444' }}>*</span>}
                                                            {index === 0 && <span style={{ fontSize: '0.75rem', color: 'var(--admin-accent-primary)', marginLeft: '0.5rem' }}>(Main)</span>}
                                                        </label>
                                                        <input
                                                            type="url"
                                                            className="admin-input"
                                                            value={imageUrl}
                                                            onChange={(e) => {
                                                                const newImages = [...formData.images];
                                                                newImages[index] = e.target.value;
                                                                setFormData({ ...formData, images: newImages });
                                                            }}
                                                            required={index === 0}
                                                            placeholder="https://example.com/product-image.jpg"
                                                        />
                                                    </div>
                                                    {formData.images.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newImages = formData.images.filter((_, i) => i !== index);
                                                                setFormData({ ...formData, images: newImages });
                                                            }}
                                                            style={{
                                                                marginTop: '1.75rem',
                                                                padding: '0.75rem',
                                                                background: 'rgba(239, 68, 68, 0.1)',
                                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                                borderRadius: 'var(--admin-radius-md)',
                                                                cursor: 'pointer',
                                                                color: '#ef4444'
                                                            }}
                                                            title="Remove image"
                                                        >
                                                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Add Image Button */}
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, images: [...formData.images, ''] })}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.75rem 1.25rem',
                                                background: 'transparent',
                                                border: '2px dashed var(--admin-border)',
                                                borderRadius: 'var(--admin-radius-md)',
                                                cursor: 'pointer',
                                                color: 'var(--admin-text-muted)',
                                                width: '100%',
                                                justifyContent: 'center',
                                                marginBottom: '1.5rem',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--admin-accent-primary)';
                                                e.currentTarget.style.color = 'var(--admin-accent-primary)';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--admin-border)';
                                                e.currentTarget.style.color = 'var(--admin-text-muted)';
                                            }}
                                        >
                                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Add Another Image
                                        </button>

                                        {/* Image Previews */}
                                        {formData.images.some(img => img.trim() !== '') && (
                                            <div style={{
                                                marginBottom: '1.5rem',
                                                padding: '1rem',
                                                background: 'var(--admin-bg-tertiary)',
                                                borderRadius: 'var(--admin-radius-md)'
                                            }}>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginBottom: '1rem' }}>
                                                    Image Previews
                                                </p>
                                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                                    {formData.images.filter(img => img.trim() !== '').map((imageUrl, index) => (
                                                        <div key={index} style={{ position: 'relative' }}>
                                                            {index === 0 && (
                                                                <span style={{
                                                                    position: 'absolute',
                                                                    top: '-8px',
                                                                    left: '-8px',
                                                                    background: 'var(--admin-accent-primary)',
                                                                    color: 'white',
                                                                    fontSize: '0.625rem',
                                                                    padding: '2px 6px',
                                                                    borderRadius: '4px',
                                                                    fontWeight: 600,
                                                                    zIndex: 1
                                                                }}>MAIN</span>
                                                            )}
                                                            <img
                                                                src={imageUrl}
                                                                alt={`Preview ${index + 1}`}
                                                                style={{
                                                                    width: '100px',
                                                                    height: '100px',
                                                                    objectFit: 'cover',
                                                                    borderRadius: 'var(--admin-radius-md)',
                                                                    border: index === 0 ? '2px solid var(--admin-accent-primary)' : '2px solid var(--admin-border)'
                                                                }}
                                                                onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=Error'; }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ marginBottom: '1rem' }}>
                                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--admin-text-primary)' }}>
                                                Display Settings
                                            </h4>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)', margin: 0 }}>
                                                Control how your product is displayed
                                            </p>
                                        </div>

                                        <div style={{
                                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
                                            borderRadius: 'var(--admin-radius-md)',
                                            padding: '1.25rem',
                                            border: '1px solid rgba(139, 92, 246, 0.2)'
                                        }}>
                                            <label style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                cursor: 'pointer'
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isFeatured}
                                                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                                                    style={{
                                                        width: '20px',
                                                        height: '20px',
                                                        accentColor: '#8b5cf6'
                                                    }}
                                                />
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '0.25rem' }}>
                                                        ⭐ Feature this product
                                                    </div>
                                                    <div style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
                                                        Featured products appear on the homepage and get more visibility
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="admin-modal-footer" style={{
                                background: 'var(--admin-bg-secondary)',
                                borderTop: '1px solid var(--admin-border)',
                                padding: '1.25rem 2rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
                                    <span style={{ color: '#ef4444' }}>*</span> Required fields
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        type="button"
                                        className="admin-btn admin-btn-secondary"
                                        onClick={() => setShowModal(false)}
                                        style={{ minWidth: '100px' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="admin-btn admin-btn-primary"
                                        disabled={saving}
                                        style={{
                                            minWidth: '150px',
                                            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
                                        }}
                                    >
                                        {saving ? (
                                            <>
                                                <span className="admin-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                {editingProduct ? 'Update Product' : 'Create Product'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className={`admin-toast admin-toast-${toast.type}`}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {toast.type === 'success' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        )}
                    </svg>
                    {toast.message}
                </div>
            )}

            {/* Animation Keyframes */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </AdminLayout>
    );
};

export default Products;

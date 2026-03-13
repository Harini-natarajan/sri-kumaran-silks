import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { getAdminProducts, getLowStockProducts, updateProductStock, bulkUpdateStock } from '../services/api';
import { useSocket } from '../context/SocketContext';

const StockManagement = () => {
    const [products, setProducts] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [stockUpdates, setStockUpdates] = useState({});
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [threshold, setThreshold] = useState(10);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const socket = useSocket();

    useEffect(() => {
        fetchData();
    }, [page, threshold]);

    useEffect(() => {
        if (socket) {
            socket.on('stockUpdate', ({ productId, countInStock }) => {
                setProducts(prevProducts => 
                    prevProducts.map(p => 
                        p._id === productId ? { ...p, countInStock } : p
                    )
                );
                
                setLowStockProducts(prevLowStock => {
                    const exists = prevLowStock.find(p => p._id === productId);
                    if (exists) {
                        if (countInStock >= threshold) {
                            return prevLowStock.filter(p => p._id !== productId);
                        } else {
                            return prevLowStock.map(p => 
                                p._id === productId ? { ...p, countInStock } : p
                            );
                        }
                    } else if (countInStock < threshold) {
                        // We might need to fetch the full product info if we want to add it to low stock list
                        // For now we just refresh if it becomes low stock and we didn't have it
                        fetchData();
                    }
                    return prevLowStock;
                });
            });

            return () => {
                socket.off('stockUpdate');
            };
        }
    }, [socket, threshold]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [allResponse, lowResponse] = await Promise.all([
                getAdminProducts(page, 20),
                getLowStockProducts(threshold)
            ]);
            setProducts(allResponse.data.products);
            setPages(allResponse.data.pages);
            setLowStockProducts(lowResponse.data);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load stock data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleStockChange = (productId, value) => {
        setStockUpdates(prev => ({
            ...prev,
            [productId]: value
        }));
    };

    const updateSingleStock = async (productId, operation = 'set') => {
        const newStock = stockUpdates[productId];
        if (newStock === undefined || newStock === '') return;

        try {
            setSaving(true);
            await updateProductStock(productId, {
                countInStock: parseInt(newStock),
                operation
            });
            showToast('Stock updated successfully');
            setStockUpdates(prev => {
                const updated = { ...prev };
                delete updated[productId];
                return updated;
            });
            fetchData();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update stock', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleBulkUpdate = async () => {
        const updates = Object.entries(stockUpdates)
            .filter(([_, value]) => value !== '' && value !== undefined)
            .map(([productId, countInStock]) => ({
                productId,
                countInStock: parseInt(countInStock)
            }));

        if (updates.length === 0) {
            showToast('No changes to save', 'error');
            return;
        }

        try {
            setSaving(true);
            await bulkUpdateStock(updates);
            showToast(`Updated stock for ${updates.length} products`);
            setStockUpdates({});
            fetchData();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to bulk update stock', 'error');
        } finally {
            setSaving(false);
        }
    };

    const getStockLevel = (count) => {
        if (count === 0) return { level: 'critical', color: '#ef4444', label: 'Out of Stock' };
        if (count < 5) return { level: 'low', color: '#f97316', label: 'Critical' };
        if (count < 10) return { level: 'warning', color: '#f59e0b', label: 'Low' };
        if (count < 25) return { level: 'moderate', color: '#3b82f6', label: 'Moderate' };
        return { level: 'good', color: '#10b981', label: 'Healthy' };
    };

    const displayProducts = activeTab === 'low' ? lowStockProducts : products;

    const outOfStockCount = lowStockProducts.filter(p => p.countInStock === 0).length;
    const criticalCount = lowStockProducts.filter(p => p.countInStock > 0 && p.countInStock < 5).length;
    const lowCount = lowStockProducts.filter(p => p.countInStock >= 5 && p.countInStock < threshold).length;

    return (
        <AdminLayout>
            {/* Page Header */}
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Stock Management</h1>
                    <p className="admin-page-subtitle">Monitor and manage inventory levels</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {Object.keys(stockUpdates).length > 0 && (
                        <button
                            className="admin-btn admin-btn-success"
                            onClick={handleBulkUpdate}
                            disabled={saving}
                        >
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Save All Changes ({Object.keys(stockUpdates).length})
                        </button>
                    )}
                    <button className="admin-btn admin-btn-secondary" onClick={fetchData}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stock Overview Cards */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card" style={{ '--stat-color': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                    <div className="stat-icon red">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div className="stat-value">{outOfStockCount}</div>
                    <div className="stat-label">Out of Stock</div>
                </div>

                <div className="stat-card" style={{ '--stat-color': 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}>
                    <div className="stat-icon orange">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <div className="stat-value">{criticalCount}</div>
                    <div className="stat-label">Critical ({"<"}5 units)</div>
                </div>

                <div className="stat-card" style={{ '--stat-color': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                    </div>
                    <div className="stat-value">{lowCount}</div>
                    <div className="stat-label">Low Stock ({"<"}{threshold} units)</div>
                </div>

                <div className="stat-card" style={{ '--stat-color': 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                    <div className="stat-icon green">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="stat-value">{products.length - lowStockProducts.length}</div>
                    <div className="stat-label">Healthy Stock</div>
                </div>
            </div>

            {/* Tabs and Threshold */}
            <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
                <div className="admin-card-body" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className={`admin-btn ${activeTab === 'all' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                                onClick={() => setActiveTab('all')}
                            >
                                All Products
                            </button>
                            <button
                                className={`admin-btn ${activeTab === 'low' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                                onClick={() => setActiveTab('low')}
                            >
                                Low Stock ({lowStockProducts.length})
                            </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <label style={{ fontSize: '0.875rem', color: 'var(--admin-text-secondary)' }}>
                                Low stock threshold:
                            </label>
                            <input
                                type="number"
                                className="admin-input"
                                style={{ width: '80px', padding: '0.5rem' }}
                                value={threshold}
                                onChange={(e) => setThreshold(parseInt(e.target.value) || 10)}
                                min="1"
                            />
                            <span style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)' }}>units</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stock Table */}
            <div className="admin-card">
                <div className="admin-table-wrapper">
                    {loading ? (
                        <div className="admin-loading">
                            <div className="admin-spinner"></div>
                            <p>Loading stock data...</p>
                        </div>
                    ) : displayProducts.length === 0 ? (
                        <div className="admin-empty">
                            <div className="admin-empty-icon">📦</div>
                            <div className="admin-empty-title">
                                {activeTab === 'low' ? 'Great! No Low Stock Items' : 'No Products Found'}
                            </div>
                            <div className="admin-empty-text">
                                {activeTab === 'low' ? 'All products have sufficient stock levels.' : 'Add some products to manage stock.'}
                            </div>
                        </div>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Current Stock</th>
                                    <th>Status</th>
                                    <th>Stock Level</th>
                                    <th>Update Stock</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayProducts.map((product) => {
                                    const stockInfo = getStockLevel(product.countInStock);
                                    const pendingUpdate = stockUpdates[product._id];
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
                                                            SKU: {product._id.slice(-8).toUpperCase()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    fontSize: '1.25rem',
                                                    fontWeight: 700,
                                                    color: stockInfo.color
                                                }}>
                                                    {product.countInStock}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginLeft: '4px' }}>
                                                    units
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    className="admin-badge"
                                                    style={{
                                                        background: `${stockInfo.color}20`,
                                                        color: stockInfo.color
                                                    }}
                                                >
                                                    {stockInfo.label}
                                                </span>
                                            </td>
                                            <td style={{ width: '150px' }}>
                                                <div className="stock-bar" style={{ maxWidth: '120px', height: '8px' }}>
                                                    <div
                                                        className="stock-fill"
                                                        style={{
                                                            width: `${Math.min(product.countInStock, 100)}%`,
                                                            background: stockInfo.color
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <input
                                                        type="number"
                                                        className="admin-input"
                                                        style={{
                                                            width: '80px',
                                                            padding: '0.5rem',
                                                            background: pendingUpdate !== undefined ? 'rgba(139, 92, 246, 0.1)' : undefined,
                                                            borderColor: pendingUpdate !== undefined ? 'var(--admin-accent-primary)' : undefined
                                                        }}
                                                        placeholder={product.countInStock.toString()}
                                                        value={pendingUpdate !== undefined ? pendingUpdate : ''}
                                                        onChange={(e) => handleStockChange(product._id, e.target.value)}
                                                        min="0"
                                                    />
                                                    {pendingUpdate !== undefined && (
                                                        <button
                                                            className="admin-btn admin-btn-secondary admin-btn-sm"
                                                            style={{ padding: '0.25rem 0.5rem' }}
                                                            onClick={() => {
                                                                setStockUpdates(prev => {
                                                                    const updated = { ...prev };
                                                                    delete updated[product._id];
                                                                    return updated;
                                                                });
                                                            }}
                                                            title="Cancel"
                                                        >
                                                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        className="admin-btn admin-btn-success admin-btn-sm"
                                                        onClick={() => {
                                                            setStockUpdates(prev => ({
                                                                ...prev,
                                                                [product._id]: (prev[product._id] || product.countInStock) + 10
                                                            }));
                                                        }}
                                                        title="Add 10 units"
                                                    >
                                                        +10
                                                    </button>
                                                    <button
                                                        className="admin-btn admin-btn-secondary admin-btn-sm"
                                                        onClick={() => updateSingleStock(product._id)}
                                                        disabled={pendingUpdate === undefined || saving}
                                                        title="Apply change"
                                                    >
                                                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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

            {/* Pagination for All Products tab */}
            {activeTab === 'all' && pages > 1 && (
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
                    {[...Array(Math.min(pages, 5))].map((_, i) => (
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
        </AdminLayout>
    );
};

export default StockManagement;

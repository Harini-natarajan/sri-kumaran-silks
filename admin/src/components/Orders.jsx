import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { getAdminOrders, getAdminOrderById, updateOrderToDelivered, updateOrderToPaid, deleteOrder } from '../services/api';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loadingOrder, setLoadingOrder] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, [page, statusFilter]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data } = await getAdminOrders(page, 10, statusFilter);
            setOrders(data.orders);
            setPages(data.pages);
            setTotal(data.total);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const viewOrderDetails = async (orderId) => {
        try {
            setLoadingOrder(true);
            setShowModal(true);
            const { data } = await getAdminOrderById(orderId);
            setSelectedOrder(data);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load order details', 'error');
            setShowModal(false);
        } finally {
            setLoadingOrder(false);
        }
    };

    const handleMarkDelivered = async (orderId) => {
        try {
            setSaving(true);
            await updateOrderToDelivered(orderId);
            showToast('Order marked as delivered');
            if (selectedOrder && selectedOrder._id === orderId) {
                setSelectedOrder({ ...selectedOrder, isDelivered: true, deliveredAt: new Date() });
            }
            fetchOrders();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update order', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleMarkPaid = async (orderId) => {
        try {
            setSaving(true);
            await updateOrderToPaid(orderId, {});
            showToast('Order marked as paid');
            if (selectedOrder && selectedOrder._id === orderId) {
                setSelectedOrder({ ...selectedOrder, isPaid: true, paidAt: new Date() });
            }
            fetchOrders();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update order', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) return;

        try {
            await deleteOrder(id);
            showToast('Order deleted successfully');
            fetchOrders();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete order', 'error');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getOrderStatus = (order) => {
        if (order.isDelivered) return { class: 'admin-badge-success', text: 'Delivered', icon: '✓' };
        if (order.isPaid) return { class: 'admin-badge-info', text: 'Paid', icon: '💳' };
        return { class: 'admin-badge-warning', text: 'Pending', icon: '⏳' };
    };

    const statusFilters = [
        { value: '', label: 'All Orders' },
        { value: 'paid', label: 'Paid' },
        { value: 'unpaid', label: 'Unpaid' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'pending', label: 'Pending Delivery' },
    ];

    return (
        <AdminLayout>
            {/* Page Header */}
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Orders</h1>
                    <p className="admin-page-subtitle">Manage customer orders and deliveries ({total} total orders)</p>
                </div>
                <button className="admin-btn admin-btn-secondary" onClick={fetchOrders}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
                <div className="admin-card-body" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {statusFilters.map(filter => (
                            <button
                                key={filter.value}
                                className={`admin-btn ${statusFilter === filter.value ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                                onClick={() => { setStatusFilter(filter.value); setPage(1); }}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="admin-card">
                <div className="admin-table-wrapper">
                    {loading ? (
                        <div className="admin-loading">
                            <div className="admin-spinner"></div>
                            <p>Loading orders...</p>
                        </div>
                    ) : error ? (
                        <div className="admin-empty">
                            <div className="admin-empty-icon">⚠️</div>
                            <div className="admin-empty-title">Error</div>
                            <div className="admin-empty-text">{error}</div>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="admin-empty">
                            <div className="admin-empty-icon">📦</div>
                            <div className="admin-empty-title">No Orders Found</div>
                            <div className="admin-empty-text">
                                {statusFilter ? `No ${statusFilter} orders found.` : 'Orders will appear here once customers place them.'}
                            </div>
                        </div>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Payment</th>
                                    <th>Delivery</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => {
                                    const status = getOrderStatus(order);
                                    return (
                                        <tr key={order._id}>
                                            <td>
                                                <span style={{
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.8rem',
                                                    background: 'var(--admin-bg-tertiary)',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '4px'
                                                }}>
                                                    #{order._id.slice(-8).toUpperCase()}
                                                </span>
                                            </td>
                                            <td>
                                                <div>
                                                    <div style={{ fontWeight: 500 }}>{order.user?.name || 'Guest'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                                                        {order.user?.email || 'N/A'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="admin-badge admin-badge-info">
                                                    {order.orderItems?.length || 0} items
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                                {formatCurrency(order.totalPrice)}
                                            </td>
                                            <td>
                                                {order.isPaid ? (
                                                    <span className="admin-badge admin-badge-success">
                                                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ marginRight: '4px' }}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Paid
                                                    </span>
                                                ) : (
                                                    <span className="admin-badge admin-badge-warning">Unpaid</span>
                                                )}
                                            </td>
                                            <td>
                                                {order.isDelivered ? (
                                                    <span className="admin-badge admin-badge-success">
                                                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ marginRight: '4px' }}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Delivered
                                                    </span>
                                                ) : (
                                                    <span className="admin-badge admin-badge-warning">Pending</span>
                                                )}
                                            </td>
                                            <td style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
                                                {formatDate(order.createdAt)}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        className="admin-btn admin-btn-secondary admin-btn-sm"
                                                        onClick={() => viewOrderDetails(order._id)}
                                                        title="View Details"
                                                    >
                                                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    {!order.isDelivered && (
                                                        <button
                                                            className="admin-btn admin-btn-success admin-btn-sm"
                                                            onClick={() => handleMarkDelivered(order._id)}
                                                            title="Mark Delivered"
                                                        >
                                                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    <button
                                                        className="admin-btn admin-btn-danger admin-btn-sm"
                                                        onClick={() => handleDelete(order._id)}
                                                        title="Delete Order"
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

            {/* Order Details Modal */}
            {showModal && (
                <div className="admin-modal-overlay" onClick={() => { setShowModal(false); setSelectedOrder(null); }}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="admin-modal-header">
                            <h3 className="admin-modal-title">
                                Order Details
                                {selectedOrder && (
                                    <span style={{
                                        fontSize: '0.875rem',
                                        fontWeight: 400,
                                        color: 'var(--admin-text-muted)',
                                        marginLeft: '0.75rem'
                                    }}>
                                        #{selectedOrder._id.slice(-8).toUpperCase()}
                                    </span>
                                )}
                            </h3>
                            <button className="admin-modal-close" onClick={() => { setShowModal(false); setSelectedOrder(null); }}>
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="admin-modal-body">
                            {loadingOrder ? (
                                <div className="admin-loading" style={{ padding: '2rem' }}>
                                    <div className="admin-spinner"></div>
                                    <p>Loading order details...</p>
                                </div>
                            ) : selectedOrder ? (
                                <>
                                    {/* Status Badges */}
                                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                        {selectedOrder.isPaid ? (
                                            <span className="admin-badge admin-badge-success" style={{ padding: '0.5rem 1rem' }}>
                                                ✓ Paid on {formatDate(selectedOrder.paidAt)}
                                            </span>
                                        ) : (
                                            <span className="admin-badge admin-badge-warning" style={{ padding: '0.5rem 1rem' }}>
                                                ⏳ Payment Pending
                                            </span>
                                        )}
                                        {selectedOrder.isDelivered ? (
                                            <span className="admin-badge admin-badge-success" style={{ padding: '0.5rem 1rem' }}>
                                                ✓ Delivered on {formatDate(selectedOrder.deliveredAt)}
                                            </span>
                                        ) : (
                                            <span className="admin-badge admin-badge-warning" style={{ padding: '0.5rem 1rem' }}>
                                                📦 Awaiting Delivery
                                            </span>
                                        )}
                                    </div>

                                    {/* Customer & Shipping Info */}
                                    <div className="admin-grid-2" style={{ marginBottom: '1.5rem' }}>
                                        <div style={{
                                            background: 'var(--admin-bg-tertiary)',
                                            borderRadius: 'var(--admin-radius-md)',
                                            padding: '1rem'
                                        }}>
                                            <h4 style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)', marginBottom: '0.75rem' }}>
                                                Customer Information
                                            </h4>
                                            <div style={{ fontWeight: 500 }}>{selectedOrder.user?.name || 'Guest'}</div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--admin-text-secondary)' }}>
                                                {selectedOrder.user?.email || 'N/A'}
                                            </div>
                                        </div>
                                        <div style={{
                                            background: 'var(--admin-bg-tertiary)',
                                            borderRadius: 'var(--admin-radius-md)',
                                            padding: '1rem'
                                        }}>
                                            <h4 style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)', marginBottom: '0.75rem' }}>
                                                Shipping Address
                                            </h4>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--admin-text-secondary)' }}>
                                                {selectedOrder.shippingAddress?.address}<br />
                                                {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.postalCode}<br />
                                                {selectedOrder.shippingAddress?.country}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <h4 style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)', marginBottom: '0.75rem' }}>
                                            Order Items ({selectedOrder.orderItems?.length || 0})
                                        </h4>
                                        <div style={{
                                            background: 'var(--admin-bg-tertiary)',
                                            borderRadius: 'var(--admin-radius-md)',
                                            overflow: 'hidden'
                                        }}>
                                            {selectedOrder.orderItems?.map((item, index) => (
                                                <div key={index} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '1rem',
                                                    padding: '0.75rem 1rem',
                                                    borderBottom: index < selectedOrder.orderItems.length - 1 ? '1px solid var(--admin-border)' : 'none'
                                                }}>
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/50?text=No+Image'; }}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 500 }}>{item.name}</div>
                                                        <div style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
                                                            Qty: {item.qty} × {formatCurrency(item.price)}
                                                        </div>
                                                    </div>
                                                    <div style={{ fontWeight: 600 }}>
                                                        {formatCurrency(item.qty * item.price)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Order Summary */}
                                    <div style={{
                                        background: 'var(--admin-bg-tertiary)',
                                        borderRadius: 'var(--admin-radius-md)',
                                        padding: '1rem'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ color: 'var(--admin-text-secondary)' }}>Items Total</span>
                                            <span>{formatCurrency(selectedOrder.itemsPrice)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ color: 'var(--admin-text-secondary)' }}>Shipping</span>
                                            <span>{formatCurrency(selectedOrder.shippingPrice)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ color: 'var(--admin-text-secondary)' }}>Tax</span>
                                            <span>{formatCurrency(selectedOrder.taxPrice)}</span>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            paddingTop: '0.75rem',
                                            borderTop: '1px solid var(--admin-border)',
                                            fontWeight: 600,
                                            fontSize: '1.125rem'
                                        }}>
                                            <span>Total</span>
                                            <span style={{ color: 'var(--admin-accent-primary)' }}>
                                                {formatCurrency(selectedOrder.totalPrice)}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </div>
                        {selectedOrder && (
                            <div className="admin-modal-footer">
                                {!selectedOrder.isPaid && (
                                    <button
                                        className="admin-btn admin-btn-secondary"
                                        onClick={() => handleMarkPaid(selectedOrder._id)}
                                        disabled={saving}
                                    >
                                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        Mark as Paid
                                    </button>
                                )}
                                {!selectedOrder.isDelivered && (
                                    <button
                                        className="admin-btn admin-btn-primary"
                                        onClick={() => handleMarkDelivered(selectedOrder._id)}
                                        disabled={saving}
                                    >
                                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {saving ? 'Updating...' : 'Mark as Delivered'}
                                    </button>
                                )}
                                {selectedOrder.isDelivered && selectedOrder.isPaid && (
                                    <span style={{ color: 'var(--admin-success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Order Completed
                                    </span>
                                )}
                            </div>
                        )}
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
        </AdminLayout>
    );
};

export default Orders;

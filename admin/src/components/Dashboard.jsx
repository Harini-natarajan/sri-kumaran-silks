import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { getAdminStats } from '../services/api';



const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        fetchStats();
        // Auto-refresh every 30 seconds
        intervalRef.current = setInterval(() => {
            fetchStats(true);
        }, 30000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const fetchStats = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            setIsRefreshing(true);
            const { data } = await getAdminStats();
            setStats(data);
            setLastUpdated(new Date());
            setError(null);
        } catch (err) {
            if (!silent) {
                setError(err.response?.data?.message || 'Failed to load dashboard');
            }
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getMonthName = (monthNumber) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[monthNumber - 1];
    };

    // Animated counter component
    const AnimatedCounter = ({ value, prefix = '', suffix = '' }) => {
        const [displayValue, setDisplayValue] = useState(0);

        useEffect(() => {
            const duration = 1000;
            const steps = 30;
            const stepValue = value / steps;
            let current = 0;

            const timer = setInterval(() => {
                current += stepValue;
                if (current >= value) {
                    setDisplayValue(value);
                    clearInterval(timer);
                } else {
                    setDisplayValue(Math.floor(current));
                }
            }, duration / steps);

            return () => clearInterval(timer);
        }, [value]);

        return <>{prefix}{displayValue.toLocaleString('en-IN')}{suffix}</>;
    };

    if (loading && !stats) {
        return (
            <AdminLayout>
                <div className="admin-loading">
                    <div className="admin-spinner"></div>
                    <p>Loading dashboard...</p>
                </div>
            </AdminLayout>
        );
    }



    if (error && !stats) {
        return (
            <AdminLayout>
                <div className="admin-empty">
                    <div className="admin-empty-icon">⚠️</div>
                    <div className="admin-empty-title">Error Loading Dashboard</div>
                    <div className="admin-empty-text">{error}</div>
                    <button className="admin-btn admin-btn-primary" style={{ marginTop: '1rem' }} onClick={() => fetchStats()}>
                        Try Again
                    </button>
                </div>
            </AdminLayout>
        );
    }



    return (
        <AdminLayout>

            {/* Page Header */}
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Dashboard</h1>
                    <p className="admin-page-subtitle">
                        Welcome back! Here's what's happening with your store.
                        {lastUpdated && (
                            <span style={{ marginLeft: '1rem', fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                                Last updated: {formatTime(lastUpdated)}
                            </span>
                        )}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {isRefreshing && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--admin-accent-primary)' }}>
                            <span className="admin-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', display: 'inline-block', marginRight: '0.5rem' }}></span>
                            Updating...
                        </span>
                    )}
                    <button className="admin-btn admin-btn-primary" onClick={() => fetchStats()} disabled={isRefreshing}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Live Indicator */}
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                marginBottom: '1.5rem',
                fontSize: '0.8125rem',
                color: '#10b981'
            }}>
                <span style={{
                    width: '8px',
                    height: '8px',
                    background: '#10b981',
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite'
                }}></span>
                Live Data • Auto-refreshes every 30 seconds
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card" style={{ '--stat-color': 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' }}>
                    <div className="stat-icon purple">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="stat-value">{formatCurrency(stats?.totalRevenue || 0)}</div>
                    <div className="stat-label">Total Revenue</div>
                    <div className="stat-trend up">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        From paid orders
                    </div>
                </div>

                <div className="stat-card" style={{ '--stat-color': 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                    <div className="stat-icon green">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <div className="stat-value">
                        <AnimatedCounter value={stats?.totalOrders || 0} />
                    </div>
                    <div className="stat-label">Total Orders</div>
                    <div className="stat-trend up">
                        <span style={{ color: 'var(--admin-success)', marginRight: '4px' }}>{stats?.deliveredOrders || 0}</span> delivered
                    </div>
                </div>

                <div className="stat-card" style={{ '--stat-color': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                    <div className="stat-icon blue">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <div className="stat-value">
                        <AnimatedCounter value={stats?.totalProducts || 0} />
                    </div>
                    <div className="stat-label">Products</div>
                    <div className="stat-trend up">Active in catalog</div>
                </div>

                <div className="stat-card" style={{ '--stat-color': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                    <div className="stat-icon orange">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <div className="stat-value">
                        <AnimatedCounter value={stats?.totalUsers || 0} />
                    </div>
                    <div className="stat-label">Customers</div>
                    <div className="stat-trend up">Registered users</div>
                </div>

                <div className="stat-card" style={{ '--stat-color': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                    <div className="stat-icon red">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div className="stat-value" style={{ color: stats?.lowStockProducts > 0 ? '#ef4444' : 'inherit' }}>
                        <AnimatedCounter value={stats?.lowStockProducts || 0} />
                    </div>
                    <div className="stat-label">Low Stock Alerts</div>
                    <Link to="/admin/stock" className="stat-trend down" style={{ textDecoration: 'none' }}>
                        View items →
                    </Link>
                </div>

                <div className="stat-card" style={{ '--stat-color': 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
                    <div className="stat-icon purple">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="stat-value">
                        <AnimatedCounter value={stats?.pendingOrders || 0} />
                    </div>
                    <div className="stat-label">Pending Deliveries</div>
                    <Link to="/admin/orders" className="stat-trend" style={{ textDecoration: 'none', background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
                        Process orders →
                    </Link>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="admin-card" style={{ marginTop: '1.5rem' }}>
                <div className="admin-card-header">
                    <h3 className="admin-card-title">Quick Actions</h3>
                </div>
                <div className="admin-card-body">
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <Link to="/admin/products" className="admin-btn admin-btn-primary">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add New Product
                        </Link>
                        <Link to="/admin/orders" className="admin-btn admin-btn-secondary">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            View Orders
                        </Link>
                        <Link to="/admin/stock" className="admin-btn admin-btn-secondary">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            Manage Stock
                        </Link>
                        <Link to="/admin/users" className="admin-btn admin-btn-secondary">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            Manage Users
                        </Link>
                    </div>
                </div>
            </div>

            {/* Charts and Recent Orders */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                {/* Monthly Revenue Chart */}
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h3 className="admin-card-title">Monthly Revenue</h3>
                        <span className="admin-badge admin-badge-purple">Last 6 months</span>
                    </div>
                    <div className="admin-card-body">
                        {stats?.monthlyRevenue && stats.monthlyRevenue.length > 0 ? (
                            <div className="chart-container">
                                {stats.monthlyRevenue.map((item, index) => {
                                    const maxRevenue = Math.max(...stats.monthlyRevenue.map(r => r.revenue));
                                    const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 20;
                                    return (
                                        <div
                                            key={index}
                                            className="chart-bar"
                                            style={{ height: `${Math.max(height, 10)}%`, animationDelay: `${index * 0.1}s` }}
                                            data-value={formatCurrency(item.revenue)}
                                            title={`${getMonthName(item._id)}: ${formatCurrency(item.revenue)}`}
                                        >
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '-1.5rem',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                fontSize: '0.7rem',
                                                color: 'var(--admin-text-muted)'
                                            }}>
                                                {getMonthName(item._id)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="admin-empty" style={{ padding: '2rem' }}>
                                <div className="admin-empty-text">No revenue data yet. Revenue will appear when orders are paid.</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h3 className="admin-card-title">Recent Orders</h3>
                        <Link to="/admin/orders" className="admin-btn admin-btn-secondary admin-btn-sm">
                            View All
                        </Link>
                    </div>
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                                    stats.recentOrders.map((order) => (
                                        <tr key={order._id}>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                                #{order._id.slice(-8).toUpperCase()}
                                            </td>
                                            <td>{order.user?.name || 'Guest'}</td>
                                            <td style={{ fontWeight: 500 }}>{formatCurrency(order.totalPrice)}</td>
                                            <td>
                                                {order.isDelivered ? (
                                                    <span className="admin-badge admin-badge-success">Delivered</span>
                                                ) : order.isPaid ? (
                                                    <span className="admin-badge admin-badge-info">Paid</span>
                                                ) : (
                                                    <span className="admin-badge admin-badge-warning">Pending</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', color: 'var(--admin-text-muted)', padding: '2rem' }}>
                                            No orders yet. Orders will appear here when customers place them.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Top Products */}
            <div className="admin-card" style={{ marginTop: '1.5rem' }}>
                <div className="admin-card-header">
                    <h3 className="admin-card-title">Inventory Summary</h3>
                    <Link to="/admin/products" className="admin-btn admin-btn-secondary admin-btn-sm">
                        View All Products
                    </Link>
                </div>
                <div className="admin-card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div style={{
                            background: 'var(--admin-bg-tertiary)',
                            padding: '1.25rem',
                            borderRadius: 'var(--admin-radius-md)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>
                                {stats?.totalProducts || 0}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)' }}>Total Products</div>
                        </div>
                        <div style={{
                            background: 'var(--admin-bg-tertiary)',
                            padding: '1.25rem',
                            borderRadius: 'var(--admin-radius-md)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: stats?.lowStockProducts > 0 ? '#ef4444' : '#10b981' }}>
                                {stats?.lowStockProducts || 0}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)' }}>Low Stock Items</div>
                        </div>
                        <div style={{
                            background: 'var(--admin-bg-tertiary)',
                            padding: '1.25rem',
                            borderRadius: 'var(--admin-radius-md)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6' }}>
                                {(stats?.totalProducts || 0) - (stats?.lowStockProducts || 0)}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)' }}>Healthy Stock</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Status Summary */}
            <div style={{ marginTop: '1.5rem' }}>
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h3 className="admin-card-title">Order Status Overview</h3>
                    </div>
                    <div className="admin-card-body">
                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--admin-text-secondary)' }}>Paid Orders</span>
                                    <span style={{ fontWeight: 600, color: 'var(--admin-success)' }}>{stats?.paidOrders || 0}</span>
                                </div>
                                <div style={{ height: '8px', background: 'var(--admin-bg-tertiary)', borderRadius: '9999px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${stats?.totalOrders > 0 ? (stats.paidOrders / stats.totalOrders) * 100 : 0}%`,
                                        background: 'var(--admin-success)',
                                        borderRadius: '9999px',
                                        transition: 'width 0.5s ease'
                                    }} />
                                </div>
                            </div>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--admin-text-secondary)' }}>Delivered</span>
                                    <span style={{ fontWeight: 600, color: 'var(--admin-info)' }}>{stats?.deliveredOrders || 0}</span>
                                </div>
                                <div style={{ height: '8px', background: 'var(--admin-bg-tertiary)', borderRadius: '9999px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${stats?.totalOrders > 0 ? (stats.deliveredOrders / stats.totalOrders) * 100 : 0}%`,
                                        background: 'var(--admin-info)',
                                        borderRadius: '9999px',
                                        transition: 'width 0.5s ease'
                                    }} />
                                </div>
                            </div>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--admin-text-secondary)' }}>Pending</span>
                                    <span style={{ fontWeight: 600, color: 'var(--admin-warning)' }}>{stats?.pendingOrders || 0}</span>
                                </div>
                                <div style={{ height: '8px', background: 'var(--admin-bg-tertiary)', borderRadius: '9999px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${stats?.totalOrders > 0 ? (stats.pendingOrders / stats.totalOrders) * 100 : 0}%`,
                                        background: 'var(--admin-warning)',
                                        borderRadius: '9999px',
                                        transition: 'width 0.5s ease'
                                    }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Responsive styles & animations */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @media (max-width: 1024px) {
                    .admin-page-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }
                    div[style*="grid-template-columns: 1fr 1fr"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </AdminLayout>
    );


};

export default Dashboard;

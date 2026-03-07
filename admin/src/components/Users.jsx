import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { getAdminUsers, updateAdminUser, deleteAdminUser } from '../services/api';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        isAdmin: false
    });
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, [page]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data } = await getAdminUsers(page, 10);
            setUsers(data.users);
            setPages(data.pages);
            setTotal(data.total);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await updateAdminUser(editingUser._id, formData);
            showToast('User updated successfully');
            setShowModal(false);
            fetchUsers();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update user', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) return;

        try {
            await deleteAdminUser(id);
            showToast('User deleted successfully');
            fetchUsers();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete user', 'error');
        }
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

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getRandomColor = (name) => {
        const colors = [
            'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    return (
        <AdminLayout>
            {/* Page Header */}
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Users</h1>
                    <p className="admin-page-subtitle">Manage customer accounts and permissions ({total} total users)</p>
                </div>
                <button className="admin-btn admin-btn-secondary" onClick={fetchUsers}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Stats Summary */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <div className="stat-value">{total}</div>
                    <div className="stat-label">Total Users</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon purple">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <div className="stat-value">{users.filter(u => u.isAdmin).length}</div>
                    <div className="stat-label">Admin Users</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon green">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <div className="stat-value">{users.filter(u => !u.isAdmin).length}</div>
                    <div className="stat-label">Customers</div>
                </div>
            </div>

            {/* Users Table */}
            <div className="admin-card">
                <div className="admin-table-wrapper">
                    {loading ? (
                        <div className="admin-loading">
                            <div className="admin-spinner"></div>
                            <p>Loading users...</p>
                        </div>
                    ) : error ? (
                        <div className="admin-empty">
                            <div className="admin-empty-icon">⚠️</div>
                            <div className="admin-empty-title">Error</div>
                            <div className="admin-empty-text">{error}</div>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="admin-empty">
                            <div className="admin-empty-icon">👥</div>
                            <div className="admin-empty-title">No Users Found</div>
                            <div className="admin-empty-text">Users will appear here once they register.</div>
                        </div>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '44px',
                                                    height: '44px',
                                                    borderRadius: '50%',
                                                    background: getRandomColor(user.name),
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 600,
                                                    fontSize: '0.875rem',
                                                    color: 'white'
                                                }}>
                                                    {getInitials(user.name)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 500, color: 'var(--admin-text-primary)' }}>
                                                        {user.name}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                                                        ID: {user._id.slice(-8).toUpperCase()}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <a
                                                href={`mailto:${user.email}`}
                                                style={{ color: 'var(--admin-accent-primary)', textDecoration: 'none' }}
                                            >
                                                {user.email}
                                            </a>
                                        </td>
                                        <td>
                                            {user.isAdmin ? (
                                                <span className="admin-badge admin-badge-purple">
                                                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ marginRight: '4px' }}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                    </svg>
                                                    Admin
                                                </span>
                                            ) : (
                                                <span className="admin-badge admin-badge-info">Customer</span>
                                            )}
                                        </td>
                                        <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem' }}>
                                            {formatDate(user.createdAt)}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="admin-btn admin-btn-secondary admin-btn-sm"
                                                    onClick={() => openEditModal(user)}
                                                    title="Edit User"
                                                >
                                                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                {!user.isAdmin && (
                                                    <button
                                                        className="admin-btn admin-btn-danger admin-btn-sm"
                                                        onClick={() => handleDelete(user._id, user.name)}
                                                        title="Delete User"
                                                    >
                                                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
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

            {showModal && (
                <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                        <div className="admin-modal-header">
                            <h3 className="admin-modal-title">Edit User</h3>
                            <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="admin-modal-body" style={{ padding: '1.25rem' }}>
                                {/* User Avatar - Compact */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    marginBottom: '1.25rem',
                                    paddingBottom: '1rem',
                                    borderBottom: '1px solid var(--admin-border)'
                                }}>
                                    <div style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '50%',
                                        background: getRandomColor(editingUser?.name || ''),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                        fontSize: '1.25rem',
                                        color: 'white',
                                        flexShrink: 0
                                    }}>
                                        {getInitials(editingUser?.name || '')}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '2px' }}>
                                            {editingUser?.name}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                                            ID: {editingUser?._id?.slice(-8).toUpperCase()}
                                        </div>
                                    </div>
                                </div>

                                <div className="admin-form-group" style={{ marginBottom: '1rem' }}>
                                    <label className="admin-label">Full Name</label>
                                    <input
                                        type="text"
                                        className="admin-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        style={{ padding: '0.75rem 1rem' }}
                                    />
                                </div>

                                <div className="admin-form-group" style={{ marginBottom: '1rem' }}>
                                    <label className="admin-label">Email Address</label>
                                    <input
                                        type="email"
                                        className="admin-input"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        style={{ padding: '0.75rem 1rem' }}
                                    />
                                </div>

                                <div className="admin-form-group" style={{ marginBottom: formData.isAdmin ? '1rem' : '0' }}>
                                    <label className="admin-label" style={{ marginBottom: '0.5rem' }}>Administrator Access</label>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem 1rem',
                                        background: 'var(--admin-bg-tertiary)',
                                        borderRadius: 'var(--admin-radius-md)',
                                        border: '1px solid var(--admin-border)',
                                        cursor: 'pointer'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.isAdmin}
                                            onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                                            style={{ display: 'none' }}
                                        />
                                        <span style={{
                                            width: '44px',
                                            height: '24px',
                                            backgroundColor: formData.isAdmin ? '#8b5cf6' : '#4b5563',
                                            borderRadius: '12px',
                                            position: 'relative',
                                            transition: 'background-color 0.2s ease',
                                            flexShrink: 0,
                                            display: 'inline-block'
                                        }}>
                                            <span style={{
                                                position: 'absolute',
                                                top: '2px',
                                                left: formData.isAdmin ? '22px' : '2px',
                                                width: '20px',
                                                height: '20px',
                                                backgroundColor: 'white',
                                                borderRadius: '50%',
                                                transition: 'left 0.2s ease',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                            }}></span>
                                        </span>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--admin-text-primary)', fontWeight: 500 }}>
                                            {formData.isAdmin ? 'Admin Enabled' : 'Customer Account'}
                                        </span>
                                    </label>
                                </div>

                                {formData.isAdmin && (
                                    <div style={{
                                        background: 'rgba(245, 158, 11, 0.1)',
                                        border: '1px solid rgba(245, 158, 11, 0.3)',
                                        borderRadius: 'var(--admin-radius-md)',
                                        padding: '0.75rem 1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem'
                                    }}>
                                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" style={{ flexShrink: 0 }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>
                                            Admins have full access to products, orders & users.
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="admin-modal-footer" style={{ padding: '1rem 1.25rem' }}>
                                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : 'Update User'}
                                </button>
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
        </AdminLayout>
    );
};

export default Users;

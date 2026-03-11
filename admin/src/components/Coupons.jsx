import React, { useState, useEffect, useCallback } from 'react'
import {
    getAdminCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCouponStatus,
} from '../services/api'
import AdminLayout from './AdminLayout'

const DEFAULT_FORM = {
    couponCode: '',
    discountType: 'percentage',
    discountValue: '',
    minimumPurchaseAmount: '',
    expiryDate: '',
    usageLimit: 100,
    status: 'active',
    description: '',
}

const Coupons = () => {
    const [coupons, setCoupons] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [editingCoupon, setEditingCoupon] = useState(null)
    const [form, setForm] = useState(DEFAULT_FORM)
    const [formError, setFormError] = useState(null)
    const [formLoading, setFormLoading] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [successMsg, setSuccessMsg] = useState(null)

    const showSuccess = (msg) => {
        setSuccessMsg(msg)
        setTimeout(() => setSuccessMsg(null), 3000)
    }

    const fetchCoupons = useCallback(async () => {
        try {
            setLoading(true)
            const { data } = await getAdminCoupons()
            setCoupons(data.coupons || [])
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load coupons')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCoupons()
    }, [fetchCoupons])

    const openCreateModal = () => {
        setEditingCoupon(null)
        setForm(DEFAULT_FORM)
        setFormError(null)
        setShowModal(true)
    }

    const openEditModal = (coupon) => {
        setEditingCoupon(coupon)
        setForm({
            couponCode: coupon.couponCode,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            minimumPurchaseAmount: coupon.minimumPurchaseAmount,
            expiryDate: coupon.expiryDate ? coupon.expiryDate.slice(0, 10) : '',
            usageLimit: coupon.usageLimit,
            status: coupon.status,
            description: coupon.description || '',
        })
        setFormError(null)
        setShowModal(true)
    }

    const handleFormChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const validateForm = () => {
        if (!form.couponCode.trim()) return 'Coupon code is required'
        if (!form.discountValue || Number(form.discountValue) <= 0) return 'Discount value must be positive'
        if (form.discountType === 'percentage' && Number(form.discountValue) > 100) return 'Percentage discount cannot exceed 100%'
        if (!form.expiryDate) return 'Expiry date is required'
        if (new Date(form.expiryDate) <= new Date()) return 'Expiry date must be in the future'
        if (!form.usageLimit || Number(form.usageLimit) < 1) return 'Usage limit must be at least 1'
        return null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const validationError = validateForm()
        if (validationError) { setFormError(validationError); return }

        setFormLoading(true)
        setFormError(null)
        try {
            const payload = {
                ...form,
                discountValue: Number(form.discountValue),
                minimumPurchaseAmount: Number(form.minimumPurchaseAmount) || 0,
                usageLimit: Number(form.usageLimit),
            }
            if (editingCoupon) {
                await updateCoupon(editingCoupon._id, payload)
                showSuccess('Coupon updated successfully!')
            } else {
                await createCoupon(payload)
                showSuccess('Coupon created successfully!')
            }
            setShowModal(false)
            fetchCoupons()
        } catch (err) {
            setFormError(err.response?.data?.message || 'An error occurred')
        } finally {
            setFormLoading(false)
        }
    }

    const handleToggle = async (id) => {
        try {
            await toggleCouponStatus(id)
            fetchCoupons()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update status')
        }
    }

    const handleDelete = async (id) => {
        try {
            await deleteCoupon(id)
            setDeleteConfirm(null)
            showSuccess('Coupon deleted successfully!')
            fetchCoupons()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete coupon')
        }
    }

    const isExpired = (date) => new Date(date) < new Date()

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
        })
    }

    const getStatusBadge = (coupon) => {
        if (coupon.status === 'inactive') {
            return <span style={styles.badge('inactive')}>Inactive</span>
        }
        if (isExpired(coupon.expiryDate)) {
            return <span style={styles.badge('expired')}>Expired</span>
        }
        if (coupon.usedCount >= coupon.usageLimit) {
            return <span style={styles.badge('exhausted')}>Limit Reached</span>
        }
        return <span style={styles.badge('active')}>Active</span>
    }

    return (
        <AdminLayout>
            <div style={{ padding: '1.5rem 2rem', maxWidth: '1200px' }}>
                {/* Page Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--admin-text-primary)' }}>
                            🎟️ Coupon Management
                        </h1>
                        <p style={{ margin: '0.25rem 0 0', color: 'var(--admin-text-muted)', fontSize: '0.9rem' }}>
                            Create and manage discount coupons for your store
                        </p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        style={styles.primaryBtn}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                        + Create Coupon
                    </button>
                </div>

                {/* Success Message */}
                {successMsg && (
                    <div style={styles.successAlert}>
                        ✅ {successMsg}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={styles.errorAlert}>
                        ⚠️ {error}
                        <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
                    </div>
                )}

                {/* Stats Row */}
                {!loading && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                        {[
                            { label: 'Total Coupons', value: coupons.length, color: '#6366f1' },
                            { label: 'Active', value: coupons.filter(c => c.status === 'active' && !isExpired(c.expiryDate)).length, color: '#10b981' },
                            { label: 'Inactive', value: coupons.filter(c => c.status === 'inactive').length, color: '#f59e0b' },
                            { label: 'Expired', value: coupons.filter(c => isExpired(c.expiryDate)).length, color: '#ef4444' },
                        ].map(stat => (
                            <div key={stat.label} style={{
                                background: 'var(--admin-bg-secondary)',
                                borderRadius: '12px',
                                padding: '1.25rem 1.5rem',
                                border: '1px solid var(--admin-border)',
                                borderLeft: `4px solid ${stat.color}`,
                            }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginTop: '0.25rem' }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Coupons Table */}
                <div style={styles.card}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--admin-text-muted)' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                            Loading coupons...
                        </div>
                    ) : coupons.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--admin-text-muted)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎟️</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.5rem' }}>No Coupons Yet</div>
                            <div style={{ fontSize: '0.85rem' }}>Click "Create Coupon" to add your first discount code.</div>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={styles.table}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--admin-border)' }}>
                                        {['Code', 'Discount', 'Min. Purchase', 'Usage', 'Expiry', 'Status', 'Actions'].map(h => (
                                            <th key={h} style={styles.th}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {coupons.map((coupon) => (
                                        <tr key={coupon._id} style={styles.tr}>
                                            <td style={styles.td}>
                                                <div style={{ fontWeight: 600, fontSize: '0.95rem', letterSpacing: '0.05em', color: 'var(--admin-accent)' }}>
                                                    {coupon.couponCode}
                                                </div>
                                                {coupon.description && (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
                                                        {coupon.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={styles.td}>
                                                <span style={{
                                                    background: coupon.discountType === 'percentage' ? '#ede9fe' : '#fef3c7',
                                                    color: coupon.discountType === 'percentage' ? '#7c3aed' : '#92400e',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '99px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 600,
                                                }}>
                                                    {coupon.discountType === 'percentage'
                                                        ? `${coupon.discountValue}% OFF`
                                                        : `₹${coupon.discountValue} OFF`}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={{ color: 'var(--admin-text-secondary)' }}>
                                                    {coupon.minimumPurchaseAmount > 0
                                                        ? `₹${coupon.minimumPurchaseAmount.toLocaleString()}`
                                                        : '—'}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={{ fontSize: '0.875rem' }}>
                                                    <span style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>{coupon.usedCount}</span>
                                                    <span style={{ color: 'var(--admin-text-muted)' }}> / {coupon.usageLimit}</span>
                                                </div>
                                                <div style={{
                                                    marginTop: '4px',
                                                    height: '4px',
                                                    background: 'var(--admin-border)',
                                                    borderRadius: '2px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: `${Math.min((coupon.usedCount / coupon.usageLimit) * 100, 100)}%`,
                                                        background: coupon.usedCount >= coupon.usageLimit ? '#ef4444' : '#6366f1',
                                                        borderRadius: '2px',
                                                        transition: 'width 0.3s'
                                                    }} />
                                                </div>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={{
                                                    color: isExpired(coupon.expiryDate) ? '#ef4444' : 'var(--admin-text-secondary)',
                                                    fontWeight: isExpired(coupon.expiryDate) ? 600 : 400,
                                                    fontSize: '0.85rem',
                                                }}>
                                                    {formatDate(coupon.expiryDate)}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                {getStatusBadge(coupon)}
                                            </td>
                                            <td style={styles.td}>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    {/* Toggle Button */}
                                                    <button
                                                        onClick={() => handleToggle(coupon._id)}
                                                        title={coupon.status === 'active' ? 'Deactivate' : 'Activate'}
                                                        style={{
                                                            ...styles.iconBtn,
                                                            background: coupon.status === 'active' ? '#fef3c7' : '#d1fae5',
                                                            color: coupon.status === 'active' ? '#92400e' : '#065f46',
                                                        }}
                                                    >
                                                        {coupon.status === 'active' ? '⏸' : '▶'}
                                                    </button>
                                                    {/* Edit Button */}
                                                    <button
                                                        onClick={() => openEditModal(coupon)}
                                                        style={{ ...styles.iconBtn, background: '#ede9fe', color: '#6d28d9' }}
                                                        title="Edit"
                                                    >
                                                        ✏️
                                                    </button>
                                                    {/* Delete Button */}
                                                    <button
                                                        onClick={() => setDeleteConfirm(coupon._id)}
                                                        style={{ ...styles.iconBtn, background: '#fee2e2', color: '#b91c1c' }}
                                                        title="Delete"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Create / Edit Modal */}
                {showModal && (
                    <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
                        <div style={styles.modal} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                                    {editingCoupon ? '✏️ Edit Coupon' : '🎟️ Create New Coupon'}
                                </h2>
                                <button onClick={() => setShowModal(false)} style={{ ...styles.iconBtn, fontSize: '1.1rem' }}>✕</button>
                            </div>

                            {formError && (
                                <div style={{ ...styles.errorAlert, marginBottom: '1rem' }}>{formError}</div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div style={styles.formGrid}>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Coupon Code *</label>
                                        <input
                                            name="couponCode"
                                            value={form.couponCode}
                                            onChange={handleFormChange}
                                            placeholder="e.g. FESTIVE10"
                                            style={{ ...styles.input, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                            required
                                        />
                                    </div>

                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Discount Type *</label>
                                        <select name="discountType" value={form.discountType} onChange={handleFormChange} style={styles.input}>
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed Amount (₹)</option>
                                        </select>
                                    </div>

                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>
                                            Discount Value * {form.discountType === 'percentage' ? '(%)' : '(₹)'}
                                        </label>
                                        <input
                                            type="number"
                                            name="discountValue"
                                            value={form.discountValue}
                                            onChange={handleFormChange}
                                            placeholder={form.discountType === 'percentage' ? '10' : '500'}
                                            min="0"
                                            max={form.discountType === 'percentage' ? '100' : undefined}
                                            style={styles.input}
                                            required
                                        />
                                    </div>

                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Minimum Purchase Amount (₹)</label>
                                        <input
                                            type="number"
                                            name="minimumPurchaseAmount"
                                            value={form.minimumPurchaseAmount}
                                            onChange={handleFormChange}
                                            placeholder="0 (no minimum)"
                                            min="0"
                                            style={styles.input}
                                        />
                                    </div>

                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Expiry Date *</label>
                                        <input
                                            type="date"
                                            name="expiryDate"
                                            value={form.expiryDate}
                                            onChange={handleFormChange}
                                            min={new Date().toISOString().slice(0, 10)}
                                            style={styles.input}
                                            required
                                        />
                                    </div>

                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Usage Limit *</label>
                                        <input
                                            type="number"
                                            name="usageLimit"
                                            value={form.usageLimit}
                                            onChange={handleFormChange}
                                            min="1"
                                            style={styles.input}
                                            required
                                        />
                                    </div>

                                    <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                                        <label style={styles.label}>Description (optional)</label>
                                        <input
                                            name="description"
                                            value={form.description}
                                            onChange={handleFormChange}
                                            placeholder="e.g. Festival season special offer"
                                            style={styles.input}
                                        />
                                    </div>

                                    <div style={{ ...styles.formGroup }}>
                                        <label style={styles.label}>Status</label>
                                        <select name="status" value={form.status} onChange={handleFormChange} style={styles.input}>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                                    <button type="button" onClick={() => setShowModal(false)} style={styles.secondaryBtn}>
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={formLoading} style={styles.primaryBtn}>
                                        {formLoading ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirm Modal */}
                {deleteConfirm && (
                    <div style={styles.modalOverlay} onClick={() => setDeleteConfirm(null)}>
                        <div style={{ ...styles.modal, maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
                            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗑️</div>
                                <h3 style={{ margin: '0 0 0.5rem', color: 'var(--admin-text-primary)', fontWeight: 700 }}>Delete Coupon?</h3>
                                <p style={{ color: 'var(--admin-text-muted)', margin: '0 0 1.5rem' }}>
                                    This action cannot be undone. The coupon will be permanently deleted.
                                </p>
                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                                    <button onClick={() => setDeleteConfirm(null)} style={styles.secondaryBtn}>Cancel</button>
                                    <button
                                        onClick={() => handleDelete(deleteConfirm)}
                                        style={{ ...styles.primaryBtn, background: '#ef4444' }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}

// Styles object
const styles = {
    card: {
        background: 'var(--admin-bg-secondary)',
        borderRadius: '16px',
        border: '1px solid var(--admin-border)',
        overflow: 'hidden',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.875rem',
    },
    th: {
        padding: '0.875rem 1rem',
        textAlign: 'left',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--admin-text-muted)',
        background: 'var(--admin-bg-tertiary)',
    },
    td: {
        padding: '0.875rem 1rem',
        borderBottom: '1px solid var(--admin-border)',
        color: 'var(--admin-text-primary)',
        verticalAlign: 'middle',
    },
    tr: {
        transition: 'background 0.15s',
    },
    primaryBtn: {
        background: 'var(--admin-accent-gradient)',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        padding: '0.625rem 1.25rem',
        fontWeight: 600,
        fontSize: '0.875rem',
        cursor: 'pointer',
        transition: 'opacity 0.2s',
    },
    secondaryBtn: {
        background: 'var(--admin-bg-tertiary)',
        color: 'var(--admin-text-primary)',
        border: '1px solid var(--admin-border)',
        borderRadius: '8px',
        padding: '0.625rem 1.25rem',
        fontWeight: 600,
        fontSize: '0.875rem',
        cursor: 'pointer',
    },
    iconBtn: {
        border: 'none',
        borderRadius: '6px',
        padding: '0.35rem 0.5rem',
        cursor: 'pointer',
        fontSize: '0.9rem',
        background: 'var(--admin-bg-tertiary)',
        color: 'var(--admin-text-primary)',
        transition: 'opacity 0.15s',
    },
    badge: (type) => {
        const map = {
            active: { bg: '#d1fae5', color: '#065f46' },
            inactive: { bg: '#f3f4f6', color: '#6b7280' },
            expired: { bg: '#fee2e2', color: '#b91c1c' },
            exhausted: { bg: '#fef3c7', color: '#92400e' },
        }
        const { bg, color } = map[type] || map.active
        return {
            background: bg,
            color,
            padding: '0.2rem 0.65rem',
            borderRadius: '99px',
            fontSize: '0.75rem',
            fontWeight: 600,
        }
    },
    modalOverlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
    },
    modal: {
        background: 'var(--admin-bg-secondary)',
        borderRadius: '16px',
        border: '1px solid var(--admin-border)',
        padding: '2rem',
        width: '100%',
        maxWidth: '640px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.375rem',
    },
    label: {
        fontSize: '0.8rem',
        fontWeight: 600,
        color: 'var(--admin-text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
    },
    input: {
        width: '100%',
        padding: '0.625rem 0.875rem',
        border: '1px solid var(--admin-border)',
        borderRadius: '8px',
        background: 'var(--admin-bg-tertiary)',
        color: 'var(--admin-text-primary)',
        fontSize: '0.875rem',
        outline: 'none',
        boxSizing: 'border-box',
    },
    successAlert: {
        background: '#d1fae5',
        color: '#065f46',
        border: '1px solid #6ee7b7',
        borderRadius: '8px',
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
        fontSize: '0.875rem',
        fontWeight: 500,
    },
    errorAlert: {
        background: '#fee2e2',
        color: '#b91c1c',
        border: '1px solid #fca5a5',
        borderRadius: '8px',
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
}

export default Coupons

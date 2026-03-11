import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { getMyOrders, getUserAddresses, addUserAddress, updateUserAddress, deleteUserAddress } from '../services/api';
import { generateInvoice } from '../utils/invoiceGenerator';
import Loader from '../components/Loader';
import {
    User,
    Package,
    Heart,
    LogOut,
    Settings,
    Eye,
    Truck,
    CheckCircle,
    Clock,
    XCircle,
    ChevronRight,
    ShoppingBag,
    Download,
    MapPin,
    Plus,
    Edit2,
    Trash2,
    Phone,
    Home
} from 'lucide-react';

const Profile = () => {
    const navigate = useNavigate();
    const { user, logout, wishlist } = useContext(ShopContext);
    const [activeTab, setActiveTab] = useState('profile');
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [ordersError, setOrdersError] = useState(null);
    
    // Address management state
    const [addresses, setAddresses] = useState([]);
    const [loadingAddresses, setLoadingAddresses] = useState(false);
    const [addressesError, setAddressesError] = useState(null);
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [addressForm, setAddressForm] = useState({
        fullName: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        isDefault: false
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    // Fetch orders when orders tab is active
    useEffect(() => {
        if (activeTab === 'orders' && user) {
            fetchOrders();
        }
    }, [activeTab, user]);

    // Fetch addresses when addresses tab is active
    useEffect(() => {
        if (activeTab === 'addresses' && user) {
            fetchAddresses();
        }
    }, [activeTab, user]);

    const fetchOrders = async () => {
        setLoadingOrders(true);
        setOrdersError(null);
        try {
            const { data } = await getMyOrders();
            setOrders(data);
        } catch (error) {
            setOrdersError('Failed to fetch orders. Please try again.');
            console.error('Error fetching orders:', error);
        } finally {
            setLoadingOrders(false);
        }
    };

    const fetchAddresses = async () => {
        console.log('[Profile] Fetching addresses...');
        setLoadingAddresses(true);
        setAddressesError(null);
        try {
            const { data } = await getUserAddresses();
            console.log('[Profile] Addresses fetched successfully:', data);
            setAddresses(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('[Profile] Error fetching addresses:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                fullError: error
            });
            const errorMessage = error.response?.data?.message || 'Failed to fetch addresses. Please try again.';
            setAddressesError(errorMessage);
        } finally {
            setLoadingAddresses(false);
        }
    };

    const handleAddressFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setAddressForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAddAddress = () => {
        setIsAddingAddress(true);
        setEditingAddressId(null);
        setAddressForm({
            fullName: user?.name || '',
            phone: '',
            address: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'India',
            isDefault: addresses.length === 0
        });
    };

    const handleEditAddress = (addr) => {
        setIsAddingAddress(true);
        setEditingAddressId(addr._id);
        setAddressForm({
            fullName: addr.fullName,
            phone: addr.phone,
            address: addr.address,
            city: addr.city,
            state: addr.state,
            postalCode: addr.postalCode,
            country: addr.country,
            isDefault: addr.isDefault
        });
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        try {
            if (editingAddressId) {
                await updateUserAddress(editingAddressId, addressForm);
            } else {
                await addUserAddress(addressForm);
            }
            await fetchAddresses();
            setIsAddingAddress(false);
            setEditingAddressId(null);
        } catch (error) {
            console.error('Error saving address:', error);
            alert('Failed to save address. Please try again.');
        }
    };

    const handleDeleteAddress = async (id) => {
        if (window.confirm('Are you sure you want to delete this address?')) {
            try {
                await deleteUserAddress(id);
                await fetchAddresses();
            } catch (error) {
                console.error('Error deleting address:', error);
                alert('Failed to delete address. Please try again.');
            }
        }
    };

    const handleCancelAddressForm = () => {
        setIsAddingAddress(false);
        setEditingAddressId(null);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'confirmed':
                return <CheckCircle className="text-green-500" size={16} />;
            case 'processing':
                return <Package className="text-blue-500" size={16} />;
            case 'shipped':
                return <Truck className="text-purple-500" size={16} />;
            case 'delivered':
                return <CheckCircle className="text-green-600" size={16} />;
            case 'cancelled':
                return <XCircle className="text-red-500" size={16} />;
            default:
                return <Clock className="text-orange-500" size={16} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed':
                return 'bg-green-100 text-green-700';
            case 'processing':
                return 'bg-blue-100 text-blue-700';
            case 'shipped':
                return 'bg-purple-100 text-purple-700';
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-orange-100 text-orange-700';
        }
    };

    if (!user) {
        return null;
    }

    return (
        <div className="bg-gray-50 dark:bg-slate-950 min-h-screen pt-24 md:pt-32 pb-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-8">My Account</h1>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="w-full lg:w-64 shrink-0">
                        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 bg-linear-to-br from-primary to-primary/70 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                    <User size={32} className="text-white" />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">{user.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                {user.isAdmin && (
                                    <span className="inline-block mt-2 px-3 py-1 bg-secondary/20 text-secondary text-xs font-medium rounded-full">
                                        Admin
                                    </span>
                                )}
                            </div>

                            <nav className="space-y-2">
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === 'profile'
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <User size={18} className="mr-3" />
                                    Profile Details
                                </button>
                                <button
                                    onClick={() => setActiveTab('orders')}
                                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === 'orders'
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <Package size={18} className="mr-3" />
                                    My Orders
                                    {orders.length > 0 && (
                                        <span className="ml-auto bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
                                            {orders.length}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('addresses')}
                                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === 'addresses'
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <MapPin size={18} className="mr-3" />
                                    Saved Addresses
                                    {addresses.length > 0 && (
                                        <span className="ml-auto bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
                                            {addresses.length}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('wishlist')}
                                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === 'wishlist'
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <Heart size={18} className="mr-3" />
                                    Wishlist
                                    {wishlist?.length > 0 && (
                                        <span className="ml-auto bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                                            {wishlist.length}
                                        </span>
                                    )}
                                </button>
                                {user.isAdmin && (
                                    <Link
                                        to="/admin"
                                        className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                                    >
                                        <Settings size={18} className="mr-3" />
                                        Admin Dashboard
                                    </Link>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-all"
                                >
                                    <LogOut size={18} className="mr-3" />
                                    Logout
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
                            {activeTab === 'profile' && (
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Profile Details</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                                            <input
                                                type="text"
                                                value={user.name}
                                                readOnly
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                                            <input
                                                type="email"
                                                value={user.email}
                                                readOnly
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Account Status</h3>
                                        <div className="flex items-center text-green-600">
                                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                            <span className="text-sm font-medium">Active</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'orders' && (
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">My Orders</h2>

                                    {loadingOrders ? (
                                        <Loader text="Loading your orders..." />
                                    ) : ordersError ? (
                                        <div className="text-center py-12">
                                            <XCircle size={48} className="mx-auto text-red-300 mb-4" />
                                            <p className="text-red-600 mb-4">{ordersError}</p>
                                            <button onClick={fetchOrders} className="btn-primary">
                                                Try Again
                                            </button>
                                        </div>
                                    ) : orders.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Package size={48} className="mx-auto text-gray-300 mb-4" />
                                            <p className="text-gray-500 mb-2">No orders yet</p>
                                            <p className="text-sm text-gray-400 mb-4">Start shopping to see your orders here</p>
                                            <Link to="/products" className="btn-primary inline-block">
                                                Start Shopping
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {orders.map((order) => (
                                                <div
                                                    key={order._id}
                                                    className="border border-gray-100 dark:border-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow"
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                                                        <div>
                                                            <p className="text-sm text-gray-500">Order ID</p>
                                                            <p className="font-mono font-medium text-gray-900">
                                                                #{order._id.slice(-8).toUpperCase()}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500">Order Date</p>
                                                            <p className="font-medium text-gray-900">
                                                                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric'
                                                                })}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500">Total Amount</p>
                                                            <p className="font-bold text-primary">
                                                                ₹{order.totalPrice?.toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {getStatusIcon(order.orderStatus)}
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.orderStatus)}`}>
                                                                {order.orderStatus}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Order Items Preview */}
                                                    <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                                                        <div className="flex -space-x-3">
                                                            {order.orderItems?.slice(0, 3).map((item, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="w-12 h-12 rounded-lg border-2 border-white overflow-hidden bg-gray-100 shadow-sm"
                                                                >
                                                                    <img
                                                                        src={item.image}
                                                                        alt={item.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            ))}
                                                            {order.orderItems?.length > 3 && (
                                                                <div className="w-12 h-12 rounded-lg border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 shadow-sm">
                                                                    +{order.orderItems.length - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 text-sm text-gray-600">
                                                            {order.orderItems?.length} item{order.orderItems?.length > 1 ? 's' : ''}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {order.isPaid ? (
                                                                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                                                                    <CheckCircle size={12} />
                                                                    Paid
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full flex items-center gap-1">
                                                                    <Clock size={12} />
                                                                    Pending
                                                                </span>
                                                            )}
                                                            <Link
                                                                to={`/track-order?orderId=${order._id.slice(-8).toUpperCase()}`}
                                                                className="ml-2 p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                                title="Track Order"
                                                            >
                                                                <Truck size={18} />
                                                            </Link>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    generateInvoice(order);
                                                                }}
                                                                className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                                                                title="Download Invoice"
                                                            >
                                                                <Download size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'addresses' && (
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Saved Addresses</h2>
                                        {!isAddingAddress && (
                                            <button
                                                onClick={handleAddAddress}
                                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                                            >
                                                <Plus size={18} />
                                                Add New Address
                                            </button>
                                        )}
                                    </div>

                                    {loadingAddresses ? (
                                        <Loader text="Loading addresses..." />
                                    ) : addressesError ? (
                                        <div className="text-center py-12">
                                            <XCircle size={48} className="mx-auto text-red-300 mb-4" />
                                            <p className="text-red-600 mb-4">{addressesError}</p>
                                            <button onClick={fetchAddresses} className="btn-primary">
                                                Try Again
                                            </button>
                                        </div>
                                    ) : isAddingAddress ? (
                                        <form onSubmit={handleSaveAddress} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                                {editingAddressId ? 'Edit Address' : 'Add New Address'}
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                                                    <input
                                                        type="text"
                                                        name="fullName"
                                                        value={addressForm.fullName}
                                                        onChange={handleAddressFormChange}
                                                        required
                                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                        placeholder="Enter full name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number *</label>
                                                    <input
                                                        type="tel"
                                                        name="phone"
                                                        value={addressForm.phone}
                                                        onChange={handleAddressFormChange}
                                                        required
                                                        maxLength={10}
                                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                        placeholder="10-digit mobile number"
                                                    />
                                                </div>
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address *</label>
                                                <textarea
                                                    name="address"
                                                    value={addressForm.address}
                                                    onChange={handleAddressFormChange}
                                                    required
                                                    rows={3}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                                    placeholder="House No., Building, Street, Area"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City *</label>
                                                    <input
                                                        type="text"
                                                        name="city"
                                                        value={addressForm.city}
                                                        onChange={handleAddressFormChange}
                                                        required
                                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                        placeholder="City"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State *</label>
                                                    <input
                                                        type="text"
                                                        name="state"
                                                        value={addressForm.state}
                                                        onChange={handleAddressFormChange}
                                                        required
                                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                        placeholder="State"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PIN Code *</label>
                                                    <input
                                                        type="text"
                                                        name="postalCode"
                                                        value={addressForm.postalCode}
                                                        onChange={handleAddressFormChange}
                                                        required
                                                        maxLength={6}
                                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                        placeholder="6-digit PIN"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mb-6">
                                                <input
                                                    type="checkbox"
                                                    id="isDefault"
                                                    name="isDefault"
                                                    checked={addressForm.isDefault}
                                                    onChange={handleAddressFormChange}
                                                    className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                                                />
                                                <label htmlFor="isDefault" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Set as default address
                                                </label>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    type="submit"
                                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                                                >
                                                    {editingAddressId ? 'Update Address' : 'Save Address'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleCancelAddressForm}
                                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    ) : addresses.length === 0 ? (
                                        <div className="text-center py-12">
                                            <MapPin size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                            <p className="text-gray-500 dark:text-gray-400 mb-2">No saved addresses</p>
                                            <p className="text-sm text-gray-400 mb-4">Add an address to save time during checkout</p>
                                            <button onClick={handleAddAddress} className="btn-primary inline-flex items-center gap-2">
                                                <Plus size={18} />
                                                Add Address
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {addresses.map((addr) => (
                                                <div
                                                    key={addr._id}
                                                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <Home size={18} className="text-primary" />
                                                            <h3 className="font-bold text-gray-900 dark:text-white">{addr.fullName}</h3>
                                                        </div>
                                                        {addr.isDefault && (
                                                            <span className="text-xs font-bold uppercase tracking-wider bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">
                                                                Default
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-gray-600 dark:text-gray-400 text-sm space-y-1 mb-4">
                                                        <p>{addr.address}</p>
                                                        <p>{addr.city}, {addr.state} - {addr.postalCode}</p>
                                                        <div className="flex items-center gap-2 mt-2 text-gray-700 dark:text-gray-300">
                                                            <Phone size={14} />
                                                            <span className="font-medium">{addr.phone}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                                                        <button
                                                            onClick={() => handleEditAddress(addr)}
                                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                        >
                                                            <Edit2 size={16} />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAddress(addr._id)}
                                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'wishlist' && (
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-6">My Wishlist</h2>
                                    {!wishlist || wishlist.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Heart size={48} className="mx-auto text-gray-300 mb-4" />
                                            <p className="text-gray-500 mb-2">Your wishlist is empty</p>
                                            <p className="text-sm text-gray-400 mb-4">Save items you love for later</p>
                                            <Link to="/products" className="btn-primary inline-block">
                                                Browse Products
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {wishlist.map((item) => (
                                                <Link
                                                    key={item._id}
                                                    to={`/product/${item._id}`}
                                                    className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg hover:shadow-md transition-all group"
                                                >
                                                    <div className="w-20 h-24 bg-gray-100 rounded-md overflow-hidden shrink-0">
                                                        <img
                                                            src={item.image || item.images?.[0]}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-medium text-gray-900 truncate group-hover:text-primary transition-colors">
                                                            {item.name}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">{item.category}</p>
                                                        <p className="font-bold text-primary mt-1">
                                                            ₹{item.price?.toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="text-gray-400 group-hover:text-primary transition-colors" size={20} />
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;

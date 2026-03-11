import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Token getter function - will be set by ShopContext
let tokenGetter = null;
let isClerkReady = false;

export const setTokenGetter = (getter) => {
    tokenGetter = getter;
    isClerkReady = true;
    console.log('[API] TokenGetter set, Clerk is ready');
};

// Add token to requests - fetch fresh token each time
API.interceptors.request.use(async (config) => {
    console.log('[API Interceptor] Making request to:', config.url);
    try {
        // If we have a token getter (from Clerk), use it to get a fresh token
        if (tokenGetter && typeof tokenGetter === 'function') {
            console.log('[API Interceptor] Using Clerk tokenGetter');
            const token = await tokenGetter();
            if (token) {
                console.log('[API Interceptor] Token obtained successfully');
                config.headers.Authorization = `Bearer ${token}`;
            } else {
                console.warn('[API Interceptor] Token getter returned null/undefined');
            }
        } else {
            console.log('[API Interceptor] No tokenGetter available (Clerk may not be initialized yet)');
            // Fallback to localStorage token
            const token = localStorage.getItem('token');
            if (token) {
                console.log('[API Interceptor] Using localStorage token as fallback');
                config.headers.Authorization = `Bearer ${token}`;
            } else {
                console.log('[API Interceptor] No token in localStorage either');
            }
        }
    } catch (error) {
        console.error('[API Interceptor] Error getting auth token:', error);
    }
    console.log('[API Interceptor] Final request - URL:', config.url, 'Has Auth:', !!config.headers.Authorization);
    return config;
});

// Legacy function - still works but tokenGetter is preferred
export const setAuthToken = (token) => {
    if (token) {
        localStorage.setItem('token', token);
    } else {
        localStorage.removeItem('token');
    }
};


// Auth APIs (Legacy/Email) - Clerk handles these now
export const getUserProfile = () => API.get('/users/profile');

// Address APIs
export const getUserAddresses = () => API.get('/users/addresses');
export const addUserAddress = (addressData) => API.post('/users/addresses', addressData);
export const updateUserAddress = (id, addressData) => API.put(`/users/addresses/${id}`, addressData);
export const deleteUserAddress = (id) => API.delete(`/users/addresses/${id}`);


// Product APIs
export const getProducts = () => API.get('/products');
export const getProductById = (id) => API.get(`/products/${id}`);

// ==================== ORDER & PAYMENT APIs ====================

// Stripe Configuration
export const getStripeConfig = () => API.get('/stripe/config');
export const createStripeCheckoutSession = (orderData) => API.post('/stripe/create-checkout-session', orderData);
export const verifyStripeSession = (sessionId, orderId) => API.post('/stripe/verify-session', { sessionId, orderId });

// Order APIs
export const createOrder = (orderData) => API.post('/orders', orderData);
export const getOrderById = (id) => API.get(`/orders/${id}`);
export const getMyOrders = () => API.get('/orders/myorders');
export const trackOrder = (data) => API.post('/orders/track', data);
export const cancelOrder = (orderId, reason) => API.put(`/orders/${orderId}/cancel`, { reason });

// ==================== ADMIN APIs ====================

// Dashboard
export const getAdminStats = () => API.get('/admin/stats');

// Products
export const getAdminProducts = (page = 1, limit = 10, keyword = '') =>
    API.get(`/admin/products?page=${page}&limit=${limit}&keyword=${keyword}`);
export const createProduct = (productData) => API.post('/admin/products', productData);
export const updateProduct = (id, productData) => API.put(`/admin/products/${id}`, productData);
export const deleteProduct = (id) => API.delete(`/admin/products/${id}`);

// Stock Management
export const getLowStockProducts = (threshold = 10) =>
    API.get(`/admin/products/lowstock?threshold=${threshold}`);
export const updateProductStock = (id, data) => API.put(`/admin/products/${id}/stock`, data);
export const bulkUpdateStock = (updates) => API.put('/admin/products/bulk-stock', { updates });

// Users
export const getAdminUsers = (page = 1, limit = 10) =>
    API.get(`/admin/users?page=${page}&limit=${limit}`);
export const getAdminUserById = (id) => API.get(`/admin/users/${id}`);
export const updateAdminUser = (id, userData) => API.put(`/admin/users/${id}`, userData);
export const deleteAdminUser = (id) => API.delete(`/admin/users/${id}`);

// Orders
export const getAdminOrders = (page = 1, limit = 10, status = '') =>
    API.get(`/admin/orders?page=${page}&limit=${limit}&status=${status}`);
export const getAdminOrderById = (id) => API.get(`/admin/orders/${id}`);
export const updateOrderToDelivered = (id) => API.put(`/admin/orders/${id}/deliver`);
export const updateOrderToPaid = (id, paymentData) => API.put(`/admin/orders/${id}/pay`, paymentData);
export const deleteOrder = (id) => API.delete(`/admin/orders/${id}`);

// ==================== COUPON APIs ====================
export const validateCoupon = (couponCode, orderTotal) => API.post('/coupons/validate', { couponCode, orderTotal });
export const getActiveCoupons = () => API.get('/coupons/active');


export default API;

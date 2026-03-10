import axios from 'axios'

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

// Store the getToken function globally
let getTokenFunction = null

export const setGetTokenFunction = (fn) => {
    getTokenFunction = fn
}

// Add token to requests - get fresh token each time
API.interceptors.request.use(async (config) => {
    if (getTokenFunction) {
        try {
            const token = await getTokenFunction()
            if (token) {
                config.headers.Authorization = `Bearer ${token}`
            }
        } catch (error) {
            console.error('Failed to get token:', error)
        }
    }
    return config
})

// Legacy function for backwards compatibility
export const setAuthToken = (token) => {
    if (token) {
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
        delete API.defaults.headers.common['Authorization']
    }
}

// Dashboard
export const getAdminStats = () => API.get('/admin/stats')

// Products
export const getAdminProducts = (page = 1, limit = 10, keyword = '') =>
    API.get(`/admin/products?page=${page}&limit=${limit}&keyword=${keyword}`)
export const createProduct = (productData) => API.post('/admin/products', productData)
export const updateProduct = (id, productData) => API.put(`/admin/products/${id}`, productData)
export const deleteProduct = (id) => API.delete(`/admin/products/${id}`)

// Stock Management
export const getLowStockProducts = (threshold = 10) =>
    API.get(`/admin/products/lowstock?threshold=${threshold}`)
export const updateProductStock = (id, data) => API.put(`/admin/products/${id}/stock`, data)
export const bulkUpdateStock = (updates) => API.put('/admin/products/bulk-stock', { updates })

// Users
export const getAdminUsers = (page = 1, limit = 10) =>
    API.get(`/admin/users?page=${page}&limit=${limit}`)
export const getAdminUserById = (id) => API.get(`/admin/users/${id}`)
export const updateAdminUser = (id, userData) => API.put(`/admin/users/${id}`, userData)
export const deleteAdminUser = (id) => API.delete(`/admin/users/${id}`)

// Orders
export const getAdminOrders = (page = 1, limit = 10, status = '') =>
    API.get(`/admin/orders?page=${page}&limit=${limit}&status=${status}`)
export const getAdminOrderById = (id) => API.get(`/admin/orders/${id}`)
export const updateOrderToDelivered = (id) => API.put(`/admin/orders/${id}/deliver`)
export const updateOrderToPaid = (id, paymentData) => API.put(`/admin/orders/${id}/pay`, paymentData)
export const deleteOrder = (id) => API.delete(`/admin/orders/${id}`)



export default API

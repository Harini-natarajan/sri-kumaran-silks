import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useUser, SignIn } from '@clerk/clerk-react'
import AdminLayout from './components/AdminLayout'
import Dashboard from './components/Dashboard'
import Products from './components/Products'
import StockManagement from './components/StockManagement'
import Users from './components/Users'
import Orders from './components/Orders'
import './components/Admin.css'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isSignedIn, isLoaded, user } = useUser()

    if (!isLoaded) {
        return (
            <div className="admin-loading">
                <div className="admin-spinner"></div>
                <p>Loading...</p>
            </div>
        )
    }

    if (!isSignedIn) {
        return (
            <div className="admin-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <SignIn routing="hash" />
            </div>
        )
    }

    // TODO: For production, uncomment the admin check below
    // and set isAdmin: true in Clerk Dashboard > User > Public Metadata
    // const isAdmin = user?.publicMetadata?.isAdmin === true
    // if (!isAdmin) { return AccessDenied component }

    // For now, allow any signed-in user
    return <>{children}</>
}



function App() {
    return (
        <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
            <Route path="/stock" element={<ProtectedRoute><StockManagement /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default App

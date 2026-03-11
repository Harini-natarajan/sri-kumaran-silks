import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AdminContext } from '../context/AdminContext';
import './Admin.css';


// Icons as SVG components for better maintainability
const Icons = {
    Dashboard: () => (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
        </svg>
    ),
    Products: () => (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
    ),
    Stock: () => (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
    ),
    Users: () => (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    Orders: () => (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
    ),
    Coupons: () => (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
    ),
    Logout: () => (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
    ),
    Home: () => (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    ),
    Menu: () => (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    )
};

const AdminLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useContext(AdminContext);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navItems = [
        { path: '/', label: 'Dashboard', icon: Icons.Dashboard },
        { path: '/products', label: 'Products', icon: Icons.Products },
        { path: '/stock', label: 'Stock Management', icon: Icons.Stock },
        { path: '/users', label: 'Users', icon: Icons.Users },
        { path: '/orders', label: 'Orders', icon: Icons.Orders },
        { path: '/coupons', label: 'Coupons', icon: Icons.Coupons },
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };


    return (
        <div className="admin-layout">
            {/* Mobile menu toggle */}
            <button
                className="admin-btn admin-btn-secondary admin-mobile-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                    position: 'fixed',
                    top: '1rem',
                    left: '1rem',
                    zIndex: 200,
                    display: 'none',
                    padding: '0.5rem'
                }}
            >
                <Icons.Menu />
            </button>

            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">K</div>
                    <span className="sidebar-title">Kumaran Admin</span>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-title">Main Menu</div>
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <item.icon />
                            {item.label}
                        </Link>
                    ))}

                    <div className="nav-section-title" style={{ marginTop: '1.5rem' }}>Other</div>
                    <a href="http://localhost:5173" className="nav-item" onClick={() => setSidebarOpen(false)}>
                        <Icons.Home />
                        Back to Store
                    </a>

                    <button className="nav-item" onClick={handleLogout}>
                        <Icons.Logout />
                        Logout
                    </button>
                </nav>

                {/* User info at bottom */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid var(--admin-border)',
                    background: 'var(--admin-bg-tertiary)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'var(--admin-accent-gradient)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: '1rem'
                        }}>
                            {user?.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div>
                            <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                                {user?.name || 'Admin User'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                                Administrator
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="admin-main">
                {children}
            </main>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 99
                    }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <style>{`
                @media (max-width: 1024px) {
                    .admin-mobile-toggle {
                        display: flex !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default AdminLayout;

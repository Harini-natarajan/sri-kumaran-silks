import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import { AdminContext } from './context/AdminContext';
import { useContext } from 'react';
import AdminLoginPage from './pages/AdminLoginPage';
import CategoriesPage from './pages/CategoriesPage';
import UsersPage from './pages/UsersPage';
import DashboardPage from './pages/DashboardPage';
import DiscountsOffersPage from './pages/DiscountsOffersPage';
import InventoryPage from './pages/InventoryPage';
import OrdersPage from './pages/OrdersPage';
import PaymentsPage from './pages/PaymentsPage';
import ProductsPage from './pages/ProductsPage';
import ReportsAnalyticsPage from './pages/ReportsAnalyticsPage';
import ReviewsRatingsPage from './pages/ReviewsRatingsPage';
import PromotionsPage from './pages/PromotionsPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useContext(AdminContext);

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-silk-maroon font-semibold">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLoginPage />} />
      <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/customers" element={<UsersPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/reviews-ratings" element={<ReviewsRatingsPage />} />
        <Route path="/reports-analytics" element={<ReportsAnalyticsPage />} />
        <Route path="/discounts-offers" element={<DiscountsOffersPage />} />
        <Route path="/promotions" element={<PromotionsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;

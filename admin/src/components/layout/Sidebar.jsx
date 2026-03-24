import React, { useContext } from 'react';
import {
  Boxes,
  ClipboardList,
  CreditCard,
  Gem,
  LayoutDashboard,
  LogOut,
  Package,
  Percent,
  ShoppingBag,
  Star,
  Tags,
  Users,
  Warehouse,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { AdminContext } from '../../context/AdminContext';

const menu = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Products', to: '/products', icon: ShoppingBag },
  { label: 'Categories', to: '/categories', icon: Tags },
  { label: 'Orders', to: '/orders', icon: ClipboardList },
  { label: 'Users', to: '/customers', icon: Users },
  { label: 'Inventory', to: '/inventory', icon: Warehouse },
  { label: 'Payments', to: '/payments', icon: CreditCard },
  { label: 'Reviews & Ratings', to: '/reviews-ratings', icon: Star },
  { label: 'Reports & Analytics', to: '/reports-analytics', icon: Boxes },
  { label: 'Discounts & Offers', to: '/discounts-offers', icon: Percent },
  { label: 'Store Promotions', to: '/promotions', icon: Gem },
];

function NavItem({ to, label, Icon, onClick, index }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.05)]'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className="transition-transform group-hover:scale-110" />
        <span>{label}</span>
      </div>
      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
    </NavLink>
  );
}

export default function Sidebar({ open, closeSidebar, onLogout }) {
  const { user } = useContext(AdminContext);
  
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <>
      {open && <button className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={closeSidebar} aria-label="Close sidebar" />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-72 flex-col bg-[#0c0b14] border-r border-white/5 transition-transform lg:static lg:inset-auto lg:h-screen lg:translate-x-0 lg:shrink-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">
              S
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-sm text-white leading-tight tracking-tight sm:text-base">SRI KUMARAN SILKS</p>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Admin Central</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 space-y-1.5 custom-scrollbar">
          <p className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Management</p>
          {menu.map((item, index) => (
            <NavItem key={item.to} to={item.to} label={item.label} Icon={item.icon} onClick={closeSidebar} index={index} />
          ))}
        </nav>

        {/* Footer Area */}
        <div className="p-4 bg-[#161521]/50 border-t border-white/5">
          {/* User Profile */}
          <div className="flex items-center gap-3 p-2 mb-4 hover:bg-white/5 rounded-xl transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-md">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.name || 'Admin User'}</p>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Administrator</p>
            </div>
            <LogOut 
                size={16} 
                onClick={onLogout}
                className="text-gray-500 hover:text-red-400 transition-colors"
            />
          </div>

          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); window.open('/', '_blank') }}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600/10 text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-600/20 transition-all border border-indigo-500/10"
          >
            <ExternalLink size={14} />
            Back to Store
          </a>
        </div>
      </aside>
    </>
  );
}

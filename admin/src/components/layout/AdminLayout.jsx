import React, { useContext, useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Star, Bell, X, Info, UserPlus, UserCog, PackagePlus } from 'lucide-react';
import { AdminContext } from '../../context/AdminContext';
import { useNotifications } from '../../context/NotificationContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import CommandPalette from './CommandPalette';

function NotificationToast({ notification, onDismiss }) {
    return (
        <div className="flex items-center gap-4 bg-[#1a1a2e] border border-white/10 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-right-full duration-500 mb-3 min-w-[320px] max-w-md group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                notification.type === 'order' ? 'bg-emerald-500/20 text-emerald-400' : 
                notification.type === 'review' ? 'bg-amber-500/20 text-amber-400' :
                notification.type === 'user' ? 'bg-blue-500/20 text-blue-400' :
                notification.type === 'update' ? 'bg-gray-500/20 text-gray-400' :
                'bg-indigo-500/20 text-indigo-400'
            }`}>
                {notification.type === 'order' ? <ShoppingBag size={20} /> : 
                 notification.type === 'review' ? <Star size={20} /> :
                 notification.type === 'user' ? <UserPlus size={20} /> :
                 notification.type === 'product' ? <PackagePlus size={20} /> :
                 notification.type === 'update' ? <UserCog size={20} /> :
                 <Info size={20} />}
            </div>
            <div className="flex-1 min-w-0 pr-2">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{notification.title}</h4>
                <p className="text-sm font-bold text-white truncate mb-0.5">{notification.message}</p>
                <p className="text-[10px] text-gray-500 font-medium italic">{notification.subtext}</p>
            </div>
            <button 
                onClick={onDismiss}
                className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                aria-label="Dismiss notification"
            >
                <X size={16} />
            </button>
            <div className="absolute bottom-0 left-0 h-1 bg-white/5 w-full">
                <div className="h-full bg-indigo-500/30 animate-[progress_5s_linear_forwards]"></div>
            </div>
            <style>{`
                @keyframes progress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useContext(AdminContext);
  const { toastNotifications, dismissToast } = useNotifications();

  useEffect(() => {
    const handleKeyDown = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setIsPaletteOpen(prev => !prev);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-transparent font-sans">
      <CommandPalette 
        isOpen={isPaletteOpen} 
        onClose={() => setIsPaletteOpen(false)} 
      />
      
      {/* Real-time Notifications Overlay */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col items-end pointer-events-none">
        {toastNotifications.map(notif => (
            <div key={notif.id} className="pointer-events-auto">
                <NotificationToast 
                    notification={notif} 
                    onDismiss={() => dismissToast(notif.id)} 
                />
            </div>
        ))}
      </div>

      <Sidebar
        open={sidebarOpen}
        closeSidebar={() => setSidebarOpen(false)}
        onLogout={() => {
          logout();
          setSidebarOpen(false);
          navigate('/login');
        }}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar 
            openSidebar={() => setSidebarOpen(true)} 
            openPalette={() => setIsPaletteOpen(true)} 
        />
        <main className="ambient-shell flex-1 overflow-y-auto overflow-x-hidden">
          <section key={location.pathname} className="route-enter min-w-0 p-3 pb-6 lg:p-6">
            <Outlet />
          </section>
        </main>
      </div>
    </div>
  );
}

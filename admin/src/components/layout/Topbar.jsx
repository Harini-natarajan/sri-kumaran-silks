import React, { useContext, useState, useEffect, useRef } from 'react';
import { Bell, Menu, Search, X, Check, Trash2, ShoppingBag, Star, UserPlus, PackagePlus, UserCog } from 'lucide-react';
import { AdminContext } from '../../context/AdminContext';
import { useNotifications } from '../../context/NotificationContext';

export default function Topbar({ openSidebar, openPalette }) {
  const { user } = useContext(AdminContext);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'order': return <ShoppingBag size={14} className="text-emerald-400" />;
      case 'review': return <Star size={14} className="text-amber-400" />;
      case 'user': return <UserPlus size={14} className="text-blue-400" />;
      case 'update': return <UserCog size={14} className="text-gray-400" />;
      case 'product': return <PackagePlus size={14} className="text-indigo-400" />;
      default: return <UserCog size={14} className="text-gray-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-[60] flex shrink-0 items-center justify-between gap-4 bg-[#0c0b14]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
      <div className="flex items-center gap-4">
        <button
          onClick={openSidebar}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl lg:hidden transition-colors"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>
        <div className="relative hidden sm:block" onClick={openPalette}>
          <div className="flex items-center gap-3 w-80 bg-white/5 border border-white/10 rounded-xl py-2 pl-4 pr-3 text-sm text-gray-500 hover:bg-white/[0.08] hover:border-white/20 transition-all cursor-pointer group">
            <Search size={16} className="group-hover:text-indigo-400 transition-colors" />
            <span className="flex-1">Global Search...</span>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black text-gray-400 group-hover:text-gray-300">
                <span className="text-[12px] opacity-50">⌘</span>
                <span>K</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className={`relative p-2.5 rounded-xl transition-all group ${showDropdown ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
                <Bell size={18} className={showDropdown ? '' : 'group-hover:rotate-12 transition-transform'} />
                {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-[#0c0b14] ring-4 ring-indigo-500/10 shadow-[0_0_10px_rgba(99,102,241,0.5)] animate-pulse" />
                )}
            </button>

            {/* Notification Dropdown */}
            {showDropdown && (
                <div className="absolute right-0 mt-3 w-[380px] bg-[#161521] border border-white/10 rounded-[24px] shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">Notification Flow</h3>
                            {unreadCount > 0 && (
                                <span className="bg-indigo-500/20 text-indigo-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-indigo-500/20">{unreadCount} New</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={markAllAsRead}
                                className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition-all"
                                title="Mark all as read"
                            >
                                <Check size={14} />
                            </button>
                            <button 
                                onClick={clearAll}
                                className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-all"
                                title="Clear all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="py-20 text-center opacity-30">
                                <Bell size={40} className="mx-auto mb-4" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">No Recent Activity</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {notifications.map((notif) => (
                                    <div 
                                        key={notif.id} 
                                        onClick={() => markAsRead(notif.id)}
                                        className={`px-6 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer relative group ${!notif.read ? 'bg-indigo-500/[0.02]' : ''}`}
                                    >
                                        {!notif.read && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>}
                                        <div className="flex gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/5 ${
                                                notif.type === 'order' ? 'bg-emerald-500/10 text-emerald-400' : 
                                                notif.type === 'review' ? 'bg-amber-500/10 text-amber-400' :
                                                notif.type === 'user' ? 'bg-blue-500/10 text-blue-400' :
                                                'bg-indigo-500/10 text-indigo-400'
                                            }`}>
                                                {getIcon(notif.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{notif.title}</p>
                                                    <span className="text-[9px] font-medium text-gray-600 italic">
                                                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className={`text-sm leading-tight transition-colors mb-1 ${notif.read ? 'text-gray-400 font-medium' : 'text-white font-bold'}`}>
                                                    {notif.message}
                                                </p>
                                                <p className="text-[10px] text-gray-500 truncate leading-none italic">{notif.subtext}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-4 border-t border-white/5 bg-white/[0.01]">
                            <button className="w-full py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors">
                                View Full Activity Stream
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
        <div className="h-8 w-px bg-white/5 mx-1" />
        <div className="hidden md:block text-right">
          <p className="text-sm font-bold text-white leading-tight">{user?.name || 'Admin'}</p>
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Active Now</p>
        </div>
      </div>
    </header>
  );
}

import React, { useState } from 'react';
import { X, Shield, User, Mail, UserCheck } from 'lucide-react';

const UserModal = ({ isOpen, onClose, user, onUpdate }) => {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        isAdmin: user?.isAdmin || false
    });

    if (!isOpen) return null;

    const handleToggle = () => {
        setFormData(prev => ({ ...prev, isAdmin: !prev.isAdmin }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate({ ...user, ...formData });
    };

    const initials = formData.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#161521] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold text-white">Edit User</h2>
                    <button 
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-6">
                        {/* Profile Preview */}
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-indigo-500/20">
                                {initials}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{formData.name}</h3>
                                <p className="text-xs text-gray-400">ID: {user?.displayId || user?.id?.slice(-8).toUpperCase()}</p>
                            </div>
                        </div>

                        {/* Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                        <User size={18} />
                                    </div>
                                    <input 
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full bg-[#0c0b14] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white focus:border-indigo-500/50 outline-none transition-all"
                                        placeholder="Enter full name"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                        <Mail size={18} />
                                    </div>
                                    <input 
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full bg-[#0c0b14] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white focus:border-indigo-500/50 outline-none transition-all"
                                        placeholder="Enter email address"
                                    />
                                </div>
                            </div>

                            {/* Admin Toggle */}
                            <div className="pt-2">
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Administrator Access</label>
                                <div 
                                    onClick={handleToggle}
                                    className="flex items-center justify-between p-4 bg-[#0c0b14] border border-white/5 rounded-xl cursor-pointer group hover:border-white/10 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg transition-colors ${formData.isAdmin ? 'bg-indigo-500/10 text-indigo-400' : 'bg-gray-500/10 text-gray-500'}`}>
                                            {formData.isAdmin ? <Shield size={18} /> : <UserCheck size={18} />}
                                        </div>
                                        <span className={`font-medium transition-colors ${formData.isAdmin ? 'text-white' : 'text-gray-400'}`}>
                                            {formData.isAdmin ? 'Admin Access Enabled' : 'Customer Account'}
                                        </span>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${formData.isAdmin ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${formData.isAdmin ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-[#0c0b14]/50 border-t border-white/5 flex gap-3">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                        >
                            Update User
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;

import React, { useCallback, useMemo, useState } from 'react';
import { RefreshCcw, Users, Shield, User, Edit2, Trash2, Mail, ExternalLink, Search } from 'lucide-react';
import useAdminData from '../hooks/useAdminData';
import { fetchCustomers, updateAdminUser, deleteAdminUser } from '../services/adminApi';
import UserModal from '../components/common/UserModal';

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="silk-card p-6 flex items-center gap-6">
        <div className={`p-4 rounded-2xl ${color}`}>
            <Icon size={28} />
        </div>
        <div>
            <div className="text-3xl font-extrabold text-white mb-1">{value}</div>
            <div className="text-sm font-medium text-gray-400">{label}</div>
        </div>
    </div>
);

export default function UsersPage() {
    const loadCustomers = useCallback(() => fetchCustomers(), []);
    const { data: users, setData: setUsers, loading, error, refresh } = useAdminData(loadCustomers, []);
    
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('All');

    const stats = useMemo(() => {
        const total = users.length;
        const admins = users.filter(u => u.isAdmin).length;
        const customers = total - admins;
        return { total, admins, customers };
    }, [users]);

    const filteredUsers = useMemo(() => {
        let result = [...users];

        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            result = result.filter(u => 
                u.name.toLowerCase().includes(lower) || 
                u.email.toLowerCase().includes(lower)
            );
        }

        if (selectedRole !== 'All') {
            result = result.filter(u => u.role === selectedRole);
        }

        return result;
    }, [users, searchQuery, selectedRole]);

    const handleEdit = (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleUpdate = async (updatedData) => {
        try {
            // Updated user on backend
            await updateAdminUser(updatedData.id, {
                name: updatedData.name,
                email: updatedData.email,
                isAdmin: updatedData.isAdmin
            });
            
            // Update local state
            setUsers(prev => prev.map(u => u.id === updatedData.id ? { ...u, ...updatedData, role: updatedData.isAdmin ? 'Admin' : 'Customer' } : u));
            setIsModalOpen(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update user');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to permanentely remove this user?')) return;
        try {
            await deleteAdminUser(id);
            setUsers(prev => prev.filter(u => u.id !== id));
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
        return `${day}, ${time}`;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">Users</h1>
                    <p className="text-gray-400 mt-1">Manage customer accounts and permissions ({stats.total} total users)</p>
                </div>
                <button 
                    onClick={refresh}
                    className="silk-btn-outline flex items-center gap-2"
                >
                    <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    icon={Users} 
                    label="Total Users" 
                    value={stats.total} 
                    color="bg-indigo-500/10 text-indigo-400"
                />
                <StatCard 
                    icon={Shield} 
                    label="Admin Users" 
                    value={stats.admins} 
                    color="bg-purple-500/10 text-purple-400"
                />
                <StatCard 
                    icon={User} 
                    label="Customers" 
                    value={stats.customers} 
                    color="bg-emerald-500/10 text-emerald-400"
                />
            </div>

            {/* Users Table */}
            <div className="silk-card overflow-hidden">
                <div className="px-8 py-6 border-b border-white/5 bg-white/[0.01] flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Directory Registry</span>
                        <div className="px-2.5 py-1 rounded-full bg-white/5 text-[10px] font-black text-indigo-400 border border-white/5 uppercase tracking-widest">
                            {filteredUsers.length} Results
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-purple-400 transition-colors" size={16} />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search Name or Email..."
                                className="w-full sm:w-64 bg-[#0c0b14] border border-white/5 rounded-xl py-2.5 pl-12 pr-4 text-sm text-white focus:border-purple-500/50 outline-none transition-all shadow-inner"
                            />
                        </div>

                        <select 
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="bg-[#0c0b14] border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-400 focus:border-purple-500/50 outline-none appearance-none cursor-pointer hover:bg-white/5"
                        >
                            <option value="All">All Roles</option>
                            <option value="Admin">Administrators</option>
                            <option value="Customer">Verified Customers</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">User</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Email</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Role</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Joined</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading && !users.length ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                            <span>Fetching user directory...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg ${
                                                user.isAdmin ? 'bg-gradient-to-tr from-indigo-500 to-purple-500' : 'bg-gradient-to-tr from-blue-500 to-cyan-500'
                                            }`}>
                                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white">{user.name}</div>
                                                <div className="text-xs text-gray-500">ID: {user.displayId}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <a href={`mailto:${user.email}`} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2 group/link">
                                            {user.email}
                                            <ExternalLink size={12} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                        </a>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`silk-badge ${
                                            user.isAdmin 
                                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_12px_rgba(168,85,247,0.1)]' 
                                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                        }`}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 animate-pulse" />
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-400">
                                        {formatDate(user.joined)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleEdit(user)}
                                                className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            {!user.isAdmin && (
                                                <button 
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/10"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {selectedUser && (
                <UserModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    user={selectedUser}
                    onUpdate={handleUpdate}
                />
            )}
        </div>
    );
}

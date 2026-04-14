import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Plus, X, Check, Search } from 'lucide-react';
import useAuthStore, { User as UserType } from '../store/authStore';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const Settings = () => {
  const { users, addUser, updateUser, deleteUser, currentUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'users'>('profile');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  // Confirm Modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<UserType>>({
    id: '',
    password: '',
    role: 'user',
    permissions: []
  });

  const availablePermissions = ['Dashboard', 'Document', 'Subscription', 'Calendar', 'Master', 'Settings'];

  const openAddUserModal = () => {
    setEditingUser(null);
    setFormData({
        id: '',
        password: '',
        role: 'user',
        permissions: ['Dashboard']
    });
    setIsModalOpen(true);
  };

  const openEditUserModal = (user: UserType) => {
    setEditingUser(user);
    setFormData({
        id: user.id,
        password: user.password,
        role: user.role,
        permissions: user.permissions
    });
    setIsModalOpen(true);
  };

  const handlePermissionToggle = (perm: string) => {
    setFormData(prev => {
        const currentPermissions = prev.permissions || [];
        if (currentPermissions.includes(perm)) {
            return { ...prev, permissions: currentPermissions.filter(p => p !== perm) };
        } else {
            return { ...prev, permissions: [...currentPermissions, perm] };
        }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.password) {
        toast.error('Username and password are required');
        return;
    }
    if (editingUser) {
        updateUser(editingUser.id, formData);
        toast.success('User updated');
    } else {
        const success = addUser(formData as UserType);
        if (success) toast.success('User added');
        else { toast.error('User exists'); return; }
    }
    setIsModalOpen(false);
  };

  const handleDeleteUser = (id: string) => {
      setUserToDelete(id);
      setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = () => {
      if (userToDelete) {
          deleteUser(userToDelete);
          toast.success('User deleted successfully');
          setUserToDelete(null);
      }
  };

  return (
    <div className="space-y-4 pb-12">
        {/* Compact Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 rounded-xl shadow-input">
            <h1 className="text-xl font-bold text-gray-900 px-1">Settings</h1>

            {/* Compact Tabs */}
            <div className="flex bg-gray-50 p-1 rounded-lg w-full md:w-auto border border-gray-100">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-md transition-all ${
                        activeTab === 'profile'
                            ? 'bg-white text-red-600 shadow-sm border border-red-100'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <User size={14} />
                    Profile
                </button>
                {currentUser?.role === 'admin' && (
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-md transition-all ${
                            activeTab === 'users'
                                ? 'bg-white text-red-600 shadow-sm border border-red-100'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Shield size={14} />
                        Users
                    </button>
                )}
            </div>
        </div>

        {/* Content Area */}
        <div className="animate-fade-in px-0.5">
             {activeTab === 'profile' ? (
                <div className="max-w-3xl mx-auto space-y-4">
                    <div className="bg-white rounded-xl shadow-input overflow-hidden">
                        <div className="p-4 sm:p-6 border-b border-gray-50 bg-gray-50/20">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-red-600 text-2xl font-bold shadow-sm border-2 border-red-50">
                                    {currentUser?.id.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">{currentUser?.id}</h2>
                                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold lowercase tracking-wider bg-red-50 text-red-700 border border-red-100 mt-1">
                                        <Shield size={10} />
                                        {currentUser?.role}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                    <User size={16} className="text-red-600" />
                                    Account
                                </h3>
                                <div className="space-y-2">
                                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 text-gray-700 text-sm">
                                        <span className="text-[10px] text-gray-400 block uppercase font-bold">Username</span>
                                        {currentUser?.id}
                                    </div>
                                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 text-gray-700 text-sm capitalize lowercase">
                                        <span className="text-[10px] text-gray-400 block uppercase font-bold">Role</span>
                                        {currentUser?.role}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                    <Bell size={16} className="text-red-600" />
                                    Alerts
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                                        <span className="text-xs font-medium text-gray-700">Email</span>
                                        <div className="w-9 h-5 bg-red-600 rounded-full relative">
                                            <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                                        <span className="text-xs text-gray-500">Browser</span>
                                        <div className="w-9 h-5 bg-gray-200 rounded-full relative">
                                            <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-white p-2 rounded-xl shadow-input flex flex-col sm:flex-row justify-between gap-2">
                        <div className="relative flex-1">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                             <input type="text" placeholder="Search users..." className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-lg text-sm outline-none focus:ring-1 focus:ring-red-100" />
                        </div>
                         <button 
                            onClick={openAddUserModal}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 shadow-md transition-all active:scale-95"
                        >
                            <Plus size={16} />
                            Add User
                        </button>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-input overflow-hidden h-[calc(100vh-250px)] flex flex-col">
                        <div className="overflow-auto flex-1">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
                                    <tr className="border-b border-gray-100 text-[10px] uppercase text-gray-400 font-bold tracking-wider">
                                        <th className="p-3">User</th>
                                        <th className="p-3">Permissions</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                                    {users.map((user: UserType) => (
                                        <tr key={user.id} className="hover:bg-gray-50 group transition-colors">
                                            <td className="p-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-600 font-bold text-xs border border-red-100">
                                                        {user.id.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold">{user.id}</p>
                                                        <span className="text-[9px] font-bold lowercase text-gray-400">{user.role}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 max-w-[200px] sm:max-w-none">
                                                <div className="flex flex-wrap gap-1">
                                                    {user.permissions?.slice(0, 4).map((perm: string) => (
                                                        <span key={perm} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[9px] font-bold border border-gray-200 uppercase">
                                                            {perm}
                                                        </span>
                                                    ))}
                                                    {(user.permissions?.length || 0) > 4 && (
                                                        <span className="text-[9px] text-gray-400">+{user.permissions.length - 4}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="flex justify-end gap-1.5">
                                                    <button onClick={() => openEditUserModal(user)} className="p-1.5 text-red-600 bg-red-50 rounded-lg font-bold">Edit</button>
                                                    {user.id !== currentUser?.id && (
                                                        <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 rounded-lg font-bold">X</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform animate-fade-in-up">
                <div className="flex items-center justify-between p-4 border-b border-gray-50 bg-gray-50/50">
                    <h2 className="text-sm font-bold text-gray-800">
                        {editingUser ? 'Edit User' : 'New User'}
                    </h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Username</label>
                            <input type="text" required disabled={!!editingUser} className="w-full p-2 border border-gray-100 rounded-lg text-xs outline-none focus:ring-1 focus:ring-red-500" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Role</label>
                            <select className="w-full p-2 border border-gray-100 rounded-lg text-xs outline-none focus:ring-1 focus:ring-red-500" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})}>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Password</label>
                        <input type="text" required className="w-full p-2 border border-gray-100 rounded-lg text-xs outline-none focus:ring-1 focus:ring-red-500" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Permissions</label>
                        <div className="grid grid-cols-2 gap-1.5 h-32 overflow-y-auto p-1 border border-gray-50 rounded">
                            {availablePermissions.map(perm => (
                                <label key={perm} className="flex items-center gap-2 p-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-all border border-transparent">
                                    <input type="checkbox" checked={(formData.permissions || []).includes(perm)} onChange={() => handlePermissionToggle(perm)} className="w-3 h-3 text-red-600 rounded" />
                                    <span className="text-[10px] font-medium text-gray-700">{perm}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="submit" className="flex-1 py-2 rounded-lg bg-red-600 text-white text-xs font-bold shadow-lg shadow-red-100 active:scale-95 transition-all">
                            {editingUser ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete the user "${userToDelete}"? This action cannot be undone.`}
        confirmText="Delete User"
        type="confirm"
      />
    </div>
  );
};

export default Settings;

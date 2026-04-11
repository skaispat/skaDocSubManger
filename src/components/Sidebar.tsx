import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  X,
  LayoutDashboard,
  FileText,
  RefreshCw,
  Settings as SettingsIcon,
  CreditCard
} from "lucide-react";
import useAuthStore from "../store/authStore";

interface SidebarProps {
  onClose?: () => void;
}

interface MenuItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
  subItems?: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { logout, currentUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Menu Configuration
  const allMenuItems: MenuItem[] = [
    {
      label: "Dashboard",
      path: "/",
      icon: <LayoutDashboard size={18} />,
    },
    {
      label: "Subscriptions",
      path: "/subscription/all",
      icon: <CreditCard size={18} />,
    },
    {
      label: "Documents",
      path: "/document",
      icon: <FileText size={18} />,
    },
    {
      label: "Renewals",
      path: "/renewal",
      icon: <RefreshCw size={18} />,
    },
    {
      label: "Settings",
      path: "/settings",
      icon: <SettingsIcon size={18} />,
    }
  ];

  const menuItems = allMenuItems.filter(item => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return currentUser.permissions?.includes(item.label);
  });

  const handleNavigation = (path: string) => {
    navigate(path);
    if (onClose) onClose();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderMenuItem = (item: MenuItem) => {
    const isActiveLink = item.path && (location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)));

    return (
      <div key={item.path || item.label} className="mb-1">
        <button
          onClick={() => handleNavigation(item.path!)}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActiveLink
            ? "bg-red-600 text-white shadow-sm font-bold"
            : "text-gray-600 hover:text-red-600 hover:bg-red-50 font-bold"
            }`}
        >
          {item.icon}
          <span className="text-sm whitespace-nowrap uppercase tracking-wider">{item.label}</span>
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white text-gray-800 border-r border-gray-100 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            DS
          </div>
          <div>
             <h1 className="font-bold text-sm tracking-tight text-gray-900 uppercase">Manager</h1>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Docs & Sub</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-red-600 transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 no-scrollbar">
        {menuItems.map(item => renderMenuItem(item))}
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-gray-100 mt-auto flex-shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-red-600 transition-all font-bold uppercase tracking-wider text-xs"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
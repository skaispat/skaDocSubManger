import React, { useState } from "react";
import { Bell, User, LogOut, X, Shield, ChevronRight } from "lucide-react";
import useAuthStore from "../store/authStore";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  children?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ children }) => {
  const { currentUser, logout } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userInitial = currentUser?.fullName?.charAt(0) || currentUser?.id?.charAt(0) || "U";

  return (
    <header className="bg-white border-b border-gray-100 relative z-50 font-sans">
      <div className="flex justify-between items-center px-4 py-2">
        <div className="flex items-center gap-3">
          {children}
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Bell size={18} className="text-gray-400" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-600 rounded-full"></span>
          </button>

          <button 
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-3 h-8 pl-4 border-l border-gray-100 group transition-all"
          >
            <div className="hidden md:block text-right transition-transform group-hover:-translate-x-1">
              <p className="text-xs font-bold text-gray-900 uppercase tracking-tight">
                {currentUser?.fullName || currentUser?.id || "Admin"}
              </p>
              <p className="text-[10px] text-gray-400 font-bold lowercase leading-none">
                {currentUser?.role || "system"}
              </p>
            </div>
            <div className="w-8 h-8 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center text-red-600 group-hover:bg-red-50 group-hover:border-red-100 transition-all font-bold">
              {userInitial.toUpperCase()}
            </div>
          </button>
        </div>
      </div>

      {/* Minimal User Dropdown */}
      {isProfileOpen && (
        <>
          <div 
            className="fixed inset-0 z-[1000]"
            onClick={() => setIsProfileOpen(false)}
          />
          <div className="fixed right-4 top-14 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-[1001] overflow-hidden animate-fade-in origin-top-right ring-1 ring-black/5">
            <div className="p-4 border-b border-gray-50 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600 font-black text-sm">
                {userInitial.toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {currentUser?.fullName || currentUser?.id}
                </p>
                <p className="text-[10px] text-gray-400 font-bold lowercase truncate">
                  {currentUser?.role}
                </p>
              </div>
            </div>

            <div className="p-2">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 p-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-all font-bold text-xs"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
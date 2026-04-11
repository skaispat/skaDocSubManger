import React from "react";
import { Bell, User } from "lucide-react";
import useAuthStore from "../store/authStore";

interface HeaderProps {
  children?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ children }) => {
  const { currentUser } = useAuthStore();

  return (
    <header className="bg-white border-b border-gray-100 relative z-10 font-sans">
      <div className="flex justify-between items-center px-4 py-2">
        <div className="flex items-center gap-3">
          {children}
        </div>
        
        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Bell size={18} className="text-gray-400" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-600 rounded-full"></span>
          </button>
          
          <div className="flex items-center gap-3 h-8 pl-4 border-l border-gray-100">
            <div className="hidden md:block text-right">
              <p className="text-xs font-bold text-gray-900 uppercase tracking-tight">{currentUser?.id || "Admin"}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
                {currentUser?.role || "System"}
              </p>
            </div>
            <div className="w-8 h-8 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center text-red-600">
              <User size={16} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
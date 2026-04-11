import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
        toast.error("Please fill all fields");
        return;
    }

    setIsLoading(true);
    const success = await login(username, password);
    setIsLoading(false);

    if (success) {
      toast.success("Login Successful!");
      navigate("/", { replace: true });
    } else {
      toast.error("Invalid username or password");
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-red-50 to-red-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="max-w-md w-full space-y-8 relative">
        {/* Main card */}
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-input transform transition-all duration-300 hover:shadow-red-100/50">
          {/* Header section */}
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <div className="relative">
                <div className="h-28 w-full flex items-center justify-center transform transition-all duration-300 hover:scale-105">
                  <img src="/SKALogoEnglishBlack.svg" alt="Logo" className="h-40 w-40 object-contain rounded-2xl" />
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-black text-gray-900 mb-1 tracking-tight uppercase">
              Management Portal
            </h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Document & Subscription</p>
          </div>

          {/* Form section */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Username field */}
            <div className="relative">
              <label className="block text-[10px] font-black text-gray-500 mb-1.5 uppercase tracking-widest ml-1">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User
                    className={`h-5 w-5 transition-all duration-200 ${focusedField === "username"
                      ? "text-red-500"
                      : "text-gray-400"
                      }`}
                  />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
                  className="block w-full pl-12 pr-4 py-4 shadow-input border-none rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-red-50/50 transition-all duration-200 bg-gray-50/50 focus:bg-white font-bold text-sm"
                  placeholder="admin"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="relative">
              <label className="block text-[10px] font-black text-gray-500 mb-1.5 uppercase tracking-widest ml-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock
                    className={`h-5 w-5 transition-all duration-200 ${focusedField === "password"
                      ? "text-red-500"
                      : "text-gray-400"
                      }`}
                  />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className="block w-full pl-12 pr-12 py-4 shadow-input border-none rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-red-50/50 transition-all duration-200 bg-gray-50/50 focus:bg-white font-bold text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-red-600 transition-colors duration-200" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-red-600 transition-colors duration-200" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <div className="relative pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-2xl text-white bg-red-600 hover:bg-black focus:outline-none focus:ring-4 focus:ring-red-500 transition-all duration-300 transform active:scale-95 shadow-xl shadow-red-200 flex items-center gap-2 uppercase tracking-widest ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : null}
                {isLoading ? 'Processing...' : 'Secure Login'}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
            Powered by{' '}
            <a
              href="https://www.botivate.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 hover:text-black transition-colors duration-200"
            >
              Botivate
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
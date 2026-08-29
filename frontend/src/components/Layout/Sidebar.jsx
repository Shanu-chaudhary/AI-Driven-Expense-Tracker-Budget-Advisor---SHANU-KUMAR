import React from "react";
import { FiUser, FiLogOut, FiList, FiHome, FiTrendingUp, FiDownload, FiMessageSquare, FiClock } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import Button from "../ui/Button";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useContext(AuthContext);

  const navItems = [
    { label: "Dashboard", icon: FiHome, path: "/dashboard" },
    { label: "Profile", icon: FiUser, path: "/me" },
    { label: "Transactions", icon: FiList, path: "/transactions" },
    { label: "Budget", icon: FiTrendingUp, path: "/budget" },
    { label: "Export", icon: FiDownload, path: "/export" },
    // { label: "AI Advisor", icon: "🤖", path: "/ai-advisor" },
    { label: "Insights", icon: FiTrendingUp, path: "/insights" },
    // { label: "AI History", icon: FiClock, path: "/ai-history" },
    { label: "Community", icon: FiMessageSquare, path: "/community" },
  ];

  const isActivePath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <aside className="h-screen w-72 px-3 py-8 bg-white border-r-2 border-blue-100 flex flex-col justify-between shadow-sm">
      {/* Top Section */}
      <div>
        {/* Logo */}
        <div className="text-center py-4 px-4 rounded-2xl bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-50 border-2 border-blue-200 mb-8 hover:shadow-lg transition-all duration-300">
          <div className="text-2xl font-bold bp-gradient-text tracking-tight">💰 BudgetPilot</div>
          <p className="text-xs font-semibold text-slate-700 mt-1 letter-spacing-wide">SMART FINANCE</p>
        </div>

        {/* Navigation */}
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = isActivePath(item.path);
            const IconComponent = typeof item.icon === "string" ? null : item.icon;
            
            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`
                    w-full text-left px-4 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-3
                    font-sans text-xs font-semibold tracking-wide
                    ${isActive
                      ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md scale-105 origin-left"
                      : "text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md"
                    }
                    active:scale-95 group
                  `}
                >
                  <span className={`
                    transition-all duration-300 text-lg flex-shrink-0
                    ${isActive ? "scale-110" : "group-hover:scale-110 group-hover:-rotate-6"}
                  `}>
                    {IconComponent ? <IconComponent size={20} strokeWidth={2.5} /> : item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <span className="ml-2 w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Bottom Section - Logout */}
      <div className="border-t-2 border-blue-100 pt-4">
        <Button
          variant="danger"
          className="w-full flex items-center justify-center gap-2 py-3 font-semibold text-sm tracking-wide hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          <FiLogOut size={18} strokeWidth={2.5} /> Sign Out
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;

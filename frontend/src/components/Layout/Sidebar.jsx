import React from "react";
import { FiUser, FiLogOut, FiList } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

const Sidebar = () => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  return (
    <div className="h-screen w-64 bg-light_sea_green-500 text-white flex flex-col justify-between shadow-xl">
      <div>
        <div className="text-center py-4 text-2xl font-bold tracking-wide bg-orange_peel-500 shadow-md">
          BudgetPilot
        </div>
        <ul className="mt-6 space-y-2">
          <li
            onClick={() => navigate("/dashboard")}
            className="cursor-pointer px-6 py-3 hover:bg-orange_peel-400 rounded-lg transition flex items-center gap-3"
          >
            <span>🏠</span> Dashboard
          </li>
          <li
            onClick={() => navigate("/me")}
            className="cursor-pointer px-6 py-3 hover:bg-orange_peel-400 rounded-lg transition flex items-center gap-3"
          >
            <FiUser /> Profile
          </li>
          <li
            onClick={() => navigate("/transactions")}
            className="cursor-pointer flex items-center gap-3 p-3 px-5 rounded-lg hover:bg-orange_peel-400 transition"
          >
            <FiList /> Transactions
          </li>
          <li
            onClick={() => navigate("/budget")}
            className="cursor-pointer px-5 py-3 hover:bg-orange_peel-400 rounded-lg transition flex items-center gap-3"
          >
            💰 Budget
          </li>

          <li
            onClick={() => navigate("/export")}
            className="cursor-pointer px-5 py-3 hover:bg-orange_peel-400 rounded-lg transition flex items-center gap-3"
          >
            ⤓ Export
          </li>

          <li
            onClick={() => navigate("/community")}
            className="cursor-pointer px-5 py-3 hover:bg-orange_peel-400 rounded-lg transition flex items-center gap-3"
          >
            💬 Community
          </li>

        </ul>
      </div>

      <div className="mb-4 px-6">
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="w-full flex items-center justify-center gap-2 bg-orange_peel-500 hover:bg-orange_peel-400 text-white py-2 rounded-lg transition"
        >
          <FiLogOut /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;



import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import ProfileCard from "../../components/Dashboard/ProfileCard";
import axios from "../../api/axios";

const Topbar = () => {
  const { user } = useContext(AuthContext);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);



  // fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("/profile/me");
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-blue-100 bg-white">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-slate-900">BudgetPilot</h2>
        <span className="text-slate-600 text-sm">Smart budgeting & AI guidance</span>
      </div>

      <div className="flex items-center gap-4">
        <ProfileCard profile={profile} />
      </div>
    </header>
  );
};

export default Topbar;

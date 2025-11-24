

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
    <div className="h-16 bg-mint_green-500 shadow-md flex items-center justify-between px-6">
      {/* <h1 className="text-lg font-semibold text-light_sea_green-200">
        Welcome, {user?.name || "User"}
      </h1>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-orange_peel-500 flex items-center justify-center text-white font-bold">
          {user?.name ? user.name[0].toUpperCase() : "U"}
        </div>
      </div> */}
      <ProfileCard profile={profile} />
    </div>
  );
};

export default Topbar;

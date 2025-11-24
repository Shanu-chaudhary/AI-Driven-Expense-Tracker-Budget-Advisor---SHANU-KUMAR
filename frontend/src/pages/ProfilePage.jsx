import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/Layout/DashboardLayout";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  if (loading)
    return (
      <DashboardLayout>
        <p className="text-center py-10 text-gray-600">Loading profile...</p>
      </DashboardLayout>
    );

  if (!profile)
    return (
      <DashboardLayout>
        <p className="text-center py-10 text-red-500">
          No profile found. Please update your details.
        </p>
      </DashboardLayout>
    );

  // Destructure all fields from the profile data
  const {
    fullName,
    displayName,
    gender,
    country,
    state,
    city,
    timeZone,
    currency,
    language,
    phoneNumber,
    profileImageUrl,
  } = profile;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl p-8 border border-orange_peel-200">
        <h2 className="text-3xl font-semibold text-center mb-6 text-light_sea_green-200">
          My Profile
        </h2>

        {/* Profile Header */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <img
            src={profileImageUrl || "/default-avatar.png"}
            alt="Profile"
            className="w-32 h-32 rounded-full border-4 border-orange_peel-500 object-cover"
          />
          <h3 className="text-2xl font-bold text-orange_peel-400">
            {fullName || "Unnamed User"}
          </h3>
          <p className="text-gray-600 text-sm italic">
            Display Name: {displayName || "Not set"}
          </p>
          <p className="text-gray-500 text-sm">Gender: {gender || "Not set"}</p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-orange_peel-300 mb-1">
              Phone Number
            </h4>
            <p className="text-gray-700">{phoneNumber || "Not provided"}</p>
          </div>
          <div>
            <h4 className="font-semibold text-orange_peel-300 mb-1">Country</h4>
            <p className="text-gray-700">{country || "Not provided"}</p>
          </div>
          <div>
            <h4 className="font-semibold text-orange_peel-300 mb-1">State</h4>
            <p className="text-gray-700">{state || "Not provided"}</p>
          </div>
          <div>
            <h4 className="font-semibold text-orange_peel-300 mb-1">City</h4>
            <p className="text-gray-700">{city || "Not provided"}</p>
          </div>
          <div>
            <h4 className="font-semibold text-orange_peel-300 mb-1">
              Time Zone
            </h4>
            <p className="text-gray-700">{timeZone || "Not provided"}</p>
          </div>
          <div>
            <h4 className="font-semibold text-orange_peel-300 mb-1">
              Currency
            </h4>
            <p className="text-gray-700">{currency || "Not provided"}</p>
          </div>
          <div>
            <h4 className="font-semibold text-orange_peel-300 mb-1">
              Language
            </h4>
            <p className="text-gray-700">{language || "Not provided"}</p>
          </div>
        </div>

        {/* Edit Button */}
        <div className="text-center mt-10">
          <button
            onClick={() => navigate("/edit-profile")}
            className="bg-light_sea_green-500 text-white px-6 py-2 rounded-xl hover:bg-light_sea_green-400 transition"
          >
            Edit Profile
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
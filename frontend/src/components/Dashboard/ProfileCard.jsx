import React from "react";

const ProfileCard = ({ profile }) => {
  if (!profile) return null;

  return (
    <div className="bg-mint_green-500 w-full flex justify-between mx-auto text-center">
      {/* Profile Image */}
      <div className="flex">
      <img
        src={profile.profileImageUrl || "https://via.placeholder.com/100"}
        alt="Profile"
        className="ml-2 w-16 h-16 rounded-full  mb-0 border-2 border-orange_peel-500 object-cover"
      />

      {/* Full Name */}
      <h2 className="p-2 ml-0 text-lg font-bold text-orange_peel-500">
        {profile.fullName || "Unnamed User"}
      </h2>
      </div>
      <div className="flex p-3 gap-3">
      {/* Email */}
      <p className="text-gray-500">
        {profile.user?.email || "Email not available"}
      </p>

      {/* Country and Currency */}
      <p className="text-gray-400">
        {profile.country || "Country not set"} • {profile.currency || "Currency not set"}
      </p>
      </div>
    </div>
  );
};

export default ProfileCard;

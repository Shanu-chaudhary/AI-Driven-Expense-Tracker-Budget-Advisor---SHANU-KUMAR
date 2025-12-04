import React from "react";
import Card from "../ui/Card";

const ProfileCard = ({ profile }) => {
  if (!profile) return null;

  return (
    <Card className="flex items-center justify-between gap-4 p-4">
      <div className="flex items-center gap-3">
        <img
          src={profile.profileImageUrl || "https://via.placeholder.com/100"}
          alt="Profile"
          className="w-16 h-16 rounded-full border-2 border-blue-200 object-cover"
        />
        <div className="text-left">
          <h2 className="text-lg font-bold bp-gradient-text">{profile.fullName || "Unnamed User"}</h2>
          <p className="text-sm text-slate-600">{profile.user?.email || "Email not available"}</p>
        </div>
      </div>

      <div className="text-right">
        <p className="text-sm text-slate-600">{profile.country || "Country not set"} • {profile.currency || "Currency not set"}</p>
      </div>
    </Card>
  );
};

export default ProfileCard;

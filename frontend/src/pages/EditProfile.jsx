// import React, { useState, useContext, useEffect } from "react";
// import axios from "../api/axios";
// import { AuthContext } from "../context/AuthContext";
// import { useNavigate } from "react-router-dom";
// import { Country, State, City } from "country-state-city";

// export default function EditProfile() {
//   const { user, refreshUser } = useContext(AuthContext);
//   const navigate = useNavigate();
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [imageLoading, setImageLoading] = useState(false);

//   const [profile, setProfile] = useState({
//     fullName: "",
//     displayName: "",
//     gender: "",
//     country: "",
//     state: "",
//     city: "",
//     timeZone: "",
//     currency: "",
//     language: "",
//     phoneNumber: "",
//     profileImageUrl: ""
//   });

//   const [countries, setCountries] = useState([]);
//   const [states, setStates] = useState([]);
//   const [cities, setCities] = useState([]);

//   useEffect(() => {
//     setCountries(Country.getAllCountries());
//   }, []);

//   useEffect(() => {
//     if (profile.country) {
//       setStates(State.getStatesOfCountry(profile.country));
//     }
//   }, [profile.country]);

//   useEffect(() => {
//     if (profile.state) {
//       setCities(City.getCitiesOfState(profile.country, profile.state));
//     }
//   }, [profile.state, profile.country]);

//   useEffect(() => {
//     // Load existing profile data
//     const loadProfile = async () => {
//       try {
//         const res = await axios.get("/profile/me");
//         setProfile(res.data);
//       } catch (err) {
//         console.error("Failed to load profile:", err);
//         setError("Failed to load profile");
//       }
//     };
//     loadProfile();
//   }, []);

//   const handleImageUpload = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     // Validate file type and size
//     const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
//     if (!validTypes.includes(file.type)) {
//       setError('Please upload a valid image file (JPEG, PNG)');
//       return;
//     }

//     if (file.size > 5 * 1024 * 1024) { // 5MB limit
//       setError('Image size should be less than 5MB');
//       return;
//     }

//     setImageLoading(true);
//     const formData = new FormData();
//     formData.append('file', file);
//     formData.append('profileData', JSON.stringify(profile));

//     try {
//       // Let axios set the Content-Type (including boundary) automatically
//       const response = await axios.put('/profile/update', formData);
//       const data = response.data;
//       setProfile(prev => ({ ...prev, profileImageUrl: data.profileImageUrl }));
//     } catch (err) {
//       console.error('Image upload failed:', err);
//       setError(err.response?.data?.message || err.message || 'Failed to upload image');
//     } finally {
//       setImageLoading(false);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");
    
//     try {
//       const formData = new FormData();
//       formData.append('profileData', JSON.stringify(profile));
      
//       // Let axios set the Content-Type (including boundary) automatically
//       const response = await axios.put("/profile/update", formData);
//       await refreshUser();
//       navigate("/dashboard");
//     } catch (err) {
//       console.error("Profile update failed", err);
//       setError(
//         err.response?.data?.message || 
//         err.message || 
//         "Failed to update profile"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-4xl mx-auto p-6">
//       <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>
//       {error && (
//         <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
//           {error}
//         </div>
//       )}
//       <form onSubmit={handleSubmit} className="space-y-4">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <label className="block mb-2">Profile Image</label>
//             {profile.profileImageUrl && (
//               <img 
//                 src={profile.profileImageUrl} 
//                 alt="Profile" 
//                 className="w-32 h-32 rounded-full mb-2 object-cover"
//               />
//             )}
//             <input
//               type="file"
//               accept="image/*"
//               onChange={handleImageUpload}
//               className="w-full"
//               disabled={imageLoading}
//             />
//           </div>
//           <div>
//             <label className="block mb-2">Full Name</label>
//             <input
//               type="text"
//               value={profile.fullName}
//               onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
//               className="w-full p-2 border rounded"
//               required
//             />
//           </div>
//           <div>
//             <label className="block mb-2">Display Name</label>
//             <input
//               type="text"
//               value={profile.displayName}
//               onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
//               className="w-full p-2 border rounded"
//               required
//             />
//           </div>
//           <div>
//             <label className="block mb-2">Gender</label>
//             <select
//               value={profile.gender}
//               onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
//               className="w-full p-2 border rounded"
//               required
//             >
//               <option value="">Select Gender</option>
//               <option value="male">Male</option>
//               <option value="female">Female</option>
//               <option value="other">Other</option>
//             </select>
//           </div>
//           <div>
//             <label className="block mb-2">Country</label>
//             <select
//               value={profile.country}
//               onChange={(e) => {
//                 setProfile({ 
//                   ...profile, 
//                   country: e.target.value,
//                   state: "",
//                   city: "" 
//                 });
//               }}
//               className="w-full p-2 border rounded"
//               required
//             >
//               <option value="">Select Country</option>
//               {countries.map((country) => (
//                 <option key={country.isoCode} value={country.isoCode}>
//                   {country.name}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div>
//             <label className="block mb-2">State</label>
//             <select
//               value={profile.state}
//               onChange={(e) => {
//                 setProfile({ 
//                   ...profile, 
//                   state: e.target.value,
//                   city: "" 
//                 });
//               }}
//               className="w-full p-2 border rounded"
//               required
//             >
//               <option value="">Select State</option>
//               {states.map((state) => (
//                 <option key={state.isoCode} value={state.isoCode}>
//                   {state.name}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div>
//             <label className="block mb-2">City</label>
//             <select
//               value={profile.city}
//               onChange={(e) => setProfile({ ...profile, city: e.target.value })}
//               className="w-full p-2 border rounded"
//               required
//             >
//               <option value="">Select City</option>
//               {cities.map((city) => (
//                 <option key={city.name} value={city.name}>
//                   {city.name}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div>
//             <label className="block mb-2">Phone Number</label>
//             <input
//               type="tel"
//               value={profile.phoneNumber}
//               onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
//               className="w-full p-2 border rounded"
//               required
//             />
//           </div>
//           <div>
//             <label className="block mb-2">Time Zone</label>
//             <input
//               type="text"
//               value={profile.timeZone}
//               onChange={(e) => setProfile({ ...profile, timeZone: e.target.value })}
//               className="w-full p-2 border rounded"
//               required
//             />
//           </div>
//           <div>
//             <label className="block mb-2">Currency</label>
//             <input
//               type="text"
//               value={profile.currency}
//               onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
//               className="w-full p-2 border rounded"
//               required
//             />
//           </div>
//           <div>
//             <label className="block mb-2">Language</label>
//             <input
//               type="text"
//               value={profile.language}
//               onChange={(e) => setProfile({ ...profile, language: e.target.value })}
//               className="w-full p-2 border rounded"
//               required
//             />
//           </div>
//         </div>
//         <div className="flex justify-end space-x-4">
//           <button
//             type="button"
//             onClick={() => navigate("/dashboard")}
//             className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100"
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             disabled={loading || imageLoading}
//             className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
//           >
//             {loading ? "Saving..." : "Save Changes"}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }



import React, { useState, useContext, useEffect } from "react";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Country, State, City } from "country-state-city";
import DashboardLayout from "../components/Layout/DashboardLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function EditProfile() {
  const { refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const [profile, setProfile] = useState({
    fullName: "",
    displayName: "",
    gender: "",
    country: "",
    state: "",
    city: "",
    timeZone: "",
    currency: "",
    language: "",
    phoneNumber: "",
    profileImageUrl: "",
  });

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  useEffect(() => {
    if (profile.country) {
      setStates(State.getStatesOfCountry(profile.country));
    }
  }, [profile.country]);

  useEffect(() => {
    if (profile.state) {
      setCities(City.getCitiesOfState(profile.country, profile.state));
    }
  }, [profile.state, profile.country]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await axios.get("/profile/me");
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to load profile:", err);
        setError("Failed to load profile");
      }
    };
    loadProfile();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image file (JPEG, PNG)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setImageLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("profileData", JSON.stringify(profile));

    try {
      const response = await axios.put("/profile/update", formData);
      const data = response.data;
      setProfile((prev) => ({ ...prev, profileImageUrl: data.profileImageUrl }));
    } catch (err) {
      console.error("Image upload failed:", err);
      setError(err.response?.data?.message || "Failed to upload image");
    } finally {
      setImageLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("profileData", JSON.stringify(profile));
      await axios.put("/profile/update", formData);
      await refreshUser();
      navigate("/me");
    } catch (err) {
      console.error("Profile update failed", err);
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold bp-gradient-text mb-6">
          Edit Profile
        </h2>

        {error && (
          <Card className="mb-4 p-3 border-l-4 border-red-500">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        <Card className="p-6 space-y-6">
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Image */}
            <div>
              <label className="block mb-2 font-medium text-slate-900">
                Profile Image
              </label>
              {profile.profileImageUrl && (
                <img
                  src={profile.profileImageUrl}
                  alt="Profile"
                  className="w-32 h-32 rounded-full mb-3 object-cover border-4 border-blue-200"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full border border-blue-200 rounded-lg p-2 bg-white text-slate-900 focus:ring-2 focus:ring-blue-400"
                disabled={imageLoading}
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block mb-2 font-medium text-slate-900">
                Full Name
              </label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) =>
                  setProfile({ ...profile, fullName: e.target.value })
                }
                className="w-full p-2 border border-blue-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            {/* Display Name */}
            <div>
              <label className="block mb-2 font-medium text-slate-900">
                Display Name
              </label>
              <input
                type="text"
                value={profile.displayName}
                onChange={(e) =>
                  setProfile({ ...profile, displayName: e.target.value })
                }
                className="w-full p-2 border border-blue-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block mb-2 font-medium text-slate-900">
                Gender
              </label>
              <select
                value={profile.gender}
                onChange={(e) =>
                  setProfile({ ...profile, gender: e.target.value })
                }
                className="w-full p-2 border border-blue-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-400"
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Country */}
            <div>
              <label className="block mb-2 font-medium text-slate-900">
                Country
              </label>
              <select
                value={profile.country}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    country: e.target.value,
                    state: "",
                    city: "",
                  })
                }
                className="w-full p-2 border border-blue-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-400"
                required
              >
                <option value="">Select Country</option>
                {countries.map((country) => (
                  <option key={country.isoCode} value={country.isoCode}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            {/* State */}
            <div>
              <label className="block mb-2 font-medium text-slate-900">
                State
              </label>
              <select
                value={profile.state}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    state: e.target.value,
                    city: "",
                  })
                }
                className="w-full p-2 border border-blue-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-400"
                required
              >
                <option value="">Select State</option>
                {states.map((state) => (
                  <option key={state.isoCode} value={state.isoCode}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block mb-2 font-medium text-slate-900">City</label>
              <select
                value={profile.city}
                onChange={(e) =>
                  setProfile({ ...profile, city: e.target.value })
                }
                className="w-full p-2 border border-blue-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-400"
                required
              >
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block mb-2 font-medium text-slate-900">
                Phone Number
              </label>
              <input
                type="tel"
                value={profile.phoneNumber}
                onChange={(e) =>
                  setProfile({ ...profile, phoneNumber: e.target.value })
                }
                className="w-full p-2 border border-blue-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            {/* Time Zone */}
            <div>
              <label className="block mb-2 font-medium text-slate-900">
                Time Zone
              </label>
              <input
                type="text"
                value={profile.timeZone}
                onChange={(e) =>
                  setProfile({ ...profile, timeZone: e.target.value })
                }
                className="w-full p-2 border border-blue-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block mb-2 font-medium text-slate-900">
                Currency
              </label>
              <input
                type="text"
                value={profile.currency}
                onChange={(e) =>
                  setProfile({ ...profile, currency: e.target.value })
                }
                className="w-full p-2 border border-blue-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            {/* Language */}
            <div>
              <label className="block mb-2 font-medium text-slate-900">
                Language
              </label>
              <input
                type="text"
                value={profile.language}
                onChange={(e) =>
                  setProfile({ ...profile, language: e.target.value })
                }
                className="w-full p-2 border border-blue-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <Button variant="ghost" onClick={() => navigate("/me")}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || imageLoading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}

import React, { useState, useContext, useEffect } from "react";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Country, State, City } from "country-state-city";

export default function ProfileSetup() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.profileComplete) navigate("/dashboard");
  }, [user, navigate]);

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
    profileImageUrl: ""
  });
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('profileData', JSON.stringify(profile));

    try {
      const response = await axios.put('/profile/update', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const data = response.data;
      setProfile(prev => ({ ...prev, profileImageUrl: data.profileImageUrl }));
    } catch (err) {
      console.error('Image upload failed:', err);
      setError('Failed to upload image');
    } finally {
      setImageLoading(false);
    }
  };

  useEffect(() => setCountries(Country.getAllCountries()), []);

  useEffect(() => {
    if (profile.country) {
      const selectedCountry = countries.find(c => c.name === profile.country);
      if (selectedCountry) {
        setStates(State.getStatesOfCountry(selectedCountry.isoCode));
        setProfile(prev => ({ ...prev, currency: selectedCountry.currency }));
      }
    }
  }, [profile.country, countries]);

  useEffect(() => {
    if (profile.state) {
      const selectedState = states.find(s => s.name === profile.state);
      if (selectedState) setCities(City.getCitiesOfState(selectedState.countryCode, selectedState.isoCode));
    }
  }, [profile.state, states]);

  const handleChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const requiredFields = ['fullName', 'country', 'currency', 'language'];
      for (const field of requiredFields) {
        if (!profile[field]?.trim()) throw new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
      }

      const res = await axios.post("/profile/create", profile);
      setUser(res.data.user || { ...res.data, profileComplete: true });

      // Refresh user
      const me = await axios.get("/auth/me");
      if(me?.data) setUser(me.data);

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-4 text-center">Complete Your Profile</h2>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col items-center mb-4">
          {profile.profileImageUrl ? (
            <div className="relative">
              <img 
                src={profile.profileImageUrl} 
                alt="Profile"
                className="w-32 h-32 rounded-full mb-2 object-cover"
              />
              <button
                type="button"
                onClick={() => setProfile({ ...profile, profileImageUrl: "" })}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center mb-2">
              <span className="text-slate-500">No Image</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full"
            disabled={imageLoading}
          />
          {imageLoading && (
            <p className="text-sm text-slate-600 mt-1">Uploading image...</p>
          )}
        </div>
        <input name="fullName" placeholder="Full Name" onChange={handleChange} required className="w-full p-2 border rounded" />
        <input name="displayName" placeholder="Display Name (optional)" onChange={handleChange} className="w-full p-2 border rounded" />

        <select name="country" value={profile.country || ""} onChange={handleChange} className="w-full p-2 border rounded">
          <option value="">Select Country</option>
          {countries.map(c => <option key={c.isoCode} value={c.name}>{c.name}</option>)}
        </select>

        <select name="state" value={profile.state || ""} onChange={handleChange} className="w-full p-2 border rounded">
          <option value="">Select State</option>
          {states.map(s => <option key={s.isoCode} value={s.name}>{s.name}</option>)}
        </select>

        <select name="city" value={profile.city || ""} onChange={handleChange} className="w-full p-2 border rounded">
          <option value="">Select City</option>
          {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>

        <input name="currency" value={profile.currency || ""} readOnly placeholder="Currency" className="w-full p-2 border rounded bg-slate-100" />
        <input name="language" placeholder="Preferred Language" onChange={handleChange} required className="w-full p-2 border rounded" />
        <input name="phoneNumber" placeholder="Phone Number (optional)" onChange={handleChange} type="tel" className="w-full p-2 border rounded" />

        <button type="submit" disabled={loading} className={`w-full p-3 rounded text-white font-medium ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
          {loading ? "Saving..." : "Save & Continue"}
        </button>
      </form>
    </div>
  );
}
import React, { createContext, useState, useEffect } from "react";
import axios from "../api/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUser = async () => {
    const token = localStorage.getItem("token");
    if (!token || token === 'undefined' || token === 'null') {
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get("/auth/me");
      setUser(res.data);
    } catch (err) {
      console.error('Failed to fetch current user', err.response ?? err);
      setError(err.response?.data || 'Failed to load user');
      setUser(null);
      // Clear invalid token
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("token");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (token, userData) => {
    localStorage.setItem("token", token);
    setUser(userData);
    setError(null);
  };

  const logout = async () => {
  const token = localStorage.getItem("token");
  try {
    if (token && token !== "undefined" && token !== "null") {
      // notify backend so token is blacklisted
      await axios.post("/auth/logout", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  } catch (err) {
    // ignore backend errors — still clear client state
    console.error("Logout request error:", err?.response ?? err);
  } finally {
    localStorage.removeItem("token");
    setUser(null);
    setError(null);
    // redirect to login page
    window.location.href = "/login";
  }
};


  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    setUser: updateUser,
    refreshUser: loadUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
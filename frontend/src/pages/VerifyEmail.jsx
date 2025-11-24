import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Verifying your email...");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setMessage("Invalid verification link.");
      setLoading(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await axios.get(`/auth/verify-email?token=${token}`);
        setMessage(res.data.message || "Email verified successfully!");
        setTimeout(() => navigate("/login"), 3000); // redirect after 3s
      } catch (err) {
        console.error("Verification failed", err);
        setMessage(err.response?.data?.message || "Invalid or expired verification link.");
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-mint_green-100">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md text-center border border-light_sea_green-300">
        <h2 className="text-2xl font-semibold text-light_sea_green-500 mb-4">
          {loading ? "Verifying..." : "Email Verification"}
        </h2>
        <p className={`text-lg ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
        {!loading && (
          <button
            onClick={() => navigate("/login")}
            className="mt-6 bg-light_sea_green-500 text-white px-6 py-2 rounded-lg hover:bg-light_sea_green-400 transition"
          >
            Go to Login
          </button>
        )}
      </div>
    </div>
  );
}

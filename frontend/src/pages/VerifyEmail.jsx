import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

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
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <Card className="p-8 max-w-md text-center">
        <h2 className="text-2xl font-semibold bp-gradient-text mb-4">
          {loading ? "Verifying..." : "Email Verification"}
        </h2>
        <p className={`text-lg ${message.includes("success") ? "text-green-500" : "text-red-500"}`}>
          {message}
        </p>
        {!loading && (
          <Button
            onClick={() => navigate("/login")}
            className="mt-6"
            variant="primary"
          >
            Go to Login
          </Button>
        )}
      </Card>
    </div>
  );
}

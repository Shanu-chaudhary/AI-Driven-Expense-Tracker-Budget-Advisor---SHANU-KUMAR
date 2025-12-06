import { useState, useContext } from "react";
import axios from "../../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import PasswordInput from "./PasswordInput";

function RegisterForm() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.name || !formData.email || !formData.password) {
      setError("Please fill all fields to continue.");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    try {
      const registerRes = await axios.post("/auth/register", formData);
      console.log("Registration response:", registerRes.data);
      
      // Show success message and redirect to verify email page
      if (registerRes.data?.emailVerified === false) {
        setError(""); // Clear any errors
        // Redirect to verify email page
        navigate("/verify-email", { state: { email: registerRes.data.email } });
        return;
      }
      
      // If somehow email is already verified, try to login
      const loginRes = await axios.post("/auth/login", { email: formData.email, password: formData.password });
      console.log("Login response:", loginRes.data);
      
      if (!loginRes.data?.token) throw new Error("Login failed after registration");
      await login(loginRes.data.token, loginRes.data.user);
      navigate("/setup-profile");
    } catch (err) {
      console.error("Registration error details:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      setError(err.response?.data?.message || err.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <div className="max-w-2xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 bp-fade-in">
        {/* Info Card */}
        <div className="bp-card p-8 rounded-xl hidden md:flex flex-col justify-center">
          <h2 className="text-2xl font-bold bp-gradient-text mb-4">Welcome to BudgetPilot</h2>
          <p className="text-slate-700 mb-6">Join thousands of smart savers transforming their finances with AI-powered insights.</p>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-lg">📊</span>
              <div>
                <p className="font-semibold text-slate-900">Smart Analytics</p>
                <p className="text-xs text-slate-600">Understand your spending patterns instantly</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lg">🤖</span>
              <div>
                <p className="font-semibold text-slate-900">AI Guidance</p>
                <p className="text-xs text-slate-600">Personalized saving strategies for you</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lg">💰</span>
              <div>
                <p className="font-semibold text-slate-900">Goal Tracking</p>
                <p className="text-xs text-slate-600">Build wealth with real progress tracking</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bp-card p-8 rounded-xl space-y-6">
          {/* Header */}
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">Create Account</h3>
            <p className="text-sm text-slate-600">Get started in under 2 minutes</p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Full Name</label>
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
                className="w-full"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Email Address</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Password</label>
              <PasswordInput
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
              <p className="text-xs text-slate-600 mt-1">Minimum 8 characters</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bp-btn-primary py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating account...
                </>
              ) : (
                <>🚀 Create Free Account</>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-sm">
            <span className="text-slate-600">Already have an account?</span>
            {" "}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterForm;
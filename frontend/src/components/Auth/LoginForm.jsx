import { useState, useContext } from "react";
import axios from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import PasswordInput from "./PasswordInput";

function LoginForm() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter both email and password.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post("/auth/login", formData);
      if (!res.data?.token) throw new Error("Invalid response from server");
      await login(res.data.token, res.data.user);
      if (res.data.user?.profileComplete) navigate("/dashboard");
      else navigate("/setup-profile");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <div className="max-w-md w-full space-y-8 bp-fade-in">
        {/* Header */}
        <div className="text-center">
          <div className="inline-block mb-4">
            <div className="text-4xl font-bold bp-gradient-text">💰 BudgetPilot</div>
          </div>
          <p className="text-lg font-semibold text-slate-900 mb-2">Smart Expense Tracking</p>
          <p className="text-sm text-slate-600">AI-powered insights to transform your finances</p>
        </div>

        {/* Login Card */}
        <div className="bp-card p-8 rounded-xl space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleLogin}>
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Email Address</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Password</label>
              <PasswordInput
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bp-btn-primary flex items-center justify-center gap-2 py-3 font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                <>✨ Sign In to BudgetPilot</>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center">
            <div className="flex-1 bp-divider"></div>
            <span className="px-3 text-xs text-slate-600">OR</span>
            <div className="flex-1 bp-divider"></div>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-sm">
            <span className="text-slate-600">Don't have an account?</span>
            {" "}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 transition">
              Create one
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-600 space-y-2">
          <p className="font-semibold text-slate-900">Why Choose BudgetPilot?</p>
          <ul className="space-y-1 text-xs">
            <li>✓ AI-Powered Financial Insights</li>
            <li>✓ Smart Budgeting & Tracking</li>
            <li>✓ Personalized Money Tips</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;

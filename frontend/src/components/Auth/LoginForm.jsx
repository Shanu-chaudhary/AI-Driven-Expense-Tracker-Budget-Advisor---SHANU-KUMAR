import { useState, useContext } from "react";
import axios from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

function LoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
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

    // Validate inputs
    if (!formData.email || !formData.password) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post("/auth/login", formData);
      
      if (!res.data?.token) {
        throw new Error("Invalid response from server");
      }

      // Use the login function from AuthContext
      await login(res.data.token, res.data.user);

      // Redirect based on profile completion
      if (res.data.user?.profileComplete) {
        navigate("/dashboard");
      } else {
        navigate("/setup-profile");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message || 
        err.response?.data || 
        "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
          {error}
        </div>
      )}
      <form
        onSubmit={handleLogin}
        className="bg-white shadow-md rounded-lg p-6 w-80"
      >
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-700">Login</h2>
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full p-2 border mb-3 rounded focus:outline-blue-400"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full p-2 border mb-4 rounded focus:outline-blue-400"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-2 rounded ${
            loading 
              ? "bg-blue-400 cursor-not-allowed" 
              : "bg-blue-600 hover:bg-blue-700"
          } text-white`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <p className="text-center mt-3 text-sm">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-500 hover:underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}

export default LoginForm;

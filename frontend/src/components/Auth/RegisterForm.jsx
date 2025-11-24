import { useState, useContext } from "react";
import axios from "../../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

function RegisterForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Clear error when user types
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate inputs
    if (!formData.name || !formData.email || !formData.password) {
      setError("All fields are required");
      setLoading(false);
      return;
    }
    // Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(formData.email)) {
  setError("Please enter a valid email address");
  setLoading(false);
  return;
}

// Password validation
if (formData.password.length < 8) {
  setError("Password must be at least 8 characters long");
  setLoading(false);
  return;
}

    try {
      // Register the user
      const registerRes = await axios.post("/auth/register", formData);
      
      // Auto-login after registration
      const loginRes = await axios.post("/auth/login", {
        email: formData.email,
        password: formData.password
      });

      if (!loginRes.data?.token) {
        throw new Error("Login failed after registration");
      }

      // Use the login function from AuthContext
      await login(loginRes.data.token, loginRes.data.user);
      
      // Navigate to profile setup
      alert("Registration successful! Please check your email to verify your account before logging in.");
      navigate("/setup-profile");
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err.response?.data?.message || 
        err.response?.data || 
        err.message || 
        "Registration failed. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form
        onSubmit={handleRegister}
        className="bg-white shadow-md rounded-lg p-6 w-96"
      >
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-700">
          Register
        </h2>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          className="w-full p-2 border mb-3 rounded focus:outline-blue-400"
          value={formData.name}
          onChange={handleChange}
          required
        />
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
              ? "bg-green-400 cursor-not-allowed" 
              : "bg-green-600 hover:bg-green-700"
          } text-white`}
        >
          {loading ? "Registering..." : "Register"}
        </button>
        <p className="text-center mt-3 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}

export default RegisterForm;
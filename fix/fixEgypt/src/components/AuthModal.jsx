import { useState, useContext } from "react";
import { AppContext } from "../App";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthModal({ open, onClose }) {
  const { login, register, isVerified, isLoggedIn, checkAuth } = useContext(AppContext);
  const [mode, setMode] = useState("login"); // 'login' | 'register' | 'verify'
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    nationalId: "",
    phone: "",
    address: "",
    city: "",
    governorate: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const success = await login(form.email, form.password);
    setLoading(false);
    if (!success) setError("Invalid credentials or not verified.");
    else {
      checkAuth();
      onClose();
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const success = await register(form);
    setLoading(false);
    if (!success) setError("Registration failed.");
    else setMode("login");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative"
      >
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="mb-6 text-center">
          <img src="https://upload.wikimedia.org/wikipedia/commons/f/fe/Flag_of_Egypt.svg" alt="Egypt Flag" className="w-10 h-6 mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-gray-800">{mode === "login" ? "Login" : mode === "register" ? "Register" : "Verify Email"}</h2>
        </div>
        <AnimatePresence mode="wait">
          {mode === "login" && (
            <motion.form
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                value={form.email}
                onChange={handleChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                value={form.password}
                onChange={handleChange}
                required
              />
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
              <div className="text-sm text-center mt-2">
                Don't have an account?{' '}
                <button type="button" className="text-red-600 hover:underline" onClick={() => setMode("register")}>Register</button>
              </div>
            </motion.form>
          )}
          {mode === "register" && (
            <motion.form
              key="register"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onSubmit={handleRegister}
              className="space-y-3"
            >
              <input type="text" name="firstName" placeholder="First Name" className="w-full px-4 py-2 border rounded-lg" value={form.firstName} onChange={handleChange} required />
              <input type="text" name="lastName" placeholder="Last Name" className="w-full px-4 py-2 border rounded-lg" value={form.lastName} onChange={handleChange} required />
              <input type="text" name="nationalId" placeholder="National ID" className="w-full px-4 py-2 border rounded-lg" value={form.nationalId} onChange={handleChange} required />
              <input type="email" name="email" placeholder="Email" className="w-full px-4 py-2 border rounded-lg" value={form.email} onChange={handleChange} required />
              <input type="password" name="password" placeholder="Password" className="w-full px-4 py-2 border rounded-lg" value={form.password} onChange={handleChange} required />
              <input type="text" name="phone" placeholder="Phone" className="w-full px-4 py-2 border rounded-lg" value={form.phone} onChange={handleChange} required />
              <input type="text" name="address" placeholder="Address" className="w-full px-4 py-2 border rounded-lg" value={form.address} onChange={handleChange} />
              <input type="text" name="city" placeholder="City" className="w-full px-4 py-2 border rounded-lg" value={form.city} onChange={handleChange} />
              <input type="text" name="governorate" placeholder="Governorate" className="w-full px-4 py-2 border rounded-lg" value={form.governorate} onChange={handleChange} />
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                disabled={loading}
              >
                {loading ? "Registering..." : "Register"}
              </button>
              <div className="text-sm text-center mt-2">
                Already have an account?{' '}
                <button type="button" className="text-red-600 hover:underline" onClick={() => setMode("login")}>Login</button>
              </div>
            </motion.form>
          )}
          {mode === "verify" && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="text-center"
            >
              <p className="mb-4 text-gray-700">Please check your email and verify your account to continue.</p>
              <button
                className="w-full py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                onClick={onClose}
              >
                Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
} 
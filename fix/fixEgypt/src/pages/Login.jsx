import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { motion as Motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Mail, ArrowRight, X } from "lucide-react";
import { AppContext } from "../App";
import { authAPI } from "../utils/api";

// Import fonts
import "@fontsource/cairo";
import "@fontsource/poppins";

// Egypt flag colors
const EGYPT_COLORS = {
  red: "#E41E2B",
  white: "#FFFFFF",
  black: "#000000",
  gold: "#C09E77",
};

export default function Login() {
  const { login, isLoggedIn, isLoading } = useContext(AppContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Forgot password modal state
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const modalRef = useRef(null);

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/");
    }
  }, [isLoggedIn, navigate]);

  // Handle click outside modal
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowForgotPasswordModal(false);
      }
    }
    
    if (showForgotPasswordModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showForgotPasswordModal]);

  const validate = () => {
    const newErrors = {};
    setLoginError("");
    
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!formData.email.includes("@")) {
      newErrors.email = "Invalid email format";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault(); // Ensure the event is properly prevented
    }
    
    const newErrors = validate();
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      setLoginError("");
      
      try {
        const success = await login(formData.email, formData.password);
        if (success) {
          toast.success("Login successful!");
          // Navigation is handled by the useEffect
        } else {
          // Handle specific error scenarios
          setLoginError("Invalid email or password. Please try again.");
        }
      } catch (error) {
        console.error("Login error:", error);
        
        // Set appropriate error message based on error type
        if (error.response?.status === 401) {
          setLoginError("Invalid credentials. Please check your email and password.");
        } else if (error.response?.status === 403) {
          setLoginError("Your account is not verified. Please check your email for verification link.");
        } else {
          setLoginError("Login failed. Please try again later.");
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error for the field being edited
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: undefined
      });
    }
    // Clear general login error when typing
    if (loginError) {
      setLoginError("");
    }
  };
  
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail || !forgotPasswordEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsSendingResetEmail(true);
    
    try {
      const response = await authAPI.forgotPassword(forgotPasswordEmail);
      
      if (response.success) {
        toast.success("Password reset link sent to your email");
        setShowForgotPasswordModal(false);
        setForgotPasswordEmail("");
      } else {
        toast.error(response.error?.message || "Failed to send reset link");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error("Failed to send reset link. Please try again later.");
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col lg:flex-row bg-[#f9f9f9]"
    >
      {/* Image Section */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#00000095] via-[#00000040] to-[#f9f9f9]"></div>
        <img
          src="https://egyptunitedvoice.com/wp-content/uploads/2020/09/2020-09-15-egypt-capital-cairo-skyview.png?w=2000&h="
          alt="Egyptian Cityscape"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-center items-start p-16">
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-24 h-6 flex mb-6"
          >
            <div className="h-full w-1/3 bg-[#E41E2B]"></div>
            <div className="h-full w-1/3 bg-white"></div>
            <div className="h-full w-1/3 bg-black"></div>
          </Motion.div>
          <Motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl font-bold text-white mb-2 font-cairo"
          >
            Fix Egypt
          </Motion.h1>
          <Motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-gray-200 mb-8 font-poppins max-w-md"
          >
            Help improve infrastructure across Egypt by reporting issues in your community
          </Motion.p>
          <Motion.div 
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "4rem" }}
            transition={{ delay: 0.6 }}
            className="h-1 bg-[#C09E77] mb-6"
          />
          <Motion.blockquote 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="italic text-gray-100 font-light font-poppins text-lg"
          >
            "Together we can build a better Egypt, one report at a time."
          </Motion.blockquote>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-6">
        <Motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="bg-white p-8 rounded-2xl shadow-xl border-t-4 border-[#E41E2B]">
            <div className="flex items-center mb-8">
              <div className="w-14 h-14 mr-4 flex-shrink-0 relative">
                {/* Egyptian pyramid logo with sun disk (Ra symbol) */}
                <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="36" height="12" fill={EGYPT_COLORS.red} />
                  <rect y="12" width="36" height="12" fill={EGYPT_COLORS.white} />
                  <rect y="24" width="36" height="12" fill={EGYPT_COLORS.black} />
                  
                  {/* Pyramid with golden overlay */}
                  <path 
                    d="M18 8.5L8 27.5H28L18 8.5Z" 
                    fill={EGYPT_COLORS.gold} 
                    stroke="white" 
                    strokeWidth="0.5"
                  />
                  
                  {/* Sun disk (Ra symbol) */}
                  <circle cx="18" cy="7" r="4" fill="#E41E2B" />
                  <circle cx="18" cy="7" r="2" fill="#FFDD00" />
                </svg>
                
                {/* Animated glow effect */}
                <div className="absolute inset-0 opacity-40 animate-pulse bg-gradient-to-tr from-[#E41E2B]/0 via-[#E41E2B]/0 to-[#C09E77] rounded-full blur-md"></div>
              </div>
              <div>
                <h2 className="text-3xl font-bold font-cairo text-[#E41E2B]">
                  Welcome Back
                </h2>
                <p className="text-gray-600 font-poppins text-sm">
                  Login to continue your journey with Fix Egypt
                </p>
              </div>
            </div>
            
            {/* Egyptian pattern divider */}
            <div className="relative h-4 mb-8 overflow-hidden">
              <div className="absolute inset-0 flex">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="h-4 w-2 bg-[#E41E2B]/20"></div>
                ))}
              </div>
              <div className="absolute inset-0 flex justify-center items-center">
                <div className="h-1 w-24 bg-gradient-to-r from-[#E41E2B] via-[#E41E2B] to-[#C09E77]"></div>
              </div>
            </div>

            {/* Login Error Message */}
            {loginError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg font-poppins text-sm">
                {loginError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium font-poppins flex items-center text-gray-700">
                  <span className="w-2 h-2 bg-[#E41E2B] mr-1.5 rounded-sm"></span>
                  Email
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    onChange={handleChange}
                    value={formData.email}
                    className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 font-poppins text-gray-900
                    ${errors.email 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-200" 
                      : "border-[#E41E2B]/20 focus:border-[#E41E2B] focus:ring-[#E41E2B]/20"}`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1 font-poppins">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium font-poppins flex items-center text-gray-700">
                  <span className="w-2 h-2 bg-[#E41E2B] mr-1.5 rounded-sm"></span>
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    onChange={handleChange}
                    value={formData.password}
                    className={`w-full pl-10 pr-10 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 font-poppins text-gray-900
                    ${errors.password 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-200" 
                      : "border-[#E41E2B]/20 focus:border-[#E41E2B] focus:ring-[#E41E2B]/20"}`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1 font-poppins">{errors.password}</p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={() => setShowForgotPasswordModal(true)}
                  className="text-sm text-[#E41E2B] hover:text-[#C41E2B] font-poppins transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <Motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full bg-gradient-to-r from-[#E41E2B] to-[#C41E2B] hover:from-[#C41E2B] hover:to-[#B41E2B] text-white font-semibold py-3 rounded-lg transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-cairo text-lg flex items-center justify-center"
                onClick={(e) => {
                  e.preventDefault(); // Additional prevention here
                  handleSubmit(e);
                }}
              >
                {isSubmitting || isLoading ? (
                  <span className="inline-flex items-center justify-center">
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Logging in...
                  </span>
                ) : (
                  <span className="inline-flex items-center">
                    Login
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </span>
                )}
              </Motion.button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600 font-poppins">
                Don't have an account?{" "}
                <Link to="/signup" className="text-[#E41E2B] hover:text-[#C41E2B] font-medium transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
          
          {/* Mobile banner - only shows on small screens */}
          <div className="mt-8 lg:hidden">
            <div className="w-full flex justify-center mb-4">
              <div className="w-24 h-6 flex">
                <div className="h-full w-1/3 bg-[#E41E2B]"></div>
                <div className="h-full w-1/3 bg-white"></div>
                <div className="h-full w-1/3 bg-black"></div>
              </div>
            </div>
            <h3 className="text-center text-xl font-bold font-cairo text-[#E41E2B] mb-2">Fix Egypt</h3>
            <p className="text-center text-gray-600 font-poppins text-sm">Help improve infrastructure across Egypt</p>
          </div>
        </Motion.div>
      </div>
      
      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            ref={modalRef}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold font-cairo text-[#E41E2B]">Reset Password</h3>
              <button 
                onClick={() => setShowForgotPasswordModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4 font-poppins text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            <form onSubmit={handleForgotPassword}>
              <div className="mb-4">
                <label className="block text-sm font-medium font-poppins text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-[#E41E2B]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E41E2B]/20 focus:border-[#E41E2B] font-poppins"
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="flex-1 py-2 border-2 border-[#E41E2B]/20 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition font-poppins"
                  disabled={isSendingResetEmail}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-[#E41E2B] to-[#C41E2B] text-white rounded-lg font-semibold hover:from-[#C41E2B] hover:to-[#B41E2B] transition flex items-center justify-center font-poppins"
                  disabled={isSendingResetEmail}
                >
                  {isSendingResetEmail ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Sending...
                    </>
                  ) : "Send Link"}
                </button>
              </div>
            </form>
          </Motion.div>
        </div>
      )}
    </Motion.div>
  );
}

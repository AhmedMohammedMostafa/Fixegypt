import { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { motion as Motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AppContext } from "../App";

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

export default function Signup() {
  const { register, isLoggedIn, isLoading } = useContext(AppContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nationalId: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    city: "",
    governorate: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/");
    }
  }, [isLoggedIn, navigate]);

  const validate = () => {
    const newErrors = {};

    // Name fields
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required.";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required.";
    }

    // Email & Password
    if (!formData.email.includes("@")) {
      newErrors.email = "Invalid email.";
    }
    if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    // IDs & Phone
    if (formData.nationalId.length !== 14) {
      newErrors.nationalId = "National ID must be 14 digits.";
    }
    if (formData.phone.length !== 11) {
      newErrors.phone = "Phone number must be 11 digits.";
    }

    // Address fields
    if (!formData.address.trim()) {
      newErrors.address = "Address is required.";
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required.";
    }
    if (!formData.governorate.trim()) {
      newErrors.governorate = "Governorate is required.";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }
    const newErrors = validate();
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      try {
        const success = await register(formData);
        if (success) {
          toast.success("Registration successful! Please check your email to verify your account.");
          
          // Check if user is automatically logged in (tokens were received)
          if (isLoggedIn) {
            // If logged in, navigate to home page
            navigate("/");
          } else {
            // Otherwise navigate to login page
            setTimeout(() => navigate("/login"), 1500);
          }
        }
      } catch (error) {
        console.error("Registration error:", error);
        
        // Provide more specific error messages based on error type
        if (error.response?.status === 409) {
          toast.error("Email or National ID already exists. Please use different credentials.");
        } else if (error.response?.status === 400) {
          toast.error("Invalid data provided. Please check your information and try again.");
        } else {
          toast.error("Registration failed. Please try again later.");
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-tl from-white via-white to-[#E41E2B]/10 flex items-center justify-center px-4 py-4">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-2xl border-t-4 border-[#E41E2B]">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 mr-4 flex-shrink-0 relative">
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
            <div className="absolute inset-0 opacity-30 animate-pulse bg-gradient-to-tr from-[#E41E2B]/0 via-[#E41E2B]/0 to-[#C09E77] rounded-full blur-md"></div>
          </div>
          <div>
            <h2 className="text-3xl font-bold font-cairo text-[#E41E2B]">
              Create Account
            </h2>
            <p className="text-gray-600 font-poppins text-sm">
              Join the community and report infrastructure issues
            </p>
          </div>
        </div>
        
        {/* Egyptian pattern divider */}
        <div className="relative h-4 mb-6 overflow-hidden">
          <div className="absolute inset-0 flex">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="h-4 w-2 bg-[#E41E2B]/20"></div>
            ))}
          </div>
          <div className="absolute inset-0 flex justify-center items-center">
            <div className="h-1 w-16 bg-[#E41E2B]"></div>
          </div>
        </div>
        
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4"
        >
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium">First Name</label>
            <input
              type="text"
              name="firstName"
              onChange={handleChange}
              value={formData.firstName}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.firstName && (
              <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium">Last Name</label>
            <input
              type="text"
              name="lastName"
              onChange={handleChange}
              value={formData.lastName}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.lastName && (
              <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              onChange={handleChange}
              value={formData.email}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* National Number */}
          <div>
            <label className="block text-sm font-medium">National Number</label>
            <input
              type="text"
              name="nationalId"
              maxLength="14"
              onChange={handleChange}
              value={formData.nationalId}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.nationalId && (
              <p className="text-sm text-red-500 mt-1">{errors.nationalId}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium">Phone Number</label>
            <input
              type="tel"
              name="phone"
              maxLength="11"
              onChange={handleChange}
              value={formData.phone}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.phone && (
              <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              onChange={handleChange}
              value={formData.password}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-sm text-blue-600 hover:underline"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium">Address</label>
            <input
              type="text"
              name="address"
              onChange={handleChange}
              value={formData.address}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.address && (
              <p className="text-sm text-red-500 mt-1">{errors.address}</p>
            )}
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium">City</label>
            <input
              type="text"
              name="city"
              onChange={handleChange}
              value={formData.city}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.city && (
              <p className="text-sm text-red-500 mt-1">{errors.city}</p>
            )}
          </div>

          {/* Governorate */}
          <div>
            <label className="block text-sm font-medium">Governorate</label>
            <input
              type="text"
              name="governorate"
              onChange={handleChange}
              value={formData.governorate}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.governorate && (
              <p className="text-sm text-red-500 mt-1">{errors.governorate}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="sm:col-span-2">
            <Motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full bg-gradient-to-r from-[#E41E2B] to-[#C41E2B] hover:from-[#C41E2B] hover:to-[#B41E2B] text-white font-semibold py-3 rounded-lg transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-cairo text-lg"
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e);
              }}
            >
              {isSubmitting || isLoading ? (
                <span className="inline-flex items-center justify-center">
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Creating Account...
                </span>
              ) : (
                "Sign Up"
              )}
            </Motion.button>
          </div>
        </form>
        <p className="text-center text-sm mt-4 text-gray-600 font-poppins">
          Already have an account?{" "}
          <Link to="/login" className="text-[#E41E2B] hover:underline font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

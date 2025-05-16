import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { createContext, useState, useEffect, useContext } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import "./index.css";
import Admin from "./pages/Admin";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Signup from "./pages/Signup";
import EgyptianLoader from "./components/EgyptianLoader";
import { authAPI, userAPI } from "./utils/api";

// Create global context
export const AppContext = createContext(null);

// VerifyEmail component for handling email verification
const VerifyEmail = () => {
  const { isLoading } = useContext(AppContext);
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Verifying your email...');
  
  useEffect(() => {
    const verifyUserEmail = async () => {
      try {
        // Get token from URL query parameter
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        
        if (!token) {
          setStatus('error');
          setMessage('Verification token is missing.');
          return;
        }
        
        // Call API to verify email - using the token as a path parameter
        // The API expects /auth/verify-email/:token format
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/verify-email/${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setStatus('success');
          setMessage('Your email has been verified successfully! You can now login to your account.');
        } else {
          setStatus('error');
          setMessage(data.message || 'Failed to verify email. The token may be invalid or expired.');
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again later.');
      }
    };
    
    verifyUserEmail();
  }, []);
  
  if (isLoading) {
    return <EgyptianLoader />;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Email Verification</h2>
        </div>
        
        {status === 'verifying' && (
          <div className="text-center">
            <EgyptianLoader />
            <p className="text-gray-600 mt-4">{message}</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-600 mb-6">{message}</p>
            <a href="/login" className="inline-block bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition">
              Login to Your Account
            </a>
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex space-x-4 justify-center">
              <a href="/" className="inline-block bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition">
                Go Home
              </a>
              <a href="/login" className="inline-block bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition">
                Login
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Admin Route component for protected routes
const AdminRoute = ({ children }) => {
  const { isLoggedIn, user, isLoading } = useContext(AppContext);
  
  if (isLoading) {
    return <EgyptianLoader />;
  }
  
  if (!isLoggedIn || user?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [isVerified, setIsVerified] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check authentication on mount
  useEffect(() => {
    const verifyAuth = async () => {
      setIsLoading(true);
      if (token) {
        try {
          const response = await userAPI.getProfile();
          console.log("Profile response:", response);
          
          if (response.success) {
            // Handle different response structures - fix the "user" undefined error
            const userData = response.data?.user || response.data?.data?.user;
            
            if (userData) {
              setUser(userData);
              setIsLoggedIn(true);
              setIsVerified(userData?.isVerified || false);
              setIsAdmin(userData?.role === 'admin');
            } else {
              console.error("User data not found in profile response:", response);
              handleLogout();
            }
          } else {
            // Token invalid, clear everything
            handleLogout();
          }
        } catch (error) {
          console.error("Auth verification failed:", error);
          handleLogout();
        }
      } else {
        setIsLoggedIn(false);
        setUser(null);
        setIsVerified(false);
        setIsAdmin(false);
      }
      setIsLoading(false);
    };
    
    verifyAuth();
  }, [token]);

  // Login function
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      console.log("Login API response:", response);
      
      if (response.success) {
        // Changed: Handle both response formats - the one with data.data.tokens and the one with data.tokens
        // Safely access nested properties with optional chaining
        const accessToken = response.data?.tokens?.accessToken || response.data?.data?.tokens?.accessToken;
        const refreshToken = response.data?.tokens?.refreshToken || response.data?.data?.tokens?.refreshToken;
        const userData = response.data?.user || response.data?.data?.user;
        
        if (!accessToken || !refreshToken || !userData) {
          console.error("Login response missing required data:", response);
          toast.error("Invalid response from server. Please try again.");
          return false;
        }
        
        setToken(accessToken);
        localStorage.setItem("token", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        setUser(userData);
        setIsLoggedIn(true);
        setIsVerified(userData?.isVerified || false);
        setIsAdmin(userData?.role === 'admin');
        toast.success("Logged in successfully");
        return true;
      } else {
        console.error("Login failed:", response.error);
        toast.error(response.error?.message || "Login failed");
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (registerData) => {
    setIsLoading(true);
    try {
      const response = await authAPI.register(registerData);
      
      if (response.success) {
        // Check if the response includes tokens (automatic login)
        if (response.data.data && response.data.data.tokens) {
          const { accessToken, refreshToken } = response.data.data.tokens;
          const userData = response.data.data.user;
          
          // Store tokens and set user data (same as login)
          setToken(accessToken);
          localStorage.setItem("token", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
          setUser(userData);
          setIsLoggedIn(true);
          setIsVerified(userData?.isVerified || false);
          setIsAdmin(userData?.role === 'admin');
        }
        
        toast.success(response.data.message || "Registered successfully. Please check your email to verify your account.");
        return true;
      } else {
        toast.error(response.error.message || "Registration failed");
        return false;
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Registration failed. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setToken("");
      setUser(null);
      setIsLoggedIn(false);
      setIsVerified(false);
      setIsAdmin(false);
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      toast.info("Logged out");
      setIsLoading(false);
    }
  };

  // Context value
  const contextValue = {
    user,
    setUser,
    reports,
    setReports,
    isLoggedIn,
    setIsLoggedIn,
    token,
    setToken,
    isVerified,
    setIsVerified,
    isAdmin,
    setIsAdmin,
    isLoading,
    setIsLoading,
    login,
    register,
    logout: handleLogout,
    checkAuth: async () => {
      if (token) {
        try {
          const response = await userAPI.getProfile();
          if (response.success) {
            const userData = response.data.data.user;
            setUser(userData);
            setIsLoggedIn(true);
            setIsVerified(userData?.isVerified || false);
            setIsAdmin(userData?.role === 'admin');
            return true;
          }
        } catch (error) {
          console.error("Auth check failed:", error);
        }
      }
      return false;
    }
  };

  return (
    <AppContext.Provider value={contextValue}>
      <BrowserRouter>
        {isLoading && <EgyptianLoader />}
        <ToastContainer 
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Routes>
          <Route>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/admin" element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  );
}

export default App;

import "leaflet/dist/leaflet.css";
import { useMemo, useState, useContext, useEffect } from "react";
import DataTable from "react-data-table-component";
import { AppContext } from "../App";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { adminAPI } from "../utils/api";
import { reportAPI } from "../utils/api";

// Import Leaflet for map markers
import L from 'leaflet';

// Lucide icons for UI elements
import { 
  Users, ClipboardList, BarChart3, MapPin, Gift, 
  Lock, Calendar, Settings, CheckCircle, User, 
  AlertTriangle, LogOut, Eye, Edit, Trash, Search,
  Info, FileText, Map, Package, Award, Clock, X,
  ChevronDown, Filter, RefreshCw, Plus, Menu
} from "lucide-react";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";

// Egyptian-themed colors
const EGYPT_COLORS = {
  red: "#E41E2B",
  white: "#FFFFFF",
  black: "#000000",
  gold: "#C09E77",
  blue: "#3b82f6",
  teal: "#0d9488",
  sand: "#f5d0a9",
  pharaoh: "#c19a6b",
  nile: "#4b9cd3",
  desert: "#e9d8a6"
};

// Chart colors based on Egyptian theme
const CHART_COLORS = [
  EGYPT_COLORS.red,
  EGYPT_COLORS.nile,
  EGYPT_COLORS.pharaoh,
  EGYPT_COLORS.teal,
  EGYPT_COLORS.desert,
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#6b7280",
  "#84cc16",
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border">
        <p className="font-bold text-gray-700">
          {label.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
        </p>
        <p className="text-blue-600">{payload[0].value} Reports</p>
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const total =
      payload[0].payload.total ||
      payload.reduce((sum, entry) => sum + entry.value, 0);
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border">
        <p className="font-bold text-gray-700 capitalize">
          {payload[0].name.replace(/_/g, " ")}
        </p>
        <p className="text-blue-600">{payload[0].value} Reports</p>
        <p className="text-sm text-gray-500">
          ({((payload[0].value / total) * 100).toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

const RADIAN = Math.PI / 180;
const CustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 1.35;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#475569"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Modern button component
const Button = ({ 
  children, 
  onClick, 
  variant = "primary", 
  size = "md", 
  icon, 
  className = "" 
}) => {
  const baseClasses = "flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: `bg-[${EGYPT_COLORS.red}] hover:bg-[#c41e2b] text-white focus:ring-[${EGYPT_COLORS.red}]`,
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-300",
    success: "bg-green-500 hover:bg-green-600 text-white focus:ring-green-500",
    danger: "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500",
    warning: "bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-500",
    info: "bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500"
  };
  
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-3 text-base"
  };
  
  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

// Dropdown component
const Dropdown = ({ 
  label, 
  options, 
  value, 
  onChange, 
  className = "" 
}) => {
  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E41E2B] focus:border-[#E41E2B] sm:text-sm rounded-lg shadow-sm appearance-none"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </div>
      </div>
    </div>
  );
};

// Search input component
const SearchInput = ({ 
  value, 
  onChange, 
  placeholder = "Search...", 
  className = "" 
}) => {
  return (
    <div className={`relative rounded-lg shadow-sm ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="text"
        value={value}
        onChange={onChange}
        className="pl-10 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg focus:ring-[#E41E2B] focus:border-[#E41E2B]"
        placeholder={placeholder}
      />
    </div>
  );
};

// Badge component
const Badge = ({ 
  children, 
  variant = "default", 
  className = "" 
}) => {
  const variantClasses = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    danger: "bg-red-100 text-red-800",
    warning: "bg-yellow-100 text-yellow-800",
    info: "bg-blue-100 text-blue-800",
    pending: "bg-yellow-100 text-yellow-800",
    inProgress: "bg-blue-100 text-blue-800",
    resolved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800"
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Card component
const Card = ({ 
  children, 
  title, 
  className = "", 
  actions 
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {title && (
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          {actions && <div className="flex space-x-2">{actions}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
};

export default function Admin() {
  const { isAdmin, user, logout } = useContext(AppContext);
  const navigate = useNavigate();
  
  // State for active tab
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // States for data
  const [userList, setUserList] = useState([]);
  const [reportList, setReportList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [redemptionList, setRedemptionList] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  
  // Loading states
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingRedemptions, setIsLoadingRedemptions] = useState(false);
  
  // Filter states for various tabs
  const [userFilterValue, setUserFilterValue] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userVerificationFilter, setUserVerificationFilter] = useState("all");
  
  // Handle role change for a user
  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await adminAPI.updateUserRole(userId, { role: newRole });
      if (response.success) {
        toast.success(`User role updated to ${newRole}`);
        // Update the local user list
        setUserList(prev => 
          prev.map(user => 
            user.id === userId ? { ...user, role: newRole } : user
          )
        );
      } else {
        toast.error(response.error?.message || "Failed to update user role");
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Error updating user role");
    }
  };
  
  // Handle user verification
  const handleVerifyUser = async (userId) => {
    try {
      console.log(`Attempting to verify user with ID: ${userId}`);
      
      const response = await adminAPI.verifyUser(userId);
      console.debug('Verify user API response:', response);
      
      if (response.success || response.status === 'success') {
        toast.success("User verified successfully");
        
        // Update the local user list
        setUserList(prev => 
          prev.map(user => 
            user.id === userId ? { ...user, isVerified: true } : user
          )
        );
        
        // Refresh the users list
        fetchUsers();
        
        // Also refresh dashboard if we're viewing it
        if (activeTab === "dashboard") {
          fetchDashboardStats();
        }
      } else {
        console.error('Failed to verify user:', response.error || response.message);
        toast.error(response.error?.message || response.message || "Failed to verify user");
      }
    } catch (error) {
      console.error("Error verifying user:", error);
      toast.error("Error verifying user: " + (error.message || "Unknown error"));
    }
  };
  
  // Filter users based on search term and filters
  const filteredUsers = useMemo(() => {
    return userList.filter(user => {
      // Text search filter
      const searchMatch = userFilterValue === "" || 
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(userFilterValue.toLowerCase()) ||
        user.email.toLowerCase().includes(userFilterValue.toLowerCase()) ||
        user.nationalId?.toLowerCase().includes(userFilterValue.toLowerCase());
      
      // Role filter
      const roleMatch = userRoleFilter === "all" || user.role === userRoleFilter;
      
      // Verification filter
      const verificationMatch = 
        userVerificationFilter === "all" || 
        (userVerificationFilter === "verified" && user.isVerified) ||
        (userVerificationFilter === "unverified" && !user.isVerified);
      
      return searchMatch && roleMatch && verificationMatch;
    });
  }, [userList, userFilterValue, userRoleFilter, userVerificationFilter]);
  
  // User columns for DataTable
  const userColumns = useMemo(() => [
    {
      name: "Name",
      selector: row => `${row.firstName} ${row.lastName}`,
      sortable: true,
      cell: row => (
        <div className="py-2">
          <div className="font-medium">{row.firstName} {row.lastName}</div>
          <div className="text-xs text-gray-500">{row.email}</div>
        </div>
      ),
    },
    {
      name: "National ID",
      selector: row => row.nationalId,
      sortable: true,
    },
    {
      name: "Location",
      selector: row => `${row.city}, ${row.governorate}`,
      sortable: true,
      cell: row => (
        <div className="py-2">
          <div>{row.city}</div>
          <div className="text-xs text-gray-500">{row.governorate}</div>
        </div>
      ),
    },
    {
      name: "Role",
      selector: row => row.role,
      sortable: true,
      cell: row => (
        <div className="relative">
          <select
            value={row.role}
            onChange={(e) => handleRoleChange(row.id, e.target.value)}
            className="block w-full pl-3 pr-9 py-1.5 text-sm border border-gray-300 rounded-md bg-white shadow-sm focus:ring-[#E41E2B] focus:border-[#E41E2B] appearance-none"
          >
            <option value="citizen">Citizen</option>
            <option value="admin">Admin</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      ),
    },
    {
      name: "Verification",
      selector: row => row.isVerified,
      sortable: true,
      cell: row => (
        <div>
          {row.isVerified ? (
            <Badge variant="success" className="flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          ) : (
            <button
              onClick={() => handleVerifyUser(row.id)}
              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
            >
              <AlertTriangle className="w-3 h-3 mr-1" />
              Verify Now
            </button>
          )}
        </div>
      ),
    },
    {
      name: "Actions",
      cell: row => (
        <div className="flex space-x-2">
          <button
            onClick={() => console.log("View user details:", row.id)}
            className="p-1 text-blue-500 hover:bg-blue-50 rounded"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => console.log("Edit user:", row.id)}
            className="p-1 text-green-500 hover:bg-green-50 rounded"
            title="Edit User"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ], []);
  
  // Handle logout
  const handleLogout = async () => {
    try {
      // Call logout without checking the response
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("An error occurred during logout");
      // Even if there's an error, still navigate to login
      navigate("/login");
    }
  };
  
  // Fetch users and reports on component mount
  useEffect(() => {
    if (isAdmin) {
      if (activeTab === "dashboard" || activeTab === "overview") {
        fetchDashboardStats();
      }
      if (activeTab === "users" || activeTab === "dashboard") {
        fetchUsers();
      }
      if (activeTab === "reports" || activeTab === "dashboard") {
        fetchReports();
      }
      if (activeTab === "products") {
        fetchProducts();
      }
      if (activeTab === "redemptions") {
        fetchRedemptions();
      }
      if (activeTab === "map") {
        fetchReports();
        fetchMapStatistics();
      }
    }
  }, [isAdmin, activeTab]);
  
  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    setIsLoadingStats(true);
    try {
      console.log('Fetching dashboard stats from API');
      const response = await adminAPI.getDashboardStats();
      console.debug('Dashboard API response:', response);
      
      if (response.success || response.status === 'success') {
        const statsData = response.data;
        console.log('Dashboard stats loaded successfully');
        setDashboardStats({
          counts: {
            reports: statsData.counts?.reports || 0,
            pendingReports: statsData.counts?.pendingReports || 0,
            resolvedReports: statsData.counts?.resolvedReports || 0,
            inProgressReports: statsData.counts?.inProgressReports || 0,
            rejectedReports: statsData.counts?.rejectedReports || 0,
            users: statsData.counts?.users || 0,
            criticalReports: statsData.counts?.criticalReports || 0
          },
          categoryCounts: statsData.distributions?.category || [],
          urgencyCounts: statsData.distributions?.urgency || [],
          // Make sure to map _id to id in the recent data
          recentReports: (statsData.recentReports || []).map(report => ({
            ...report,
            id: report.id || report._id
          })),
          recentUsers: (statsData.recentUsers || []).map(user => ({
            ...user,
            id: user.id || user._id
          }))
        });
      } else {
        console.error('Failed to load dashboard statistics:', response.error || response.message);
        toast.error(response.error?.message || response.message || "Failed to load dashboard statistics");
        // Use empty data structure instead of fake data
        setDashboardStats({
          counts: {
            reports: 0,
            pendingReports: 0,
            resolvedReports: 0,
            inProgressReports: 0,
            rejectedReports: 0,
            users: 0,
            criticalReports: 0
          },
          categoryCounts: [],
          urgencyCounts: [],
          recentReports: [],
          recentUsers: []
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Error loading dashboard statistics");
      // Use empty data structure instead of fake data
      setDashboardStats({
        counts: {
          reports: 0,
          pendingReports: 0,
          resolvedReports: 0,
          inProgressReports: 0,
          rejectedReports: 0,
          users: 0,
          criticalReports: 0
        },
        categoryCounts: [],
        urgencyCounts: [],
        recentReports: [],
        recentUsers: []
      });
    } finally {
      setIsLoadingStats(false);
    }
  };
  
  // Fetch users with the admin API
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      console.log('Fetching users from API');
      const response = await adminAPI.getUsers();
      console.debug('Users API response:', response);
      
      if (response.success || response.status === 'success') {
        const users = response.data.users || [];
        console.log(`Loaded ${users.length} users`);
        
        // Ensure users have id property (might be _id in response)
        const processedUsers = users.map(user => ({
          ...user,
          id: user.id || user._id
        }));
        
        setUserList(processedUsers);
      } else {
        console.error('Failed to load users:', response.error || response.message);
        toast.error(response.error?.message || response.message || "Failed to load users");
        setUserList([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error loading users");
      setUserList([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };
  
  // Fetch all reports
  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      console.log('Fetching reports from API');
      // Get all reports using adminAPI
      const response = await adminAPI.getReports();
      console.debug('Reports API response:', response);
      
      if (response.success) {
        const reports = response.data.reports || [];
        console.log(`Loaded ${reports.length} reports`);
        
        // Process reports to ensure IDs are properly formatted
        const processedReports = reports.map(report => {
          // Create a normalized copy
          const normalizedReport = { ...report };
          
          // Ensure report has id property
          normalizedReport.id = report.id || report._id;
          
          // Handle case where userId might be an object
          if (typeof normalizedReport.userId === 'object') {
            normalizedReport.userId = normalizedReport.userId.id || 
                                      normalizedReport.userId._id || 
                                      normalizedReport.userId.toString();
          }
          
          // Handle case where adminId might be null or an object
          if (normalizedReport.adminId && typeof normalizedReport.adminId === 'object') {
            normalizedReport.adminId = normalizedReport.adminId.id || 
                                       normalizedReport.adminId._id || 
                                       normalizedReport.adminId.toString();
          }
          
          return normalizedReport;
        });
        
        setReportList(processedReports);
      } else {
        // Fallback to regular reports endpoint if admin-specific endpoint fails
        console.log('Admin reports endpoint failed, trying pending reports endpoint');
        const pendingResponse = await adminAPI.getPendingReports();
        console.debug('Pending reports API response:', pendingResponse);
        
        if (pendingResponse.success) {
          const reports = pendingResponse.data.reports || [];
          console.log(`Loaded ${reports.length} pending reports`);
          
          // Process reports to ensure IDs are properly formatted
          const processedReports = reports.map(report => {
            // Create a normalized copy
            const normalizedReport = { ...report };
            
            // Ensure report has id property
            normalizedReport.id = report.id || report._id;
            
            // Handle case where userId might be an object
            if (typeof normalizedReport.userId === 'object') {
              normalizedReport.userId = normalizedReport.userId.id || 
                                        normalizedReport.userId._id || 
                                        normalizedReport.userId.toString();
            }
            
            // Handle case where adminId might be null or an object
            if (normalizedReport.adminId && typeof normalizedReport.adminId === 'object') {
              normalizedReport.adminId = normalizedReport.adminId.id || 
                                         normalizedReport.adminId._id || 
                                         normalizedReport.adminId.toString();
            }
            
            return normalizedReport;
          });
          
          setReportList(processedReports);
        } else {
          console.error('Failed to load reports:', response.error || pendingResponse.error);
          toast.error(response.error?.message || pendingResponse.error?.message || "Failed to load reports");
          setReportList([]);
        }
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Error loading reports");
      setReportList([]);
    } finally {
      setIsLoadingReports(false);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      console.log('Fetching products from API');
      // Using regular productAPI endpoints
      const response = await adminAPI.getProducts();
      console.debug('Products API response:', response);
      
      if (response.success) {
        console.log(`Loaded ${response.data.products?.length || 0} products`);
        setProductList(response.data.products || []);
      } else {
        console.error('Failed to load products:', response.error);
        toast.error(response.error?.message || "Failed to load products");
        setProductList([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Error loading products");
      setProductList([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };
  
  // Fetch redemptions
  const fetchRedemptions = async () => {
    setIsLoadingRedemptions(true);
    try {
      console.log('Fetching redemptions from API');
      // Using regular redemptionAPI endpoints
      const response = await adminAPI.getRedemptions();
      console.debug('Redemptions API response:', response);
      
      if (response.success) {
        console.log(`Loaded ${response.data.redemptions?.length || 0} redemptions`);
        setRedemptionList(response.data.redemptions || []);
      } else {
        console.error('Failed to load redemptions:', response.error);
        toast.error(response.error?.message || "Failed to load redemptions");
        setRedemptionList([]);
      }
    } catch (error) {
      console.error("Error fetching redemptions:", error);
      toast.error("Error loading redemptions");
      setRedemptionList([]);
    } finally {
      setIsLoadingRedemptions(false);
    }
  };

  // Handle report status update
  const handleStatusUpdate = async (reportId, newStatus, note = "") => {
    try {
      // Ensure reportId is valid
      if (!reportId) {
        toast.error("Error: Report ID is undefined or null");
        return;
      }
      
      // Normalize ID if it's an object
      const normalizedId = typeof reportId === 'object' 
        ? (reportId.id || reportId._id || reportId.toString()) 
        : reportId;
      
      if (!normalizedId) {
        toast.error("Error: Could not extract a valid report ID");
        return;
      }
      
      console.log(`Updating report ${normalizedId} status to ${newStatus}`);
      
      // Call the admin API to update report status
      const response = await adminAPI.updateReportStatus(normalizedId, { status: newStatus, note });
      if (response.success) {
        toast.success(`Report status updated to ${newStatus}`);
        // Update the local report lists
        setReportList(prevList => 
          prevList.map(report => 
            (report.id === normalizedId || report._id === normalizedId) 
              ? { ...report, status: newStatus } 
              : report
          )
        );
        
        // Refresh the report lists to get the latest data
        fetchReports();
        // If we're on the dashboard, also refresh dashboard stats
        if (activeTab === "dashboard") {
          fetchDashboardStats();
        }
      } else {
        toast.error(response.error?.message || "Failed to update report status");
      }
    } catch (error) {
      console.error("Error updating report status:", error);
      toast.error("Error updating report status");
    }
  };

  // State for the selected report to view details
  const [selectedReport, setSelectedReport] = useState(null);
  const [isViewingReport, setIsViewingReport] = useState(false);
  const [statusNote, setStatusNote] = useState("");

  // Open report details modal
  const openReportDetails = (report) => {
    // Create a normalized copy of the report to handle user data properly
    const normalizedReport = { ...report };
    
    // Ensure report has an ID property
    normalizedReport.id = report.id || report._id;
    
    // Handle userDetails if present in the report
    if (normalizedReport.userDetails) {
      normalizedReport.userName = `${normalizedReport.userDetails.firstName} ${normalizedReport.userDetails.lastName}`;
      normalizedReport.userEmail = normalizedReport.userDetails.email;
      normalizedReport.userId = normalizedReport.userDetails.id;
    }
    // Handle the case where userId is populated with a full user object
    else if (normalizedReport.userId && typeof normalizedReport.userId === 'object') {
      const userObject = normalizedReport.userId;
      
      // Extract user info from userId object
      normalizedReport.userObject = userObject;
      normalizedReport.userName = userObject.firstName && userObject.lastName 
        ? `${userObject.firstName} ${userObject.lastName}`
        : userObject.email || "Anonymous";
      normalizedReport.userEmail = userObject.email || "N/A";
      normalizedReport.userId = userObject.id || userObject._id || "N/A";
    }
    
    // Handle user data if it exists in the user property
    if (normalizedReport.user && typeof normalizedReport.user === 'object') {
      const userObject = normalizedReport.user;
      
      // Only override if the values aren't already set
      if (!normalizedReport.userObject) normalizedReport.userObject = userObject;
      if (!normalizedReport.userName || normalizedReport.userName === "N/A") {
        normalizedReport.userName = userObject.firstName && userObject.lastName 
          ? `${userObject.firstName} ${userObject.lastName}`
          : userObject.email || "Anonymous";
      }
      if (!normalizedReport.userEmail || normalizedReport.userEmail === "N/A") {
        normalizedReport.userEmail = userObject.email || "N/A";
      }
      if (!normalizedReport.userId || normalizedReport.userId === "N/A") {
        normalizedReport.userId = userObject.id || userObject._id || "N/A";
      }
    }
    
    // If userName is directly an object (rare case)
    if (normalizedReport.userName && typeof normalizedReport.userName === 'object') {
      normalizedReport.userName = normalizedReport.userName.firstName && normalizedReport.userName.lastName 
        ? `${normalizedReport.userName.firstName} ${normalizedReport.userName.lastName}`
        : normalizedReport.userName.email || "Anonymous";
    }
    
    // Always ensure final values are strings
    normalizedReport.userName = typeof normalizedReport.userName === 'object' 
      ? JSON.stringify(normalizedReport.userName) 
      : (normalizedReport.userName || "Anonymous");
      
    normalizedReport.userEmail = typeof normalizedReport.userEmail === 'object' 
      ? normalizedReport.userEmail.email || "N/A" 
      : (normalizedReport.userEmail || "N/A");
      
    normalizedReport.userId = typeof normalizedReport.userId === 'object' 
      ? (normalizedReport.userId.id || normalizedReport.userId._id || "N/A") 
      : (normalizedReport.userId || "N/A");
    
    setSelectedReport(normalizedReport);
    setIsViewingReport(true);
  };

  // Close report details modal
  const closeReportDetails = () => {
    setSelectedReport(null);
    setIsViewingReport(false);
    setStatusNote("");
  };

  // Filter states for reports
  const [reportFilterValue, setReportFilterValue] = useState("");
  const [reportStatusFilter, setReportStatusFilter] = useState("all");
  const [reportCategoryFilter, setReportCategoryFilter] = useState("all");
  const [reportUrgencyFilter, setReportUrgencyFilter] = useState("all");

  // Filter reports based on search term and filters
  const filteredReports = useMemo(() => {
    return reportList.filter(report => {
      // Text search filter
      const searchMatch = reportFilterValue === "" || 
        report.title.toLowerCase().includes(reportFilterValue.toLowerCase()) ||
        report.description.toLowerCase().includes(reportFilterValue.toLowerCase()) ||
        (report.location?.address && report.location.address.toLowerCase().includes(reportFilterValue.toLowerCase()));
      
      // Status filter
      const statusMatch = reportStatusFilter === "all" || report.status === reportStatusFilter;
      
      // Category filter
      const categoryMatch = reportCategoryFilter === "all" || report.category === reportCategoryFilter;
      
      // Urgency filter
      const urgencyMatch = reportUrgencyFilter === "all" || report.urgency === reportUrgencyFilter;
      
      return searchMatch && statusMatch && categoryMatch && urgencyMatch;
    });
  }, [reportList, reportFilterValue, reportStatusFilter, reportCategoryFilter, reportUrgencyFilter]);

  // Report status badge
  const ReportStatusBadge = ({ status }) => {
    let className = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ";
    let statusText = status.replace(/-/g, " ");
    
    switch(status) {
      case "pending":
        className += "bg-yellow-100 text-yellow-800";
        break;
      case "in-progress":
      case "in_progress":
        className += "bg-blue-100 text-blue-800";
        statusText = "In Progress";
        break;
      case "resolved":
        className += "bg-green-100 text-green-800";
        break;
      case "rejected":
        className += "bg-red-100 text-red-800";
        break;
      default:
        className += "bg-gray-100 text-gray-800";
    }
    
    return <span className={className}>{statusText}</span>;
  };
  
  // Report category badge
  const ReportCategoryBadge = ({ category }) => {
    const formattedCategory = category.replace(/_/g, " ");
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
        {formattedCategory}
      </span>
    );
  };

  // Report columns for DataTable
  const reportColumns = useMemo(() => [
    {
      name: "Title",
      selector: row => row.title,
      sortable: true,
      cell: row => (
        <div className="py-2">
          <div className="font-medium truncate" style={{ maxWidth: "200px" }}>
            {row.title}
          </div>
          <div className="text-xs text-gray-500 truncate" style={{ maxWidth: "200px" }}>
            {row.description?.substring(0, 50)}
            {row.description?.length > 50 ? "..." : ""}
          </div>
        </div>
      ),
    },
    {
      name: "Category",
      selector: row => row.category,
      sortable: true,
      cell: row => <ReportCategoryBadge category={row.category} />,
    },
    {
      name: "Location",
      selector: row => row.location?.address,
      sortable: true,
      cell: row => (
        <div className="py-2 truncate" style={{ maxWidth: "150px" }}>
          <div>{row.location?.address}</div>
          <div className="text-xs text-gray-500">
            {row.location?.city}, {row.location?.governorate}
          </div>
        </div>
      ),
    },
    {
      name: "Status",
      selector: row => row.status,
      sortable: true,
      cell: row => <ReportStatusBadge status={row.status} />,
    },
    {
      name: "Date",
      selector: row => row.createdAt,
      sortable: true,
      cell: row => (
        <div>
          {new Date(row.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      name: "Actions",
      cell: row => (
        <div className="flex space-x-2">
          <button
            onClick={() => openReportDetails(row)}
            className="text-blue-500 hover:text-blue-700"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleStatusUpdate(row.id, "resolved")}
            className="text-green-500 hover:text-green-700"
            title="Mark as Resolved"
            disabled={row.status === "resolved"}
          >
            <CheckCircle className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ], []);

  // Report categories
  const REPORT_CATEGORIES = [
    { value: "road_damage", label: "Road Damage" },
    { value: "water_issue", label: "Water Issue" },
    { value: "electricity_issue", label: "Electricity Issue" },
    { value: "waste_management", label: "Waste Management" },
    { value: "public_property_damage", label: "Public Property Damage" },
    { value: "street_lighting", label: "Street Lighting" },
    { value: "sewage_problem", label: "Sewage Problem" },
    { value: "public_transportation", label: "Public Transportation" },
    { value: "environmental_issue", label: "Environmental Issue" },
  ];

  // Render the tab navigation
  const renderTabNav = () => (
    <div className="bg-white rounded-lg p-1 border-b-2 border-[#E41E2B] shadow-md mb-6 overflow-x-auto">
      <div className="flex space-x-1 min-w-max">
        <TabButton 
          active={activeTab === "dashboard"} 
          onClick={() => setActiveTab("dashboard")}
          icon={<BarChart3 className="w-5 h-5 mr-2" />}
          label="Dashboard"
        />
        <TabButton 
          active={activeTab === "users"} 
          onClick={() => setActiveTab("users")}
          icon={<Users className="w-5 h-5 mr-2" />}
          label="Users"
        />
        <TabButton 
          active={activeTab === "reports"} 
          onClick={() => setActiveTab("reports")}
          icon={<ClipboardList className="w-5 h-5 mr-2" />}
          label="Reports"
        />
        <TabButton 
          active={activeTab === "products"} 
          onClick={() => setActiveTab("products")}
          icon={<Gift className="w-5 h-5 mr-2" />}
          label="Products"
        />
        <TabButton 
          active={activeTab === "redemptions"} 
          onClick={() => setActiveTab("redemptions")}
          icon={<Award className="w-5 h-5 mr-2" />}
          label="Redemptions"
        />
        <TabButton 
          active={activeTab === "map"} 
          onClick={() => setActiveTab("map")}
          icon={<MapPin className="w-5 h-5 mr-2" />}
          label="Map View"
        />
        <TabButton 
          active={activeTab === "settings"} 
          onClick={() => setActiveTab("settings")}
          icon={<Settings className="w-5 h-5 mr-2" />}
          label="Settings"
        />
      </div>
    </div>
  );
  
  // Tab button component
  const TabButton = ({ active, onClick, icon, label }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-t-lg flex items-center whitespace-nowrap transition-colors ${
        active 
          ? "bg-[#E41E2B] text-white font-semibold shadow-sm" 
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );
  
  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return renderDashboard();
      case "users":
        return renderUsers();
      case "reports":
        return renderReports();
      case "products":
        return renderProducts();
      case "redemptions":
        return renderRedemptions();
      case "map":
        return renderMap();
      case "settings":
        return renderSettings();
      default:
        return renderDashboard();
    }
  };
  
  // StatCard component for dashboard
  const StatCard = ({ title, value, icon, color }) => (
    <div className={`bg-white rounded-lg shadow-md border-l-4 border-${color} p-4 flex items-center`}>
      <div className={`rounded-full bg-${color}/10 p-3 mr-4`}>
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );

  // Render dashboard with stats and charts
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-[#E41E2B]">Dashboard Overview</h2>
        <Button 
          onClick={fetchDashboardStats}
          variant="secondary"
          size="md"
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh
        </Button>
      </div>
      
      {isLoadingStats ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E41E2B]"></div>
        </div>
      ) : dashboardStats ? (
        <>
          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Total Reports" 
              value={dashboardStats.counts.reports || 0}
              icon={<ClipboardList className="h-6 w-6 text-[#E41E2B]" />}
              color="[#E41E2B]"
            />
            <StatCard 
              title="Pending Reports" 
              value={dashboardStats.counts.pendingReports || 0} 
              icon={<Clock className="h-6 w-6 text-yellow-500" />}
              color="yellow-500"
            />
            <StatCard 
              title="Resolved Reports" 
              value={dashboardStats.counts.resolvedReports || 0}
              icon={<CheckCircle className="h-6 w-6 text-green-500" />}
              color="green-500"
            />
            <StatCard 
              title="Total Users" 
              value={dashboardStats.counts.users || 0}
              icon={<Users className="h-6 w-6 text-blue-500" />}
              color="blue-500"
            />
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Category Distribution */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Reports by Category</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardStats.categoryCounts || []}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius="50%"
                      outerRadius="70%"
                      paddingAngle={2}
                      labelLine={false}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {(dashboardStats.categoryCounts || []).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CHART_COLORS[index % CHART_COLORS.length]} 
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend 
                      formatter={(value) => 
                        <span className="text-xs md:text-sm text-gray-600 capitalize">
                          {value.replace(/_/g, " ")}
                        </span>
                      }
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                      iconSize={10}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Status Distribution */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Reports by Status</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={[
                      { name: 'Pending', value: dashboardStats.counts.pendingReports || 0 },
                      { name: 'In Progress', value: dashboardStats.counts.inProgressReports || 0 },
                      { name: 'Resolved', value: dashboardStats.counts.resolvedReports || 0 },
                      { name: 'Rejected', value: dashboardStats.counts.rejectedReports || 0 }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      <Cell fill={EGYPT_COLORS.desert} /> {/* Pending */}
                      <Cell fill={EGYPT_COLORS.nile} /> {/* In Progress */}
                      <Cell fill={EGYPT_COLORS.teal} /> {/* Resolved */}
                      <Cell fill={EGYPT_COLORS.red} /> {/* Rejected */}
                      <LabelList 
                        dataKey="value" 
                        position="top" 
                        fill="#475569"
                        fontSize={12}
                        fontWeight={600}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Recent Users */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Recent Users</h3>
            {dashboardStats.recentUsers && dashboardStats.recentUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Name</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Email</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Verification</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Joined</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardStats.recentUsers.map((user) => (
                      <tr key={user.id || user._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">{user.firstName} {user.lastName}</td>
                        <td className="py-3 px-4 text-sm">{user.email}</td>
                        <td className="py-3 px-4 text-sm">
                          {user.isVerified ? (
                            <Badge variant="success" className="flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <button
                              onClick={() => handleVerifyUser(user.id || user._id)}
                              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
                            >
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Verify Now
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <button 
                            onClick={() => setActiveTab("users")}
                            className="text-[#E41E2B] hover:text-[#c41e2b]"
                          >
                            <User className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 text-right">
                  <button 
                    onClick={() => setActiveTab("users")}
                    className="text-sm text-[#E41E2B] hover:underline"
                  >
                    View All Users →
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent users found.</p>
            )}
          </div>
          
          {/* Recent Reports */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Recent Reports</h3>
            {reportList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Title</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Category</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Status</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">User</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Date</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportList.slice(0, 5).map((report) => (
                      <tr key={report.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">{report.title}</td>
                        <td className="py-3 px-4 text-sm capitalize">{report.category.replace(/_/g, " ")}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                            report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            report.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            report.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {report.status.replace(/-/g, " ")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">{typeof report.userName === 'object' ? 
                          (report.userName.firstName && report.userName.lastName ? 
                            `${report.userName.firstName} ${report.userName.lastName}` : 
                            (report.userName.email || "Anonymous")) 
                          : (report.userName || "Anonymous")}</td>
                        <td className="py-3 px-4 text-sm">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <button 
                            onClick={() => setActiveTab("reports")}
                            className="text-[#E41E2B] hover:text-[#c41e2b]"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 text-right">
                  <button 
                    onClick={() => setActiveTab("reports")}
                    className="text-sm text-[#E41E2B] hover:underline"
                  >
                    View All Reports →
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent reports found.</p>
            )}
          </div>
        </>
      ) : (
        <p className="text-center text-gray-500">Failed to load dashboard data.</p>
      )}
    </div>
  );
  
  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-[#E41E2B]">User Management</h2>
        <Button 
          onClick={fetchUsers}
          variant="secondary"
          size="md"
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh
        </Button>
      </div>

      {/* User filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Users</label>
            <SearchInput 
              value={userFilterValue}
              onChange={(e) => setUserFilterValue(e.target.value)}
              placeholder="Name, Email, ID..."
            />
          </div>
          
          {/* Role filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <Dropdown 
              label="Role"
              options={[
                { value: "all", label: "All Roles" },
                { value: "citizen", label: "Citizen" },
                { value: "admin", label: "Admin" }
              ]}
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
            />
          </div>
          
          {/* Verification filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verification Status</label>
            <Dropdown 
              label="Verification Status"
              options={[
                { value: "all", label: "All Users" },
                { value: "verified", label: "Verified Only" },
                { value: "unverified", label: "Unverified Only" }
              ]}
              value={userVerificationFilter}
              onChange={(e) => setUserVerificationFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* User table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoadingUsers ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E41E2B]"></div>
          </div>
        ) : (
          <DataTable
            columns={userColumns}
            data={filteredUsers}
            pagination
            paginationRowsPerPageOptions={[10, 25, 50, 100]}
            paginationPerPage={10}
            highlightOnHover
            responsive
            customStyles={{
              headCells: {
                style: {
                  paddingLeft: '8px',
                  paddingRight: '8px',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  color: '#374151',
                  backgroundColor: '#F9FAFB',
                },
              },
              cells: {
                style: {
                  paddingLeft: '8px',
                  paddingRight: '8px',
                },
              },
            }}
            noDataComponent={
              <div className="flex flex-col items-center justify-center p-8">
                <Users className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500">No users found</p>
              </div>
            }
          />
        )}
      </div>

      {/* Simplified National ID Verification Panel */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4 text-gray-800">National ID Verification</h3>
        <p className="text-gray-600 mb-4">
          Use this section to quickly verify users by their National ID. The system will check if the ID is valid and mark the user as verified.
        </p>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <Info className="h-5 w-5 text-yellow-400 mr-2" />
            <p className="text-sm text-yellow-700">
              Enter a user's National ID to verify their account. This action will mark the user as verified in the system.
            </p>
          </div>
        </div>
        
        {/* Verification action panel */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">User National ID</label>
            <input
              type="text"
              id="nationalIdVerification"
              placeholder="Enter 14-digit National ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#E41E2B] focus:border-[#E41E2B]"
            />
          </div>
          <Button 
            onClick={() => {
              const nationalId = document.getElementById('nationalIdVerification').value;
              if (!nationalId) {
                toast.error("Please enter a National ID");
                return;
              }
              
              // Find the user with this National ID
              const user = userList.find(u => u.nationalId === nationalId);
              if (!user) {
                toast.error("No user found with this National ID");
                return;
              }
              
              // Verify the user
              handleVerifyUser(user.id || user._id);
              
              // Clear the input field
              document.getElementById('nationalIdVerification').value = '';
            }}
            variant="primary"
            size="md"
          >
            Verify User
          </Button>
        </div>
      </div>
    </div>
  );
  
  // Render the reports management tab
  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-[#E41E2B]">Report Management</h2>
        <Button 
          onClick={fetchReports}
          variant="secondary"
          size="md"
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh
        </Button>
      </div>

      {/* Report filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Reports</label>
            <SearchInput 
              value={reportFilterValue}
              onChange={(e) => setReportFilterValue(e.target.value)}
              placeholder="Title, Description, Location..."
            />
          </div>
          
          {/* Status filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Dropdown 
              label="Status"
              options={[
                { value: "all", label: "All Statuses" },
                { value: "pending", label: "Pending" },
                { value: "in-progress", label: "In Progress" },
                { value: "resolved", label: "Resolved" },
                { value: "rejected", label: "Rejected" }
              ]}
              value={reportStatusFilter}
              onChange={(e) => setReportStatusFilter(e.target.value)}
            />
          </div>
          
          {/* Category filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <Dropdown 
              label="Category"
              options={REPORT_CATEGORIES}
              value={reportCategoryFilter}
              onChange={(e) => setReportCategoryFilter(e.target.value)}
            />
          </div>
          
          {/* Urgency filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
            <Dropdown 
              label="Urgency"
              options={[
                { value: "all", label: "All Urgency Levels" },
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
                { value: "critical", label: "Critical" }
              ]}
              value={reportUrgencyFilter}
              onChange={(e) => setReportUrgencyFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Reports table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoadingReports ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E41E2B]"></div>
          </div>
        ) : (
          <DataTable
            columns={reportColumns}
            data={filteredReports}
            pagination
            paginationRowsPerPageOptions={[10, 25, 50, 100]}
            paginationPerPage={10}
            highlightOnHover
            responsive
            subHeader
            subHeaderComponent={
              <div className="w-full flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium">
                  Total Reports: <span className="font-bold">{filteredReports.length}</span>
                </h3>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setReportStatusFilter("pending")}
                    variant="secondary"
                    size="sm"
                  >
                    Pending
                  </Button>
                  <Button
                    onClick={() => setReportStatusFilter("in-progress")}
                    variant="secondary"
                    size="sm"
                  >
                    In Progress
                  </Button>
                  <Button
                    onClick={() => setReportStatusFilter("resolved")}
                    variant="secondary"
                    size="sm"
                  >
                    Resolved
                  </Button>
                </div>
              </div>
            }
            customStyles={{
              headCells: {
                style: {
                  paddingLeft: '8px',
                  paddingRight: '8px',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  color: '#374151',
                  backgroundColor: '#F9FAFB',
                },
              },
              cells: {
                style: {
                  paddingLeft: '8px',
                  paddingRight: '8px',
                },
              },
            }}
            noDataComponent={
              <div className="flex flex-col items-center justify-center p-8">
                <ClipboardList className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500">No reports found</p>
              </div>
            }
          />
        )}
      </div>

      {/* Report Details Modal */}
      {isViewingReport && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Report Details</h3>
                <button 
                  onClick={closeReportDetails}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Report header */}
                <div className="flex flex-col sm:flex-row justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">{selectedReport.title}</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <ReportStatusBadge status={selectedReport.status} />
                      <ReportCategoryBadge category={selectedReport.category} />
                      {selectedReport.urgency && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedReport.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                          selectedReport.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                          selectedReport.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {selectedReport.urgency}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mt-2 sm:mt-0 sm:text-right">
                    <div>Report ID: {selectedReport.id}</div>
                    <div>Submitted: {new Date(selectedReport.createdAt).toLocaleString()}</div>
                    <div>Last Updated: {new Date(selectedReport.updatedAt).toLocaleString()}</div>
                  </div>
                </div>
                
                {/* Report details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Description</h5>
                    <p className="text-gray-600 whitespace-pre-line">{selectedReport.description}</p>
                    
                    <h5 className="font-medium text-gray-700 mt-4 mb-2">Reporter Information</h5>
                    <div className="text-gray-600">
                      <div>Name: {selectedReport.userName}</div>
                      <div>User ID: {selectedReport.userId}</div>
                      <div>Email: {selectedReport.userEmail}</div>
                    </div>
                    
                    {/* Add AI Analysis section here */}
                    {selectedReport.aiAnalysis && Object.keys(selectedReport.aiAnalysis).length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-medium text-gray-700 mb-2">AI Analysis</h5>
                        <div className="bg-blue-50 p-3 rounded border border-blue-200">
                          <div className="text-sm text-gray-700">
                            <div>Classification: <span className="font-medium capitalize">{selectedReport.aiAnalysis.classification || 'Not classified'}</span></div>
                            <div>AI Urgency: <span className="font-medium">{selectedReport.aiAnalysis.urgency || 'Not assessed'}</span></div>
                            <div>Confidence: <span className="font-medium">{selectedReport.aiAnalysis.confidence ? `${(parseFloat(selectedReport.aiAnalysis.confidence) * 100).toFixed(1)}%` : 'N/A'}</span></div>
                            {selectedReport.aiAnalysis.analysisTimestamp && (
                              <div>Analyzed: <span className="font-medium">{new Date(selectedReport.aiAnalysis.analysisTimestamp).toLocaleString()}</span></div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Location</h5>
                    <div className="text-gray-600">
                      <div>Address: {selectedReport.location?.address || "N/A"}</div>
                      <div>City: {selectedReport.location?.city || "N/A"}</div>
                      <div>Governorate: {selectedReport.location?.governorate || "N/A"}</div>
                      <div>Coordinates: {
                        selectedReport.location?.coordinates 
                          ? (typeof selectedReport.location.coordinates.lat === 'number'
                              ? `${selectedReport.location.coordinates.lat}, ${selectedReport.location.coordinates.lng}`
                              : (Array.isArray(selectedReport.location.coordinates)
                                  ? `${selectedReport.location.coordinates[0] || 'N/A'}, ${selectedReport.location.coordinates[1] || 'N/A'}`
                                  : 'Invalid coordinates format'))
                          : "N/A"
                      }</div>
                    </div>
                    
                    {/* Mini map */}
                    {selectedReport.location?.coordinates && (
                      <div className="h-48 rounded-lg overflow-hidden mt-2">
                        <MapContainer
                          center={[
                            typeof selectedReport.location.coordinates.lat === 'number' 
                              ? selectedReport.location.coordinates.lat 
                              : (selectedReport.location.coordinates[0] || 30.0444),
                            typeof selectedReport.location.coordinates.lng === 'number'
                              ? selectedReport.location.coordinates.lng
                              : (selectedReport.location.coordinates[1] || 31.2357)
                          ]}
                          zoom={14}
                          style={{ height: "100%", width: "100%" }}
                          scrollWheelZoom={false}
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <Marker
                            position={[
                              typeof selectedReport.location.coordinates.lat === 'number' 
                                ? selectedReport.location.coordinates.lat 
                                : (selectedReport.location.coordinates[0] || 30.0444),
                              typeof selectedReport.location.coordinates.lng === 'number'
                                ? selectedReport.location.coordinates.lng
                                : (selectedReport.location.coordinates[1] || 31.2357)
                            ]}
                          >
                            <Popup>
                              {selectedReport.title}
                              <br />
                              {selectedReport.location.address}
                            </Popup>
                          </Marker>
                        </MapContainer>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Images */}
                {selectedReport.images && selectedReport.images.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Images</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {selectedReport.images.map((image, index) => {
                        // Handle different possible image formats (URL, base64, etc.)
                        const imageUrl = image && typeof image === 'object' && image.url
                          ? image.url
                          : (typeof image === 'string' ? image : '');
                        
                        // Ensure it's a proper URL or data URL
                        const displayUrl = imageUrl.startsWith('http') || imageUrl.startsWith('data:image') 
                          ? imageUrl 
                          : `data:image/jpeg;base64,${imageUrl}`;

                        return (
                          <div key={index} className="rounded-lg overflow-hidden shadow-sm border border-gray-200">
                            <img
                              src={displayUrl}
                              alt={`Report image ${index + 1}`}
                              className="w-full h-24 object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/150?text=Image+Error';
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Status update form */}
                <div className="border-t pt-4 mt-4">
                  <h5 className="font-medium text-gray-700 mb-2">Update Status</h5>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status Note</label>
                      <textarea
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Add a note about this status update..."
                        rows={2}
                      />
                    </div>
                    <div className="flex items-end space-x-2">
                      <Button
                        onClick={() => {
                          handleStatusUpdate(selectedReport.id, "in-progress", statusNote);
                          closeReportDetails();
                        }}
                        variant="secondary"
                        size="sm"
                        disabled={selectedReport.status === "in-progress"}
                      >
                        Mark In Progress
                      </Button>
                      <Button
                        onClick={() => {
                          handleStatusUpdate(selectedReport.id, "resolved", statusNote);
                          closeReportDetails();
                        }}
                        variant="secondary"
                        size="sm"
                        disabled={selectedReport.status === "resolved"}
                      >
                        Mark Resolved
                      </Button>
                      <Button
                        onClick={() => {
                          handleStatusUpdate(selectedReport.id, "rejected", statusNote);
                          closeReportDetails();
                        }}
                        variant="secondary"
                        size="sm"
                        disabled={selectedReport.status === "rejected"}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  // States for modals
  const [showProductForm, setShowProductForm] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  
  // Product form state
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    pointsCost: '',
    category: 'gift_card',
    stock: '',
    isActive: true
  });
  
  // Handle product form change
  const handleProductFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Initialize product form for editing
  const editProduct = (product) => {
    setProductForm({
      id: product.id,
      name: product.name,
      description: product.description,
      pointsCost: product.pointsCost,
      category: product.category,
      stock: product.stock || '',
      isActive: product.isActive
    });
    setIsEditingProduct(true);
    setShowProductForm(true);
  };
  
  // Initialize product form for adding
  const addNewProduct = () => {
    setProductForm({
      id: '', // Empty for new products
      name: '',
      description: '',
      pointsCost: '',
      category: 'gift_card',
      stock: '',
      isActive: true
    });
    setIsEditingProduct(false);
    setShowProductForm(true);
  };
  
  // Close product form
  const closeProductForm = () => {
    setIsEditingProduct(false);
    setShowProductForm(false);
  };
  
  // Handle product form submission
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      
      if (isEditingProduct) {
        // Update existing product
        const { id, ...updateData } = productForm;
        response = await adminAPI.updateProduct(id, updateData);
      } else {
        // Create new product
        response = await adminAPI.createProduct(productForm);
      }
      
      if (response.success) {
        toast.success(isEditingProduct ? "Product updated successfully" : "Product created successfully");
        closeProductForm();
        fetchProducts(); // Refresh product list
      } else {
        toast.error(response.error?.message || "Failed to save product");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Error saving product");
    }
  };
  
  // Handle product deletion
  const deleteProduct = (productId) => {
    // In a real implementation, we would call the API
    setProductList(prev => prev.filter(p => p.id !== productId));
    toast.success("Product deleted successfully");
  };
  
  // Product columns for DataTable
  const productColumns = useMemo(() => [
    {
      name: "Product",
      selector: row => row.name,
      sortable: true,
      cell: row => (
        <div className="flex items-center py-2">
          <img
            src={row.image}
            alt={row.name}
            className="w-10 h-10 object-cover rounded-md mr-3"
          />
          <div>
            <div className="font-medium">{row.name}</div>
            <div className="text-xs text-gray-500 truncate" style={{ maxWidth: "200px" }}>
              {row.description}
            </div>
          </div>
        </div>
      ),
    },
    {
      name: "Points",
      selector: row => row.pointsCost,
      sortable: true,
      cell: row => (
        <div className="font-medium text-blue-600">
          {row.pointsCost} pts
        </div>
      ),
    },
    {
      name: "Category",
      selector: row => row.category,
      sortable: true,
      cell: row => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
          {row.category.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      name: "Stock",
      selector: row => row.stock,
      sortable: true,
      cell: row => (
        <div>
          {row.stock === null ? (
            <span className="text-gray-500">Unlimited</span>
          ) : row.stock <= 5 ? (
            <span className="text-red-600 font-medium">{row.stock} left</span>
          ) : (
            <span>{row.stock}</span>
          )}
        </div>
      ),
    },
    {
      name: "Status",
      selector: row => row.isActive,
      sortable: true,
      cell: row => (
        <div>
          {row.isActive ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Inactive
            </span>
          )}
        </div>
      ),
    },
    {
      name: "Actions",
      cell: row => (
        <div className="flex space-x-2">
          <Button
            onClick={() => editProduct(row)}
            variant="secondary"
            size="sm"
            title="Edit Product"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => deleteProduct(row.id)}
            variant="secondary"
            size="sm"
            title="Delete Product"
          >
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ], []);

  // Product categories
  const PRODUCT_CATEGORIES = [
    { value: "gift_card", label: "Gift Card" },
    { value: "merchandise", label: "Merchandise" },
    { value: "voucher", label: "Voucher" },
    { value: "donation", label: "Donation" },
    { value: "service", label: "Service" },
    { value: "other", label: "Other" },
  ];

  // Render products management tab
  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-[#E41E2B]">Product Management</h2>
        <div className="flex space-x-2">
          <Button 
            onClick={fetchProducts}
            variant="secondary"
            size="md"
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
          <Button 
            onClick={addNewProduct}
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Products table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoadingProducts ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E41E2B]"></div>
          </div>
        ) : (
          <DataTable
            columns={productColumns}
            data={productList}
            pagination
            paginationRowsPerPageOptions={[10, 25, 50]}
            paginationPerPage={10}
            highlightOnHover
            responsive
            customStyles={{
              headCells: {
                style: {
                  paddingLeft: '8px',
                  paddingRight: '8px',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  color: '#374151',
                  backgroundColor: '#F9FAFB',
                },
              },
              cells: {
                style: {
                  paddingLeft: '8px',
                  paddingRight: '8px',
                },
              },
            }}
            noDataComponent={
              <div className="flex flex-col items-center justify-center p-8">
                <Package className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500">No products found</p>
              </div>
            }
          />
        )}
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-y-auto max-h-[90vh]">
            <form onSubmit={handleProductSubmit}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    {isEditingProduct ? "Edit Product" : "Add New Product"}
                  </h3>
                  <button 
                    type="button"
                    onClick={closeProductForm}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Product Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={productForm.name}
                      onChange={handleProductFormChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#E41E2B] focus:border-[#E41E2B]"
                    />
                  </div>
                  
                  {/* Product Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={productForm.description}
                      onChange={handleProductFormChange}
                      required
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#E41E2B] focus:border-[#E41E2B]"
                    />
                  </div>
                  
                  {/* Product Image */}
                  <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                      Product Image
                    </label>
                    <input
                      type="file"
                      id="image"
                      name="image"
                      accept="image/*"
                      onChange={handleProductFormChange}
                      className="mt-1 block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-gray-100 file:text-gray-700
                        hover:file:bg-gray-200"
                    />
                    {isEditingProduct && (
                      <p className="mt-1 text-sm text-gray-500">
                        Leave empty to keep the current image.
                      </p>
                    )}
                  </div>
                  
                  {/* Points Cost and Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="pointsCost" className="block text-sm font-medium text-gray-700">
                        Points Cost *
                      </label>
                      <input
                        type="number"
                        id="pointsCost"
                        name="pointsCost"
                        min="0"
                        value={productForm.pointsCost}
                        onChange={handleProductFormChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#E41E2B] focus:border-[#E41E2B]"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        Category *
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={productForm.category}
                        onChange={handleProductFormChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#E41E2B] focus:border-[#E41E2B]"
                      >
                        {PRODUCT_CATEGORIES.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Stock and Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                        Stock (Leave empty for unlimited)
                      </label>
                      <input
                        type="number"
                        id="stock"
                        name="stock"
                        min="0"
                        value={productForm.stock || ""}
                        onChange={handleProductFormChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#E41E2B] focus:border-[#E41E2B]"
                      />
                    </div>
                    
                    <div className="flex items-center h-full pt-6">
                      <input
                        type="checkbox"
                        id="isActive"
                        name="isActive"
                        checked={productForm.isActive}
                        onChange={handleProductFormChange}
                        className="h-4 w-4 text-[#E41E2B] focus:ring-[#E41E2B] border-gray-300 rounded"
                      />
                      <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-700">
                        Active Product
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    type="button"
                    onClick={closeProductForm}
                    variant="secondary"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                  >
                    {isEditingProduct ? "Update Product" : "Add Product"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
  
  // Redemption management state
  const [selectedRedemption, setSelectedRedemption] = useState(null);
  const [isProcessingRedemption, setIsProcessingRedemption] = useState(false);
  const [redemptionStatusNote, setRedemptionStatusNote] = useState("");
  
  // Handle redemption status update
  const handleRedemptionStatusUpdate = async (redemptionId, newStatus, note = "") => {
    try {
      const response = await adminAPI.updateRedemption(redemptionId, { status: newStatus, notes: note });
      if (response.success) {
        toast.success(`Redemption status updated to ${newStatus}`);
        
        // Update the local redemption list
        setRedemptionList(prevList => 
          prevList.map(redemption => 
            redemption.id === redemptionId 
              ? { ...redemption, status: newStatus, notes: note || redemption.notes } 
              : redemption
          )
        );
        
        // Close the processing modal
        closeRedemptionProcessing();
        
        // Refresh redemptions
        fetchRedemptions();
      } else {
        toast.error(response.error?.message || "Failed to update redemption status");
      }
    } catch (error) {
      console.error("Error updating redemption status:", error);
      toast.error("Error updating redemption status");
    }
  };
  
  // Initialize redemption processing
  const processRedemption = (redemption) => {
    setSelectedRedemption(redemption);
    setRedemptionStatusNote(redemption.notes || "");
    setIsProcessingRedemption(true);
  };
  
  // Close redemption processing modal
  const closeRedemptionProcessing = () => {
    setIsProcessingRedemption(false);
    setSelectedRedemption(null);
    setRedemptionStatusNote("");
  };
  
  // Filter states for redemptions
  const [redemptionFilterValue, setRedemptionFilterValue] = useState("");
  const [redemptionStatusFilter, setRedemptionStatusFilter] = useState("all");
  
  // Filter redemptions based on search term and filters
  const filteredRedemptions = useMemo(() => {
    return redemptionList.filter(redemption => {
      // Text search filter
      const searchMatch = redemptionFilterValue === "" || 
        redemption.userName.toLowerCase().includes(redemptionFilterValue.toLowerCase()) ||
        redemption.userEmail.toLowerCase().includes(redemptionFilterValue.toLowerCase()) ||
        redemption.productName.toLowerCase().includes(redemptionFilterValue.toLowerCase());
      
      // Status filter
      const statusMatch = redemptionStatusFilter === "all" || redemption.status === redemptionStatusFilter;
      
      return searchMatch && statusMatch;
    });
  }, [redemptionList, redemptionFilterValue, redemptionStatusFilter]);
  
  // Redemption status badge
  const RedemptionStatusBadge = ({ status }) => {
    let className = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ";
    
    switch(status) {
      case "pending":
        className += "bg-yellow-100 text-yellow-800";
        break;
      case "processing":
        className += "bg-blue-100 text-blue-800";
        break;
      case "completed":
        className += "bg-green-100 text-green-800";
        break;
      case "rejected":
        className += "bg-red-100 text-red-800";
        break;
      default:
        className += "bg-gray-100 text-gray-800";
    }
    
    return <span className={className}>{status}</span>;
  };
  
  // Redemption columns for DataTable
  const redemptionColumns = useMemo(() => [
    {
      name: "User",
      selector: row => row.userName,
      sortable: true,
      cell: row => (
        <div className="py-2">
          <div className="font-medium">{row.userName}</div>
          <div className="text-xs text-gray-500">{row.userEmail}</div>
        </div>
      ),
    },
    {
      name: "Product",
      selector: row => row.productName,
      sortable: true,
      cell: row => (
        <div className="py-2">
          <div>{row.productName}</div>
          <div className="text-xs text-gray-500">{row.pointsCost} points</div>
        </div>
      ),
    },
    {
      name: "Date",
      selector: row => row.createdAt,
      sortable: true,
      cell: row => (
        <div className="py-2">
          {new Date(row.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      name: "Status",
      selector: row => row.status,
      sortable: true,
      cell: row => <RedemptionStatusBadge status={row.status} />,
    },
    {
      name: "Notes",
      selector: row => row.notes,
      sortable: false,
      cell: row => (
        <div className="text-sm text-gray-500 truncate" style={{ maxWidth: "150px" }}>
          {row.notes || "—"}
        </div>
      ),
    },
    {
      name: "Actions",
      cell: row => (
        <div className="flex space-x-2">
          <Button
            onClick={() => processRedemption(row)}
            variant="secondary"
            size="sm"
            disabled={row.status === "completed" || row.status === "rejected"}
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ], []);

  // Render redemptions management tab
  const renderRedemptions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-[#E41E2B]">Redemption Management</h2>
        <Button 
          onClick={fetchRedemptions}
          variant="secondary"
          size="md"
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh
        </Button>
      </div>

      {/* Redemption filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Redemptions</label>
            <SearchInput 
              value={redemptionFilterValue}
              onChange={(e) => setRedemptionFilterValue(e.target.value)}
              placeholder="User name, email, product..."
            />
          </div>
          
          {/* Status filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Dropdown 
              label="Status"
              options={[
                { value: "all", label: "All Status" },
                { value: "pending", label: "Pending" },
                { value: "processing", label: "Processing" },
                { value: "completed", label: "Completed" },
                { value: "rejected", label: "Rejected" }
              ]}
              value={redemptionStatusFilter}
              onChange={(e) => setRedemptionStatusFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Redemptions stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { 
            label: "Total Redemptions", 
            value: redemptionList.length,
            color: "bg-blue-500"
          },
          { 
            label: "Pending", 
            value: redemptionList.filter(r => r.status === "pending").length,
            color: "bg-yellow-500"
          },
          { 
            label: "Processing", 
            value: redemptionList.filter(r => r.status === "processing").length,
            color: "bg-indigo-500"
          },
          { 
            label: "Completed", 
            value: redemptionList.filter(r => r.status === "completed").length,
            color: "bg-green-500"
          }
        ].map((stat, index) => (
          <div 
            key={index} 
            className="bg-white rounded-lg shadow-md p-4 flex items-center"
          >
            <div className={`${stat.color} rounded-full h-10 w-10 flex items-center justify-center mr-3`}>
              <span className="text-white font-bold">{stat.value}</span>
            </div>
            <div>
              <h3 className="text-gray-500 text-sm">{stat.label}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Redemptions table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoadingRedemptions ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E41E2B]"></div>
          </div>
        ) : (
          <DataTable
            columns={redemptionColumns}
            data={filteredRedemptions}
            pagination
            paginationRowsPerPageOptions={[10, 25, 50]}
            paginationPerPage={10}
            highlightOnHover
            responsive
            customStyles={{
              headCells: {
                style: {
                  paddingLeft: '8px',
                  paddingRight: '8px',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  color: '#374151',
                  backgroundColor: '#F9FAFB',
                },
              },
              cells: {
                style: {
                  paddingLeft: '8px',
                  paddingRight: '8px',
                },
              },
            }}
            noDataComponent={
              <div className="flex flex-col items-center justify-center p-8">
                <Award className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500">No redemptions found</p>
              </div>
            }
          />
        )}
      </div>

      {/* Redemption Processing Modal */}
      {isProcessingRedemption && selectedRedemption && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Process Redemption</h3>
                <button 
                  onClick={closeRedemptionProcessing}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700">Redemption Details</h4>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>
                      <span className="text-gray-500">User:</span> {selectedRedemption.userName}
                    </p>
                    <p>
                      <span className="text-gray-500">Product:</span> {selectedRedemption.productName}
                    </p>
                    <p>
                      <span className="text-gray-500">Points Cost:</span> {selectedRedemption.pointsCost}
                    </p>
                    <p>
                      <span className="text-gray-500">Date:</span> {new Date(selectedRedemption.createdAt).toLocaleString()}
                    </p>
                    <p>
                      <span className="text-gray-500">Status:</span> <RedemptionStatusBadge status={selectedRedemption.status} />
                    </p>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="redemptionStatusNote" className="block text-sm font-medium text-gray-700">
                    Status Note
                  </label>
                  <textarea
                    id="redemptionStatusNote"
                    value={redemptionStatusNote}
                    onChange={(e) => setRedemptionStatusNote(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#E41E2B] focus:border-[#E41E2B]"
                    placeholder="Add a note about this status update..."
                  />
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Update Status</h4>
                  <div className="flex flex-col space-y-2">
                    {selectedRedemption.status !== "processing" && (
                      <Button
                        onClick={() => handleRedemptionStatusUpdate(selectedRedemption.id, "processing", redemptionStatusNote)}
                        variant="secondary"
                        size="sm"
                      >
                        Mark as Processing
                      </Button>
                    )}
                    {selectedRedemption.status !== "completed" && (
                      <Button
                        onClick={() => handleRedemptionStatusUpdate(selectedRedemption.id, "completed", redemptionStatusNote)}
                        variant="secondary"
                        size="sm"
                      >
                        Mark as Completed
                      </Button>
                    )}
                    {selectedRedemption.status !== "rejected" && (
                      <Button
                        onClick={() => handleRedemptionStatusUpdate(selectedRedemption.id, "rejected", redemptionStatusNote)}
                        variant="secondary"
                        size="sm"
                      >
                        Reject Redemption
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  // Render the map view tab
  const renderMap = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-[#E41E2B]">Map View</h2>
        <Button 
          onClick={fetchReports}
          variant="secondary"
          size="md"
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh Map
        </Button>
      </div>

      {/* Map legend */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Map Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 rounded-full bg-yellow-500 mr-2"></span>
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 rounded-full bg-blue-500 mr-2"></span>
            <span className="text-sm text-gray-600">In Progress</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 rounded-full bg-green-500 mr-2"></span>
            <span className="text-sm text-gray-600">Resolved</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 rounded-full bg-red-500 mr-2"></span>
            <span className="text-sm text-gray-600">Rejected</span>
          </div>
        </div>
      </div>

      {/* The Map */}
      <div className="bg-white rounded-lg shadow-md">
        {isLoadingReports ? (
          <div className="flex justify-center items-center h-[500px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E41E2B]"></div>
          </div>
        ) : (
          <div className="h-[500px] rounded-lg overflow-hidden">
            <MapContainer
              center={[30.0444, 31.2357]} // Cairo, Egypt
              zoom={10}
              scrollWheelZoom
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Render all reports on map */}
              {reportList.map((report) => {
                // Skip if no coordinates or invalid coordinates
                if (!report.location?.coordinates) return null;
                
                // Ensure we have valid lat and lng values
                const lat = typeof report.location.coordinates.lat === 'number' 
                  ? report.location.coordinates.lat 
                  : (report.location.coordinates[0] || 30.0444); // Default to Cairo if missing
                
                const lng = typeof report.location.coordinates.lng === 'number'
                  ? report.location.coordinates.lng
                  : (report.location.coordinates[1] || 31.2357); // Default to Cairo if missing
                
                // Determine marker color based on status
                let markerColor = "#FFDD00"; // default/pending
                if (report.status === "in-progress" || report.status === "in_progress") markerColor = "#4b9cd3";
                if (report.status === "resolved") markerColor = "#10b981";
                if (report.status === "rejected") markerColor = "#ef4444";
                
                return (
                <Marker
                    key={report.id || report._id}
                    position={[lat, lng]}
                    icon={L.divIcon({
                      html: `<div style="background-color: ${markerColor}; width: 100%; height: 100%; border-radius: 50%; border: 2px solid white;"></div>`,
                      className: "custom-marker",
                      iconSize: [20, 20],
                      iconAnchor: [10, 10]
                    })}
                >
                  <Popup>
                      <div className="text-sm max-w-xs">
                        <h3 className="font-bold text-gray-900">{report.title}</h3>
                        <p className="text-gray-600 mt-1">{report.description?.substring(0, 100)}
                          {report.description?.length > 100 ? "..." : ""}
                        </p>
                        <div className="mt-2">
                          <ReportStatusBadge status={report.status} />
                          <span className="ml-2">
                            <ReportCategoryBadge category={report.category} />
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs mt-2">
                          {report.location.address}<br />
                          {report.location.city}, {report.location.governorate}
                        </p>
                        <button
                          onClick={() => {
                            openReportDetails(report);
                          }}
                          className="mt-2 text-[#E41E2B] hover:underline text-xs"
                        >
                          View Details
                        </button>
                    </div>
                  </Popup>
                </Marker>
                );
              })}
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  );
  
  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-[#E41E2B]">Admin Settings</h2>
      {/* Settings content will be implemented later */}
      <p className="text-gray-600">Loading settings...</p>
    </div>
  );

  // Fetch map statistics data
  const fetchMapStatistics = async () => {
    try {
      console.log('Fetching report statistics for map view');
      const statsResponse = await reportAPI.getReportStatistics();
      console.debug('Report statistics API response:', statsResponse);
      
      // No need to process stats anymore since we're not displaying those charts
      if (!statsResponse.success) {
        console.error('Failed to load report statistics:', statsResponse.error);
        toast.error("Failed to load report statistics");
      }
    } catch (error) {
      console.error("Error fetching map statistics:", error);
      toast.error("Error loading map statistics");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E41E2B]/5 to-[#C09E77]/20">
      {/* Header with admin info */}
      <header className="bg-white shadow-md border-b-2 border-[#E41E2B] p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            {/* Logo/Icon */}
            <div className="w-10 h-10 mr-3 relative">
              {/* Egyptian-themed logo */}
              <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <rect width="36" height="12" fill={EGYPT_COLORS.red} />
                <rect y="12" width="36" height="12" fill={EGYPT_COLORS.white} />
                <rect y="24" width="36" height="12" fill={EGYPT_COLORS.black} />
                <path 
                  d="M18 8.5L8 27.5H28L18 8.5Z" 
                  fill={EGYPT_COLORS.gold} 
                  stroke="white" 
                  strokeWidth="0.5"
                />
                <circle cx="18" cy="7" r="4" fill="#E41E2B" />
                <circle cx="18" cy="7" r="2" fill="#FFDD00" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#E41E2B]">
              Fix Egypt Admin
            </h1>
          </div>
          
          {/* Admin profile/logout */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-gray-600">Administrator</p>
            </div>
            <Button 
              onClick={handleLogout} 
              variant="secondary"
              size="md"
              icon={<LogOut className="w-4 h-4" />}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {isAdmin ? (
          <>
            {renderTabNav()}
            {renderTabContent()}
          </>
        ) : (
          <Card className="text-center p-10 mt-10">
            <AlertTriangle className="w-16 h-16 text-[#E41E2B] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#E41E2B] mb-2">Access Denied</h2>
            <p className="mt-2 text-gray-600 mb-6">You don't have permission to access the admin dashboard.</p>
            <Button 
              onClick={() => navigate('/')}
              variant="primary"
            >
              Return to Home
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}

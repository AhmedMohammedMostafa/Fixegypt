import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Home, MapPin, CalendarDays, Clock, Award, CheckCircle, AlertTriangle, Eye, X, ChevronLeft } from "lucide-react";
import { AppContext } from "../App";
import VerificationBanner from "../components/VerificationBanner";
import { reportAPI } from "../utils/api";
import { toast } from "react-toastify";

// Egyptian-themed colors
const EGYPT_COLORS = {
  red: "#E41E2B",
  gold: "#C09E77",
  blue: "#3b82f6",
  sand: "#F5EDD6",
  pharaoh: "#C19A6B",
  nile: "#5D93B2",
  desert: "#E9D8A6"
};

// Helpers (could be moved to utils)
function getCategoryColor(category) {
  const colors = {
    road_damage: EGYPT_COLORS.red,
    water_issue: EGYPT_COLORS.nile,
    electricity_issue: "#F59E0B",
    waste_management: "#10B981",
    public_property_damage: "#8B5CF6",
    street_lighting: EGYPT_COLORS.gold,
    sewage_problem: "#6B7280",
    public_transportation: EGYPT_COLORS.red,
    environmental_issue: "#84CC16",
    other: "#94A3B8",
  };
  return colors[category] || colors.other;
}

function formatCategoryLabel(category) {
  const labels = {
    road_damage: "Road Damage",
    water_issue: "Water Issue",
    electricity_issue: "Electricity Issue",
    waste_management: "Waste Management",
    public_property_damage: "Property Damage",
    street_lighting: "Street Lighting",
    sewage_problem: "Sewage Problem",
    public_transportation: "Transportation",
    environmental_issue: "Environmental",
    other: "Other",
  };
  return labels[category] || "Uncategorized";
}

function getStatusClasses(status) {
  const classes = {
    pending: "bg-yellow-100 text-yellow-800",
    "in-progress": "bg-blue-100 text-blue-800",
    "in_progress": "bg-blue-100 text-blue-800",
    resolved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800"
  };
  return classes[status] || "bg-gray-100 text-gray-800";
}

function formatStatusLabel(status) {
  return status
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function Profile() {
  const { user, logout, isVerified } = useContext(AppContext);
  const navigate = useNavigate();
  const [userReports, setUserReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("reports");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  
  useEffect(() => {
    fetchUserReports();
  }, []);
  
  const fetchUserReports = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Use the dedicated user reports endpoint instead of general reports
      const response = await reportAPI.getUserReports();
      
      if (response.success) {
        console.log(response.data);
        let reports = response.data.reports.reports || [];
        console.log(`Fetched ${reports.length} user reports`);
        
        // Sort reports by creation date (newest first)
        reports = reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setUserReports(reports);
      } else {
        console.error("Failed to fetch user reports:", response.error);
        setUserReports([]);
      }
    } catch (error) {
      console.error("Error fetching user reports:", error);
      setUserReports([]);
    } finally {
      setLoading(false);
    }
  };
  
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
  
  const openReportModal = (report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };
  
  const closeReportModal = () => {
    setShowReportModal(false);
    setSelectedReport(null);
  };
  
  // Tabs components
  const ReportsTab = () => (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Your Reports</h2>
        <button 
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-gradient-to-r from-[#E41E2B] to-[#B71922] text-white rounded-lg hover:from-[#B71922] hover:to-[#E41E2B] transition-all shadow-md"
        >
          + New Report
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E41E2B]"></div>
        </div>
      ) : userReports.length === 0 ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-20 h-20 mx-auto bg-[#E41E2B]/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-10 h-10 text-[#E41E2B]" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Reports Found</h3>
          <p className="text-gray-600 mb-6">You haven't submitted any reports yet.</p>
          <button 
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-[#E41E2B] text-white rounded-lg hover:bg-[#B71922] transition-all"
          >
            Submit Your First Report
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {userReports.map((report) => (
            <div
              key={report.id}
              className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
            >
              {report.images && report.images.length > 0 && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={report.images[0].url}
                    alt={report.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/400x200?text=Image+Error';
                    }}
                  />
                  <div className={`absolute top-3 right-3 ${getStatusClasses(report.status)} px-3 py-1 rounded-full text-xs font-semibold`}>
                    {formatStatusLabel(report.status)}
                  </div>
                </div>
              )}
              <div className="p-4 flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">
                    {report.title}
                  </h3>
                  {!report.images || report.images.length === 0 && (
                    <span className={`${getStatusClasses(report.status)} px-2 py-1 rounded-full text-xs font-semibold`}>
                      {formatStatusLabel(report.status)}
                    </span>
                  )}
                </div>
                <span
                  className="inline-block text-xs font-medium px-2 py-1 rounded-full text-white mb-3"
                  style={{ backgroundColor: getCategoryColor(report.category) }}
                >
                  {formatCategoryLabel(report.category)}
                </span>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {report.description}
                </p>
                <div className="flex flex-col space-y-2 text-xs text-gray-500 mt-auto">
                  {report.location && report.location.address && (
                    <div className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1.5" />
                      <span className="truncate">{report.location.address}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      className="mt-2 text-[#E41E2B] hover:text-[#B71922] flex items-center text-sm font-medium"
                      onClick={() => openReportModal(report)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
  
  const PointsTab = () => (
    <div className="py-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Points</h2>
      
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#E41E2B] to-[#C09E77] flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-bold text-white">{user?.points || 0}</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Total Points</h3>
        </div>
        
        <div className="border-2 border-dashed border-[#C09E77] rounded-lg p-8 text-center bg-[#C09E77]/5 mb-6">
          <div className="w-16 h-16 mx-auto bg-[#C09E77]/20 rounded-full flex items-center justify-center mb-4">
            <Award className="w-8 h-8 text-[#C09E77]" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Rewards Coming Soon!</h3>
          <p className="text-gray-600">
            We're working on an exciting rewards program for our users. 
            Keep submitting reports to earn points and check back later!
          </p>
        </div>
        
        <div className="bg-[#E41E2B]/5 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 flex items-center">
            <Award className="w-5 h-5 mr-2 text-[#E41E2B]" />
            How to Earn Points
          </h4>
          <ul className="mt-2 text-sm text-gray-600 space-y-2">
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
              <span>Submit new reports: <strong>25 points</strong></span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
              <span>When your report is resolved: <strong>50-200 points</strong> (based on urgency)</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
              <span>Verify your account: <strong>50 points</strong></span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
  
  const AccountTab = () => (
    <div className="py-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Account Information</h2>
      
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {user?.firstName || "—"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {user?.lastName || "—"}
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
              {user?.email || "—"}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {user?.nationalId || "—"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {user?.phone || "—"}
              </div>
            </div>
          </div>
          
          <div className="border border-[#E41E2B]/20 rounded-lg p-4 bg-[#E41E2B]/5">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-[#E41E2B] mr-3 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-800">Need to update your information?</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Please contact our support team at support@fixegypt.com for assistance
                  with updating your account information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-[#F8F4EA] py-10 px-4 sm:px-6" style={{backgroundImage: "url('/egyptian-pattern-bg.png')", backgroundSize: "200px", backgroundBlendMode: "overlay"}}>
      <div className="max-w-6xl mx-auto">
        {/* Top header with background image */}
        <div className="relative rounded-2xl overflow-hidden mb-6 shadow-lg">
          {/* Egyptian pattern as background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#E41E2B] to-[#C09E77]"></div>
          <div className="absolute inset-0 bg-[url('/hieroglyphics-pattern.png')] bg-repeat opacity-10"></div>
          
          {/* Egyptian-inspired decorative elements */}
          <div className="absolute bottom-0 left-0 w-full h-4 bg-[#C09E77]"></div>
          <div className="absolute bottom-4 left-0 w-full h-2 bg-[#E41E2B]"></div>
          
          <div className="relative z-10 p-8 flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              {/* Egyptian-inspired user avatar */}
              <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mr-6 shadow-lg border-2 border-[#C09E77]">
                <span className="text-2xl font-bold text-white">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {user ? `${user.firstName} ${user.lastName}` : "User"}
                </h1>
                <p className="text-white/80 flex items-center">
                  <Award className="w-4 h-4 mr-1.5" /> 
                  {user?.points || 0} Points
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition flex items-center font-medium backdrop-blur-sm border border-white/30"
                onClick={() => navigate("/")}
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </button>
              <button 
                className="px-4 py-2 bg-white text-[#E41E2B] rounded-lg hover:bg-white/90 transition flex items-center font-medium"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
        
        {/* Verification Banner */}
        {!isVerified && (
          <div className="mb-6">
            <VerificationBanner />
          </div>
        )}
        
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-8 p-1 border border-[#C09E77] relative overflow-hidden">
          {/* Egyptian-inspired decorative top border */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E41E2B] via-[#C09E77] to-[#E41E2B]"></div>
          
          <div className="flex">
            <button
              className={`flex-1 py-3 px-4 text-center font-medium rounded-md transition-all ${
                activeTab === "reports" 
                  ? "bg-gradient-to-r from-[#E41E2B] to-[#B71922] text-white" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("reports")}
            >
              Reports
            </button>
            <button
              className={`flex-1 py-3 px-4 text-center font-medium rounded-md transition-all ${
                activeTab === "points" 
                  ? "bg-gradient-to-r from-[#E41E2B] to-[#B71922] text-white" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("points")}
            >
              Points
            </button>
            <button
              className={`flex-1 py-3 px-4 text-center font-medium rounded-md transition-all ${
                activeTab === "account" 
                  ? "bg-gradient-to-r from-[#E41E2B] to-[#B71922] text-white" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("account")}
            >
              Account
            </button>
            <button
              className={`flex-1 py-3 px-4 text-center font-medium rounded-md transition-all ${
                activeTab === "home" 
                  ? "bg-gradient-to-r from-[#E41E2B] to-[#B71922] text-white" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => navigate("/")}
            >
              <Home className="h-4 w-4 inline-block mr-1" />
              Home
            </button>
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-[#C09E77]/30">
          {activeTab === "reports" && <ReportsTab />}
          {activeTab === "points" && <PointsTab />}
          {activeTab === "account" && <AccountTab />}
        </div>
      </div>
      
      {/* Report Details Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10">
              <h3 className="text-xl font-bold">{selectedReport.title}</h3>
              <button 
                onClick={closeReportModal}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              {selectedReport.images && selectedReport.images.length > 0 && (
                <div className="mb-6">
                  <img
                    src={selectedReport.images[0].url}
                    alt={selectedReport.title}
                    className="w-full h-64 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/800x400?text=Image+Unavailable';
                    }}
                  />
                </div>
              )}
              
              <div className="flex justify-between items-center mb-4">
                <span
                  className="inline-block text-sm font-medium px-3 py-1 rounded-full text-white"
                  style={{ backgroundColor: getCategoryColor(selectedReport.category) }}
                >
                  {formatCategoryLabel(selectedReport.category)}
                </span>
                
                <span className={`${getStatusClasses(selectedReport.status)} px-3 py-1 rounded-full text-sm font-semibold`}>
                  {formatStatusLabel(selectedReport.status)}
                </span>
              </div>
              
              <div className="border-t border-b border-gray-100 py-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                <p className="text-gray-600">{selectedReport.description}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Location Details</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    {selectedReport.location && (
                      <>
                        <div className="flex items-center text-gray-600 mb-1">
                          <MapPin className="h-4 w-4 mr-2 text-[#E41E2B]" />
                          <span>{selectedReport.location.address || "Address unavailable"}</span>
                        </div>
                        {selectedReport.location.city && (
                          <div className="pl-6 text-gray-500 text-sm">
                            {selectedReport.location.city}, {selectedReport.location.governorate || "Egypt"}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Report Timeline</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center text-gray-600 mb-2">
                      <CalendarDays className="h-4 w-4 mr-2 text-[#E41E2B]" />
                      <span>Submitted: {new Date(selectedReport.createdAt).toLocaleDateString()} at {new Date(selectedReport.createdAt).toLocaleTimeString()}</span>
                    </div>
                    
                    {selectedReport.updatedAt && selectedReport.updatedAt !== selectedReport.createdAt && (
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2 text-[#E41E2B]" />
                        <span>Last Updated: {new Date(selectedReport.updatedAt).toLocaleDateString()} at {new Date(selectedReport.updatedAt).toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={closeReportModal}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

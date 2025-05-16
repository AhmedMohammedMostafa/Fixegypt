import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState, useContext, useRef } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
  Polyline
} from "react-leaflet";
import { toast } from "react-toastify";
import { Search, MapPin, Loader2, X, Navigation, Ruler, Eye, MousePointer, Layers, Map } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { motion as Motion } from "framer-motion";
import { AppContext } from "../App";
import { reportAPI } from "../utils/api";
import VerificationBanner from "../components/VerificationBanner";
import { useNavigate } from "react-router-dom";

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

// Category colors and labels with Egypt flag-inspired theme
const CATEGORY_COLORS = {
  road_damage: EGYPT_COLORS.red,
  water_issue: "#3b82f6",
  electricity_issue: "#f59e0b",
  waste_management: "#10b981",
  public_property_damage: "#8b5cf6",
  street_lighting: "#fcd34d",
  sewage_problem: "#6b7280",
  public_transportation: "#ef4444",
  environmental_issue: "#84cc16",
  other: "#94a3b8",
};

const CATEGORY_LABELS = {
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

// Custom map pin with Egypt-inspired styling
const getCategoryIcon = (category) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <filter id="shadow" x="-20%" y="0%" width="140%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#00000044" />
        </filter>
        <path 
          d="M32 0C20 0 12 10 12 22C12 38 32 58 32 58S52 38 52 22C52 10 44 0 32 0Z" 
          fill="${CATEGORY_COLORS[category] || "#94a3b8"}"
          filter="url(#shadow)"
        />
        <path
          d="M32 12a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z"
          fill="#fff"
          opacity="0.25"
        />
      </svg>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40], // Anchor at the tip of the pin
    popupAnchor: [0, -40], // Popup appears above the pin
  });
};

// Custom icon for user's own reports
const getUserReportIcon = (category) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <filter id="shadow" x="-20%" y="0%" width="140%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#00000044" />
        </filter>
        <path 
          d="M32 0C20 0 12 10 12 22C12 38 32 58 32 58S52 38 52 22C52 10 44 0 32 0Z" 
          fill="${CATEGORY_COLORS[category] || "#94a3b8"}"
          filter="url(#shadow)"
        />
        <path
          d="M32 12a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z"
          fill="#fff"
          opacity="0.25"
        />
        <circle cx="32" cy="22" r="14" fill="rgba(255,255,255,0.4)" stroke="#fff" stroke-width="2"/>
        <path d="M26 22l4 4 8-8" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,
    iconSize: [45, 45],
    iconAnchor: [22.5, 45],
    popupAnchor: [0, -45],
  });
};

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Map click handler component
const MapClickHandler = ({ onMapClick, mode, onMeasure }) => {
  useMapEvents({
    click: (e) => {
      if (mode === 'select') {
        onMapClick(e.latlng);
      } else if (mode === 'measure') {
        onMeasure(e.latlng);
      }
      // In 'view' mode, we just show info and don't take action
    }
  });
  return null;
};

function LocateUserOnLoad() {
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) {
      // Browser doesn't support Geolocation, fallback immediately
      map.setView([30.0444, 31.2357], 13);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.setView([latitude, longitude], 13);
      },
      (err) => {
        // If user denies or any error, fall back to default
        console.warn("Geolocation failed, using default", err);
        map.setView([30.0444, 31.2357], 13);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  }, [map]);

  return null;
}

export default function Home() {
  const { isLoggedIn, user, isVerified, setIsLoading, logout } = useContext(AppContext);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    location: { 
      lat: null, 
      lng: null,
      address: "",
      city: "",
      governorate: ""
    },
    images: [],
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mapMode, setMapMode] = useState('select'); // 'select', 'measure', 'view'
  const [distanceMeasurement, setDistanceMeasurement] = useState(null);
  const [governoratesList] = useState([
    'Alexandria', 'Aswan', 'Asyut', 'Beheira', 'Beni Suef', 'Cairo', 
    'Dakahlia', 'Damietta', 'Faiyum', 'Gharbia', 'Giza', 'Ismailia', 
    'Kafr El Sheikh', 'Luxor', 'Matruh', 'Minya', 'Monufia', 'New Valley', 
    'North Sinai', 'Port Said', 'Qalyubia', 'Qena', 'Red Sea', 'Sharqia', 
    'Sohag', 'South Sinai', 'Suez'
  ]);
  
  // Load reports from API when component mounts
  useEffect(() => {
    if (isLoggedIn) {
      fetchReports();
    }
  }, [isLoggedIn]);
  
  // Fetch reports from API
  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      const response = await reportAPI.getReports();
      console.log("Reports response:", response);
      
      if (response.success) {
        // Handle different possible response structures
        const allReports = response.data?.reports || 
                           response.data?.data?.reports || 
                           [];
        
        console.log("Reports data parsed:", allReports);
        
        // If user is logged in, filter to show only their reports plus nearby reference reports
        if (isLoggedIn && user && user.id) {
          // Separate user's reports and others
          const userReports = allReports.filter(report => report.userId === user.id);
          let otherReports = allReports.filter(report => report.userId !== user.id);
          
          // For demo purposes - limit other reports to 15 most recent to avoid map clutter
          // In a real app, you'd filter by proximity to user's location
          otherReports = otherReports.slice(0, 15);
          
          // Differentiate user reports with a special property for styling
          const markedUserReports = userReports.map(report => ({
            ...report,
            isUserReport: true
          }));
          
          // Combine user reports and limited other reports
          setMarkers([...markedUserReports, ...otherReports]);
          console.log(`Showing ${userReports.length} user reports and ${otherReports.length} reference reports`);
        } else {
          // Not logged in, show all reports
          setMarkers(allReports);
        }
      } else {
        toast.error("Failed to load reports");
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Error loading reports");
    } finally {
      setIsLoadingReports(false);
    }
  };
  
  // Handle map clicks
  const handleMapClick = (latlng) => {
    setSelectedPosition(latlng);
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        lat: latlng.lat,
        lng: latlng.lng,
      },
    }));
    
    // Add toast notification for selected location
    toast.info("Location selected. Complete the form to submit a report.");
    
    // Clear any location errors
    if (errors.location) {
      setErrors((prev) => ({ ...prev, location: undefined }));
    }
  };
  
  // Update marker position when form inputs change
  useEffect(() => {
    if (formData.location.lat && formData.location.lng) {
      setSelectedPosition(formData.location);
    }
  }, [formData.location.lat, formData.location.lng]);
  
  // Handle logout
  const handleLogout = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };
  
  // Form validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    
    // More detailed location validation
    if (!formData.location.lat || !formData.location.lng) {
      newErrors.location = "Location coordinates are required";
    } else if (!formData.location.address || formData.location.address.trim() === "") {
      newErrors.location = "Street address is required";
    } else if (!formData.location.city || formData.location.city.trim() === "") {
      newErrors.location = "City is required";
    } else if (!formData.location.governorate || formData.location.governorate.trim() === "") {
      newErrors.location = "Governorate is required";
    }
    
    if (formData.images.length === 0) newErrors.images = "Image is required";
    
    // Check if user is logged in
    if (!isLoggedIn) {
      toast.error("Please login to submit a report", {
        onClick: () => window.location.href = '/login',
      });
      return false;
    }
    
    // Check if user is verified
    if (!isVerified) {
      toast.error("Your account must be verified by an admin before submitting reports. Please wait for approval.");
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "lat" || name === "lng") {
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          [name]: parseFloat(value) || null,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setIsLoading(true);
    
    try {
      console.log('===== FORM SUBMISSION DEBUG =====');
      console.log('User object from context:', user);
      
      // Create form data for API
      const reportFormData = new FormData();
      reportFormData.append("title", formData.title);
      reportFormData.append("category", formData.category);
      reportFormData.append("description", formData.description);
      
      // Explicitly add the user ID from context
      if (user && user.id) {
        reportFormData.append("userId", user.id);
      }
      
      // Try direct stringification of each location field instead of the whole object
      // This is an alternative approach that might avoid parsing issues
      reportFormData.append("location[address]", formData.location.address);
      reportFormData.append("location[city]", formData.location.city);
      reportFormData.append("location[governorate]", formData.location.governorate);
      reportFormData.append("location[coordinates][lat]", formData.location.lat);
      reportFormData.append("location[coordinates][lng]", formData.location.lng);
      
      // FOR BACKUP: Also include the original JSON string approach in a different field
      // This allows the backend to use whichever works
      const locationData = {
        address: formData.location.address,
        city: formData.location.city,
        governorate: formData.location.governorate,
        coordinates: {
          lat: formData.location.lat,
          lng: formData.location.lng
        }
      };
      
      // Deep debug - make sure all location properties are of the correct types
      console.log('Location object:', locationData);
      console.log('User ID:', user?.id);
      console.log('Location stringified:', JSON.stringify(locationData));
      
      // Also try the standard JSON approach for comparison
      reportFormData.append("locationJson", JSON.stringify(locationData));
      
      // Append images
      if (formData.images.length > 0) {
        const imageFile = await convertBase64ToFile(formData.images[0], "report-image.jpg");
        reportFormData.append("images", imageFile);
      }
      
      // Debug form data before sending
      console.log('Form data entries:');
      for (let pair of reportFormData.entries()) {
        console.log(`${pair[0]}: ${pair[0] === 'images' ? '[File object]' : pair[1]}`);
      }
      
      // Submit to API
      console.log('Attempting API call with modified reportFormData approach');
      const response = await reportAPI.createReport(reportFormData);
      
      console.log('API Response:', response);
      
      if (response.success) {
        toast.success("Report submitted successfully!");
        
        // Add the new report to markers if needed
        fetchReports();
        
        // Reset form
        setFormData({
          title: "",
          category: "",
          description: "",
          location: { 
            lat: null, 
            lng: null,
            address: "",
            city: "",
            governorate: ""
          },
          images: [],
        });
        setSelectedPosition(null);
      } else {
        console.error("API Error Details:", response.error);
        
        // Enhanced error message with more details
        let errorMessage = response.error?.message || "Failed to submit report";
        if (response.error?.details) {
          errorMessage += `: ${JSON.stringify(response.error.details)}`;
        }
        toast.error(errorMessage);
        
        // If location is the issue, we need to try a completely different approach
        if (errorMessage.includes("Location")) {
          toast.info("Trying alternative approach for location data...");
          
          try {
            // Create a modified version with location as a string in a different format
            const altFormData = new FormData();
            altFormData.append("title", formData.title);
            altFormData.append("category", formData.category);
            altFormData.append("description", formData.description);
            
            // Explicitly add the user ID from context
            if (user && user.id) {
              altFormData.append("userId", user.id);
            }
            
            // Stringify location as a plain field
            altFormData.append("location", JSON.stringify(locationData));
            
            if (formData.images.length > 0) {
              const imageFile = await convertBase64ToFile(formData.images[0], "report-image.jpg");
              altFormData.append("images", imageFile);
            }
            
            console.log("Attempting alternative submission format.");
            const altResponse = await reportAPI.createReport(altFormData);
            
            if (altResponse.success) {
              toast.success("Report submitted successfully with alternative format!");
              
              // Reset form
              setFormData({
                title: "",
                category: "",
                description: "",
                location: { 
                  lat: null, 
                  lng: null,
                  address: "",
                  city: "",
                  governorate: ""
                },
                images: [],
              });
              setSelectedPosition(null);
              
              // Refresh markers
              fetchReports();
            } else {
              console.error("Alternative approach also failed:", altResponse.error);
              toast.error("All submission attempts failed. Please contact support.");
            }
          } catch (altError) {
            console.error("Alternative submission error:", altError);
          }
        }
      }
    } catch (error) {
      console.error("Submission failed exception:", error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };
  
  // Convert base64 to file for API upload
  const convertBase64ToFile = async (base64String, filename) => {
    const res = await fetch(base64String);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
  };
  
  // Handle image selection
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Basic image validation
    if (!file.type.match("image.*")) {
      setErrors((prev) => ({ ...prev, images: "Please select an image file" }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      setErrors((prev) => ({
        ...prev,
        images: "Image must be less than 10MB",
      }));
      return;
    }

    try {
      const base64 = await convertToBase64(file);
      setFormData((prev) => ({
        ...prev,
        images: [base64],
      }));
      setErrors((prev) => ({ ...prev, images: undefined }));
    } catch (error) {
      console.error("Image conversion failed:", error);
      setErrors((prev) => ({ ...prev, images: "Failed to process image" }));
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
    setShowSearchResults(e.target.value.length > 0);
    
    // More advanced search using Nominatim OpenStreetMap service
    if (e.target.value.length > 2) {
      // In a real app, you'd use the Nominatim API with a query like this
      // const query = `${e.target.value}, Egypt`;
      
      // Mock search results for now - in a real app, you'd use the Nominatim API
      setSearchResults([
        { 
          name: `Cairo, ${e.target.value}`, 
          location: { lat: 30.0444, lng: 31.2357 },
          address: `${e.target.value}, Downtown, Cairo`,
          city: "Cairo",
          governorate: "Cairo"
        },
        { 
          name: `Alexandria, near ${e.target.value}`, 
          location: { lat: 31.2001, lng: 29.9187 },
          address: `${e.target.value}, Alexandria`,
          city: "Alexandria",
          governorate: "Alexandria"
        },
        { 
          name: `Giza, ${e.target.value} area`, 
          location: { lat: 30.0131, lng: 31.2089 },
          address: `${e.target.value}, Giza`,
          city: "Giza",
          governorate: "Giza"
        }
      ]);
    } else {
      setSearchResults([]);
    }
  };
  
  // Toggle map mode
  const toggleMapMode = (mode) => {
    setMapMode(mode);
    // Reset measurement when switching away from measure mode
    if (mode !== 'measure') {
      setDistanceMeasurement(null);
    }
  };
  
  // Handle measurement on map
  const handleMeasureClick = (latlng) => {
    if (!distanceMeasurement) {
      // First point
      setDistanceMeasurement({
        start: latlng,
        end: null,
        distance: 0
      });
    } else if (distanceMeasurement.start && !distanceMeasurement.end) {
      // Second point - calculate distance
      const start = L.latLng(distanceMeasurement.start.lat, distanceMeasurement.start.lng);
      const end = L.latLng(latlng.lat, latlng.lng);
      const distanceInMeters = start.distanceTo(end);
      
      setDistanceMeasurement({
        start: distanceMeasurement.start,
        end: latlng,
        distance: distanceInMeters
      });
      
      // Only show distance in toast for significant distances
      if (distanceInMeters > 100) {
        toast.info(`Distance: ${(distanceInMeters / 1000).toFixed(2)} km`);
      }
    } else {
      // Reset and start new measurement
      setDistanceMeasurement({
        start: latlng,
        end: null,
        distance: 0
      });
    }
  };
  
  // Handle map tile type switching
  const [mapTileType, setMapTileType] = useState('streets'); // 'streets', 'satellite', 'terrain'
  
  // Get tile layer URL based on selected type
  const getTileLayerUrl = () => {
    switch(mapTileType) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'terrain':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      case 'streets':
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };
  
  // Get tile layer attribution based on selected type
  const getTileLayerAttribution = () => {
    switch(mapTileType) {
      case 'satellite':
        return 'Imagery &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
      case 'terrain':
        return 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)';
      case 'streets':
      default:
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    }
  };
  
  return (
    <Motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen flex flex-col lg:flex-row bg-gradient-to-br from-white via-white to-[#E41E2B]/20 overflow-hidden"
    >
      {/* Profile Header */}
      {isLoggedIn && (
        <Motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-0 right-0 z-[2000] p-3 flex items-center gap-3"
        >
          <div className="bg-white shadow-md rounded-full px-4 py-2 flex items-center gap-3 border border-[#E41E2B]/20">
            <div className="flex flex-col">
              <button 
                onClick={() => navigate('/profile')}
                className="text-sm font-medium text-gray-700 font-poppins hover:text-[#E41E2B] transition-colors cursor-pointer"
              >
                {user?.firstName} {user?.lastName}
              </button>
              <span className="text-xs text-gray-500 font-poppins">
                {isVerified ? 
                  <span className="text-green-600 flex items-center">
                    <svg viewBox="0 0 24 24" width="12" height="12" className="mr-1" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Verified
                  </span> : 
                  <span className="text-orange-600 flex items-center">
                    <svg viewBox="0 0 24 24" width="12" height="12" className="mr-1" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Awaiting Approval
                  </span>
                }
              </span>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            {user?.role === 'admin' && (
              <>
                <button 
                  onClick={() => navigate('/admin')}
                  className="text-[#E41E2B] hover:text-[#C41E2B] text-sm font-medium font-poppins flex items-center"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" className="mr-1" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4.5c-1.93 0-3.5 1.57-3.5 3.5 0 .91.34 1.73.91 2.36-.3.3-.52.69-.62 1.14H7.5c-1.1 0-2 .9-2 2v3.5h13v-3.5c0-1.1-.9-2-2-2h-1.29c-.1-.45-.32-.84-.62-1.14.56-.63.91-1.45.91-2.36 0-1.93-1.57-3.5-3.5-3.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Admin
                </button>
                <div className="h-8 w-px bg-gray-200"></div>
              </>
            )}
            <button 
              onClick={handleLogout}
              className="text-[#E41E2B] hover:text-[#C41E2B] text-sm font-medium font-poppins flex items-center"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" className="mr-1" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Logout
            </button>
          </div>
        </Motion.div>
      )}

      {/* Form panel */}
      <Motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="h-2/5 lg:h-full lg:w-1/3 bg-white p-4 lg:p-6 shadow-lg rounded-t-2xl lg:rounded-t-none lg:rounded-l-2xl overflow-y-auto hide-scrollbar border-t-4 border-l-4 border-b-4 lg:border-t-4 lg:border-l-4 lg:border-b-4 lg:border-r-0 border-[#E41E2B]"
      >
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
              Fix Egypt
            </h2>
            <p className="text-gray-600 font-poppins text-sm">
              Report infrastructure issues in your community
            </p>
          </div>
        </div>
        
        {/* Custom Verification Banner with admin message */}
        {isLoggedIn && !isVerified && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-orange-500 mt-0.5 mr-3" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <div>
                <h3 className="font-medium text-orange-800 font-poppins">Account Verification Required</h3>
                <p className="text-sm text-orange-700 mt-1 font-poppins">
                  Your account is awaiting verification by an administrator. 
                  You'll be able to submit reports once your account is approved.
                </p>
              </div>
            </div>
          </div>
        )}
        
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium font-poppins flex items-center">
              <span className="w-2 h-2 bg-[#E41E2B] mr-1.5 rounded-sm"></span>
              Title
            </label>
            <input
              type="text"
              name="title"
              className={`w-full mt-1 px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 font-poppins
              ${
                errors.title 
                  ? "border-red-500 focus:ring-red-300" 
                  : "border-[#E41E2B]/20 focus:border-[#E41E2B] focus:ring-[#E41E2B]/20"
              }`}
              placeholder="E.g. Pothole on Main Street"
              onChange={handleChange}
              value={formData.title}
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1 font-poppins">{errors.title}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium font-poppins flex items-center">
              <span className="w-2 h-2 bg-[#E41E2B] mr-1.5 rounded-sm"></span>
              Category
            </label>
            <select
              name="category"
              className={`w-full mt-1 px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 font-poppins
              ${
                errors.category 
                  ? "border-red-500 focus:ring-red-300" 
                  : "border-[#E41E2B]/20 focus:border-[#E41E2B] focus:ring-[#E41E2B]/20"
              }`}
              onChange={handleChange}
              value={formData.category}
            >
              <option value="">Select category</option>
              <option value="road_damage">Road Damage</option>
              <option value="water_issue">Water Issue</option>
              <option value="electricity_issue">Electricity Issue</option>
              <option value="waste_management">Waste Management</option>
              <option value="public_property_damage">
                Public Property Damage
              </option>
              <option value="street_lighting">Street Lighting</option>
              <option value="sewage_problem">Sewage Problem</option>
              <option value="public_transportation">
                Public Transportation
              </option>
              <option value="environmental_issue">Environmental Issue</option>
              <option value="other">Other</option>
            </select>
            {errors.category && (
              <p className="text-red-500 text-xs mt-1 font-poppins">{errors.category}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium font-poppins flex items-center">
              <span className="w-2 h-2 bg-[#E41E2B] mr-1.5 rounded-sm"></span>
              Description
            </label>
            <textarea
              name="description"
              rows="3"
              className={`w-full mt-1 px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 font-poppins resize-none
              ${
                errors.description 
                  ? "border-red-500 focus:ring-red-300" 
                  : "border-[#E41E2B]/20 focus:border-[#E41E2B] focus:ring-[#E41E2B]/20"
              }`}
              placeholder="Describe the issue in detail..."
              onChange={handleChange}
              value={formData.description}
            ></textarea>
            {errors.description && (
              <p className="text-red-500 text-xs mt-1 font-poppins">{errors.description}</p>
            )}
          </div>

          {/* Location information note */}
          <div className="bg-gradient-to-r from-[#E41E2B]/5 to-[#C09E77]/10 p-4 rounded-lg border border-[#E41E2B]/20">
            <div className="flex items-start space-x-2">
              <MapPin className="h-5 w-5 text-[#E41E2B] mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-[#E41E2B] font-poppins text-sm">Location Selection</h4>
                <p className="text-gray-600 text-xs font-poppins mt-1">
                  Use the map to select a location. Click on the map to place a marker, or use the search bar or location button in the map area to find your location.
                </p>
              </div>
            </div>
          </div>

          {/* Manual Location (Lat/Lng) */}
          <div className="relative">
            <label className="block text-sm font-medium font-poppins flex items-center">
              <span className="w-2 h-2 bg-[#E41E2B] mr-1.5 rounded-sm"></span>
              Location Coordinates
            </label>
            <div className="grid grid-cols-2 gap-4 mt-1">
              <div>
                <input
                  type="number"
                  name="lat"
                  step="any"
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 font-poppins bg-gray-50
                  ${
                    errors.location 
                      ? "border-red-500 focus:ring-red-300" 
                      : "border-[#E41E2B]/20 focus:border-[#E41E2B] focus:ring-[#E41E2B]/20"
                  }`}
                  placeholder="Latitude"
                  onChange={handleChange}
                  value={formData.location.lat || ""}
                  readOnly
                />
              </div>
              <div>
                <input
                  type="number"
                  name="lng"
                  step="any"
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 font-poppins bg-gray-50
                  ${
                    errors.location 
                      ? "border-red-500 focus:ring-red-300" 
                      : "border-[#E41E2B]/20 focus:border-[#E41E2B] focus:ring-[#E41E2B]/20"
                  }`}
                  placeholder="Longitude"
                  onChange={handleChange}
                  value={formData.location.lng || ""}
                  readOnly
                />
              </div>
            </div>
            {errors.location && (
              <p className="text-red-500 text-xs mt-1 font-poppins">{errors.location}</p>
            )}
            {formData.location.lat && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPosition(null);
                  setFormData((prev) => ({
                    ...prev,
                    location: { 
                      lat: null, 
                      lng: null, 
                      address: "", 
                      city: "", 
                      governorate: "" 
                    },
                  }));
                  setSearchValue("");
                }}
                className="absolute -top-1 right-0 text-[#E41E2B] hover:text-[#C41E2B] text-sm font-poppins flex items-center"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </button>
            )}
          </div>

          {/* Address Fields */}
          <div>
            <label className="block text-sm font-medium font-poppins flex items-center">
              <span className="w-2 h-2 bg-[#E41E2B] mr-1.5 rounded-sm"></span>
              Address Details
            </label>
            <div className="space-y-3 mt-1">
              <input
                type="text"
                name="address"
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 font-poppins
                ${
                  errors.location 
                    ? "border-red-500 focus:ring-red-300" 
                    : "border-[#E41E2B]/20 focus:border-[#E41E2B] focus:ring-[#E41E2B]/20"
                }`}
                placeholder="Street Address"
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  location: {
                    ...prev.location,
                    address: e.target.value
                  }
                }))}
                value={formData.location.address}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="city"
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 font-poppins
                  ${
                    errors.location 
                      ? "border-red-500 focus:ring-red-300" 
                      : "border-[#E41E2B]/20 focus:border-[#E41E2B] focus:ring-[#E41E2B]/20"
                  }`}
                  placeholder="City"
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    location: {
                      ...prev.location,
                      city: e.target.value
                    }
                  }))}
                  value={formData.location.city}
                />
                
                <select
                  name="governorate"
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 font-poppins
                  ${
                    errors.location 
                      ? "border-red-500 focus:ring-red-300" 
                      : "border-[#E41E2B]/20 focus:border-[#E41E2B] focus:ring-[#E41E2B]/20"
                  }`}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    location: {
                      ...prev.location,
                      governorate: e.target.value
                    }
                  }))}
                  value={formData.location.governorate}
                >
                  <option value="">Select Governorate</option>
                  {governoratesList.map((gov) => (
                    <option key={gov} value={gov}>{gov}</option>
                  ))}
                </select>
              </div>
              
              <div className="mt-1 text-xs text-gray-500 font-poppins italic">
                <span className="text-[#E41E2B]">*</span> Please provide the full address details for accurate reporting
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-poppins flex items-center">
              <span className="w-2 h-2 bg-[#E41E2B] mr-1.5 rounded-sm"></span>
              Upload Photo
            </label>

            <div className="mt-1">
              {/* Hidden file input */}
              <input
                type="file"
                name="image"
                id="image-upload"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
                ref={fileInputRef}
              />

              {/* Custom styled button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`inline-flex items-center px-4 py-2 border-2 border-transparent rounded-md font-semibold text-white transition-colors font-poppins
                ${
                  errors.images
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-gradient-to-r from-[#E41E2B] to-[#C41E2B] hover:from-[#C41E2B] hover:to-[#B41E2B]"
                } shadow-md`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
                {formData.images.length > 0 ? "Change Image" : "Choose Photo"}
              </button>
            </div>

            {/* Error message */}
            {errors.images && (
              <p className="text-red-500 text-xs mt-1 font-poppins">{errors.images}</p>
            )}

            {/* Image preview */}
            {formData.images.length > 0 && (
              <Motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600 font-poppins">Preview:</p>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, images: [] })}
                    className="text-[#E41E2B] hover:text-[#C41E2B] text-sm font-poppins flex items-center"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </button>
                </div>
                <div className="border-2 border-[#E41E2B]/20 rounded-lg p-1 bg-white">
                  <img
                    src={formData.images[0]}
                    alt="Preview"
                    className="w-full max-h-48 object-contain rounded-md"
                  />
                </div>
              </Motion.div>
            )}
          </div>

          {/* Submit Button */}
          <Motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-gradient-to-r from-[#E41E2B] to-[#C41E2B] hover:from-[#C41E2B] hover:to-[#B41E2B] text-white font-semibold py-3 rounded-lg transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-cairo text-lg
            ${isSubmitting ? "opacity-70" : ""}`}
          >
            {isSubmitting ? (
              <span className="inline-flex items-center">
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Submitting...
              </span>
            ) : (
              "Submit Report"
            )}
          </Motion.button>
          
          {!isLoggedIn && (
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600 font-poppins">
                <span className="text-red-500">*</span> You need to{" "}
                <a href="/login" className="text-[#E41E2B] font-medium hover:underline">
                  log in
                </a>{" "}
                to submit a report.
              </p>
            </div>
          )}
        </form>
      </Motion.div>

      {/* Map container */}
      <Motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="h-3/5 lg:h-full lg:w-2/3 bg-gray-100 shadow-lg rounded-b-2xl lg:rounded-b-none lg:rounded-r-2xl relative border-t-0 border-r-4 border-b-4 lg:border-t-4 lg:border-r-4 lg:border-b-4 lg:border-l-0 border-[#E41E2B]"
      >
        {/* Map Search - Updated to be smaller and more modern */}
        <div className="absolute top-4 right-4 z-[1000] w-72 bg-white shadow-lg rounded-full border border-[#E41E2B]/20 overflow-hidden">
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#E41E2B] h-4 w-4" />
            <input
              type="text"
              placeholder="Search locations..."
              value={searchValue}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-8 py-2 focus:outline-none text-sm font-poppins rounded-full bg-transparent"
            />
            {searchValue && (
              <button 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setSearchValue('');
                  setSearchResults([]);
                  setShowSearchResults(false);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          
          {/* Search Results */}
          <AnimatePresence>
            {showSearchResults && searchResults.length > 0 && (
              <Motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="absolute top-full left-0 right-0 mt-1 border border-[#E41E2B]/10 rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto z-50"
              >
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-[#E41E2B]/5 font-poppins text-sm border-b last:border-b-0 flex items-center"
                    onClick={() => {
                      const map = document.querySelector('.leaflet-container')?._leaflet_map;
                      if (map) {
                        map.setView([result.location.lat, result.location.lng], 16);
                      }
                      // Update form data with search result location and address
                      setFormData(prev => ({
                        ...prev,
                        location: {
                          lat: result.location.lat,
                          lng: result.location.lng,
                          address: result.address,
                          city: result.city,
                          governorate: result.governorate
                        }
                      }));
                      setSelectedPosition({ 
                        lat: result.location.lat, 
                        lng: result.location.lng 
                      });
                      setSearchValue(result.name);
                      setShowSearchResults(false);
                    }}
                  >
                    <MapPin className="h-4 w-4 mr-2 text-[#E41E2B]" />
                    {result.name}
                  </button>
                ))}
              </Motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Map Toolbar */}
        <div className="absolute top-16 right-4 z-[1000] bg-white shadow-lg rounded-lg border border-[#E41E2B]/20 overflow-hidden">
          <div className="p-2 flex flex-col gap-2">
            <button 
              className={`p-2 rounded-lg flex items-center justify-center ${mapMode === 'select' ? 'bg-[#E41E2B] text-white' : 'hover:bg-gray-100'}`}
              onClick={() => toggleMapMode('select')}
              title="Select Mode - Click to select a location"
            >
              <MousePointer className="h-5 w-5" />
            </button>
            <button 
              className={`p-2 rounded-lg flex items-center justify-center ${mapMode === 'measure' ? 'bg-[#E41E2B] text-white' : 'hover:bg-gray-100'}`}
              onClick={() => toggleMapMode('measure')}
              title="Measure Mode - Click two points to measure distance"
            >
              <Ruler className="h-5 w-5" />
            </button>
            <button 
              className={`p-2 rounded-lg flex items-center justify-center ${mapMode === 'view' ? 'bg-[#E41E2B] text-white' : 'hover:bg-gray-100'}`}
              onClick={() => toggleMapMode('view')}
              title="View Mode - Explore without changing selection"
            >
              <Eye className="h-5 w-5" />
            </button>
            <div className="w-full h-px bg-gray-200"></div>
            <button 
              className="p-2 rounded-lg flex items-center justify-center hover:bg-gray-100"
              onClick={() => {
                const map = document.querySelector('.leaflet-container')?._leaflet_map;
                if (map) {
                  map.invalidateSize();
                  if (selectedPosition) {
                    map.setView([selectedPosition.lat, selectedPosition.lng], 16);
                  }
                }
              }}
              title="Recenter Map"
            >
              <Layers className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Egypt Flag Color Strip */}
        <div className="absolute top-16 left-4 z-[999] flex flex-col rounded-lg overflow-hidden shadow-md border border-gray-200">
          <div className="w-4 h-4 bg-[#E41E2B]"></div>
          <div className="w-4 h-4 bg-white"></div>
          <div className="w-4 h-4 bg-black"></div>
        </div>
        
        {/* Egyptian Decorative Elements */}
        <div className="absolute left-4 bottom-24 z-[999] flex items-center justify-center">
          <div className="w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-lg border-2 border-[#E41E2B]">
            <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              {/* Simplified Ankh - Egyptian symbol of life */}
              <path 
                d="M50 10 C 60 10, 70 20, 70 35 C 70 50, 60 60, 50 70 C 40 60, 30 50, 30 35 C 30 20, 40 10, 50 10 Z" 
                fill="none" 
                stroke={EGYPT_COLORS.gold} 
                strokeWidth="4"
              />
              <line x1="50" y1="70" x2="50" y2="90" stroke={EGYPT_COLORS.gold} strokeWidth="4" />
              <line x1="30" y1="45" x2="70" y2="45" stroke={EGYPT_COLORS.gold} strokeWidth="4" />
            </svg>
          </div>
        </div>
        
        {/* Map Layer Control */}
        <div className="absolute bottom-32 right-4 z-[1000] bg-white shadow-lg rounded-lg border border-[#E41E2B]/20 overflow-hidden">
          <div className="p-2 flex flex-col gap-2">
            <button 
              className={`p-2 rounded-lg flex items-center justify-center ${mapTileType === 'streets' ? 'bg-[#E41E2B] text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setMapTileType('streets')}
              title="Streets Map"
            >
              <Map className="h-5 w-5" />
            </button>
            <button 
              className={`p-2 rounded-lg flex items-center justify-center ${mapTileType === 'satellite' ? 'bg-[#E41E2B] text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setMapTileType('satellite')}
              title="Satellite View"
            >
              <svg viewBox="0 0 24 24" height="20" width="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12a4 4 0 0 1 8 0" />
                <line x1="12" y1="2" x2="12" y2="4" />
                <line x1="12" y1="20" x2="12" y2="22" />
                <line x1="4" y1="12" x2="2" y2="12" />
                <line x1="22" y1="12" x2="20" y2="12" />
              </svg>
            </button>
            <button 
              className={`p-2 rounded-lg flex items-center justify-center ${mapTileType === 'terrain' ? 'bg-[#E41E2B] text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setMapTileType('terrain')}
              title="Terrain Map"
            >
              <svg viewBox="0 0 24 24" height="20" width="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 22l10-10 2 2 10-10" />
                <path d="M5 8l5 5" />
                <circle cx="10" cy="13" r="2" />
                <path d="M10 13L22 1" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Current Location Button - Enhanced for better GPS */}
        <button
          onClick={() => {
            if (navigator.geolocation) {
              setIsLoading(true);
              
              // Use high accuracy and lower timeout for better GPS precision
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const { latitude, longitude, accuracy } = position.coords;
                  const map = document.querySelector('.leaflet-container')?._leaflet_map;
                  
                  if (map) {
                    // Set zoom level based on accuracy
                    const zoomLevel = accuracy < 100 ? 18 : 
                                      accuracy < 500 ? 16 : 
                                      accuracy < 1000 ? 14 : 12;
                    
                    map.setView([latitude, longitude], zoomLevel);
                  }
                  
                  // Set marker position
                  setSelectedPosition({ lat: latitude, lng: longitude });
                  
                  // Use reverse geocoding to get address info (simplified here)
                  setFormData(prev => ({
                    ...prev,
                    location: {
                      ...prev.location,
                      lat: latitude,
                      lng: longitude,
                      // We would call a real reverse geocoding service here
                    }
                  }));
                  
                  toast.success("Location found!");
                  setIsLoading(false);
                },
                (error) => {
                  console.error("Geolocation error:", error);
                  setIsLoading(false);
                  
                  // More specific error messages
                  if (error.code === error.PERMISSION_DENIED) {
                    toast.error("Location access denied. Please enable location services in your browser.");
                  } else if (error.code === error.POSITION_UNAVAILABLE) {
                    toast.error("Location information is unavailable. Try again in a more open area.");
                  } else if (error.code === error.TIMEOUT) {
                    toast.error("Location request timed out. Please try again.");
                  } else {
                    toast.error("Couldn't get your location. Please try again.");
                  }
                },
                {
                  enableHighAccuracy: true,  // Request the most accurate position
                  timeout: 10000,            // Wait up to 10 seconds
                  maximumAge: 0              // Always get fresh location data
                }
              );
            } else {
              toast.error("Geolocation is not supported by your browser");
            }
          }}
          className="absolute bottom-24 right-4 z-[1000] bg-[#E41E2B] text-white rounded-full p-3 shadow-lg hover:bg-[#C41E2B] transition-colors flex items-center justify-center border-2 border-white"
          title="Find my location"
        >
          <Navigation className="h-6 w-6" />
        </button>
        
        {/* Loading indicator for reports */}
        {isLoadingReports && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-[999]">
            <div className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-lg">
              <Loader2 className="h-5 w-5 text-[#E41E2B] animate-spin" />
              <span className="font-poppins text-sm">Loading reports...</span>
            </div>
          </div>
        )}
        
        <MapContainer
          center={[30.0444, 31.2357]}
          zoom={13}
          scrollWheelZoom={true}
          className="w-full h-full rounded-b-2xl lg:rounded-b-none lg:rounded-r-2xl"
        >
          <TileLayer
            url={getTileLayerUrl()}
            attribution={getTileLayerAttribution()}
          />
          {/* On-load geolocation fallback logic */}
          <LocateUserOnLoad />
          <MapClickHandler onMapClick={handleMapClick} mode={mapMode} onMeasure={handleMeasureClick} />
          
          {/* Selected position marker */}
          {selectedPosition && (
            <Marker
              position={selectedPosition}
              icon={getCategoryIcon(formData.category)}
            >
              <Popup>
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-lg font-cairo">
                    {formData.title || "New Report"}
                  </h3>
                  <span
                    className="inline-block px-2 py-1 rounded-full text-sm text-white font-poppins"
                    style={{
                      backgroundColor: CATEGORY_COLORS[formData.category],
                    }}
                  >
                    {CATEGORY_LABELS[formData.category] || "Uncategorized"}
                  </span>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Existing report markers */}
          {markers.map((marker, index) => (
            <Marker
              key={index}
              position={[
                marker.location?.coordinates?.lat || 30.0444, 
                marker.location?.coordinates?.lng || 31.2357
              ]}
              icon={marker.isUserReport ? getUserReportIcon(marker.category) : getCategoryIcon(marker.category)}
            >
              <Popup>
                <div className="flex flex-col gap-2 font-poppins">
                  <h3 className="font-bold text-lg font-cairo">{marker.title}</h3>
                  {marker.isUserReport && (
                    <div className="bg-[#E41E2B]/10 px-2 py-1 rounded-md text-[#E41E2B] text-sm font-medium mb-1">
                      Your Report
                    </div>
                  )}
                  <span
                    className="inline-block px-2 py-1 rounded-full text-sm text-white font-medium"
                    style={{
                      backgroundColor: CATEGORY_COLORS[marker.category],
                      border: `2px solid ${CATEGORY_COLORS[marker.category]}`,
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    }}
                  >
                    {CATEGORY_LABELS[marker.category]}
                  </span>
                  <p className="text-gray-600">{marker.description}</p>
                  {marker.status && (
                    <div className="mt-1">
                      <span className="text-sm font-semibold">Status: </span>
                      <span className={`text-sm font-medium ${
                        marker.status === 'resolved' ? 'text-green-600' : 
                        marker.status === 'in-progress' ? 'text-blue-600' :
                        marker.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {marker.status.charAt(0).toUpperCase() + marker.status.slice(1)}
                      </span>
                    </div>
                  )}
                  {isLoggedIn && user && marker.userId === user.id && (
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this report?")) {
                          reportAPI.deleteReport(marker.id)
                            .then(response => {
                              if (response.success) {
                                toast.success("Report deleted successfully");
                                setMarkers(prev => prev.filter(m => m.id !== marker.id));
                              } else {
                                toast.error(response.error?.message || "Failed to delete report");
                              }
                            });
                        }
                      }}
                      className="mt-2 bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Motion.div>
    </Motion.div>
  );
}
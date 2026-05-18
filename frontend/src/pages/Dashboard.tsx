import React, { useEffect, useState } from "react";
import { useAuth } from "@contexts/authStore";
import { useNavigate } from "react-router-dom";
import { db } from "@services/firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import axios from "axios";
import {
  LogOut,
  CloudRain,
  Sun,
  Droplets,
  Leaf,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Camera,
  User as UserIcon,
  Bell,
  Settings,
  LayoutDashboard,
  HeartPulse,
  ClipboardList,
  HelpCircle,
  Wind,
  AlertCircle,
  ArrowRight,
  FlaskConical,
  TrendingUp,
  Activity,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  ComposedChart,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import "./Dashboard.css";
import WeatherBackground from "../components/WeatherBackground";
import YuviWidget from "../components/yuvi/YuviWidget";

interface FarmData {
  farmerName: string;
  cropType: string;
  plantingDate: string;
  farmSize: number;
  soilType: string;
  location: string;
  lat?: number;
  lon?: number;
  id?: string;
}

interface YieldMockData {
  crop: string;
  expectedYield: number;
  potentialYield: number;
  yieldImprovementPercent: number;
  confidence: number;
  confidenceReason: string[];
  harvestDate: string;
  remainingDays: number;
  currentStage: string;
  ignoredYield: number;
  ignoredCauses: string[];
  previousYield: number;
  previousImprovementPercent: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  riskCause: string;
  reducers: { factor: string; loss: number }[];
  recoveryScenarios: { action: string; gain: number }[];
  maxRecoverable: number;
  actionTimeline: { period: string; action: string }[];
  graphData: { name: string; yieldVal: number }[];
}

const getYieldMockData = (cropType: string): YieldMockData => {
  const normalized = (cropType || "Rice").toLowerCase();
  if (normalized.includes("tomato")) {
    return {
      crop: "Tomato",
      expectedYield: 32.4,
      potentialYield: 38.0,
      yieldImprovementPercent: 17,
      confidence: 89,
      confidenceReason: ["Drip irrigation system functional", "Soil pH stable at 6.3", "Adequate warm temp forecast"],
      harvestDate: "September 15, 2026",
      remainingDays: 28,
      currentStage: "Fruit Development",
      ignoredYield: 26.8,
      ignoredCauses: ["Calcium deficiency (Blossom End Rot)", "Early Blight spread", "Severe moisture stress"],
      previousYield: 29.5,
      previousImprovementPercent: 9.8,
      riskLevel: "Moderate",
      riskCause: "High disease pressure due to morning mist",
      reducers: [
        { factor: "Calcium deficiency", loss: 3.5 },
        { factor: "Early Blight risk", loss: 1.5 },
        { factor: "Low soil moisture", loss: 0.6 }
      ],
      recoveryScenarios: [
        { action: "If Calcium spray applied", gain: 2.5 },
        { action: "If Fungicide treated", gain: 1.0 },
        { action: "If drip irrigation adjusted", gain: 0.5 }
      ],
      maxRecoverable: 4.0,
      actionTimeline: [
        { period: "Today", action: "Apply foliar calcium nitrate solution" },
        { period: "Next 2 days", action: "Apply preventative copper fungicide spray" },
        { period: "Next week", action: "Optimize drip irrigation volume for fruiting" }
      ],
      graphData: [
        { name: "Today", yieldVal: 32.4 },
        { name: "Calcium", yieldVal: 34.9 },
        { name: "Fungicide", yieldVal: 35.9 },
        { name: "Drip Adj", yieldVal: 36.4 }
      ]
    };
  } else if (normalized.includes("potato")) {
    return {
      crop: "Potato",
      expectedYield: 22.1,
      potentialYield: 25.5,
      yieldImprovementPercent: 15,
      confidence: 91,
      confidenceReason: ["Optimal soil hilling complete", "No late blight spots detected", "Soil potassium levels adequate"],
      harvestDate: "September 22, 2026",
      remainingDays: 35,
      currentStage: "Tuber Bulking",
      ignoredYield: 18.5,
      ignoredCauses: ["Potassium deficiency", "Late Blight spread", "Heat stress causing tuber secondary growth"],
      previousYield: 19.8,
      previousImprovementPercent: 11.6,
      riskLevel: "Low",
      riskCause: "Weather remains dry and favorable",
      reducers: [
        { factor: "Potassium deficit", loss: 1.8 },
        { factor: "Late Blight threat", loss: 1.0 },
        { factor: "Heat stress", loss: 0.6 }
      ],
      recoveryScenarios: [
        { action: "If potash applied", gain: 1.5 },
        { action: "If late blight treated", gain: 0.8 },
        { action: "If straw mulch added", gain: 0.2 }
      ],
      maxRecoverable: 2.5,
      actionTimeline: [
        { period: "Today", action: "Apply Muriate of Potash (MOP) fertilizer" },
        { period: "Next 3 days", action: "Weekly systematic scout for Late Blight spots" },
        { period: "Next week", action: "Spread organic straw mulch to cool soil" }
      ],
      graphData: [
        { name: "Today", yieldVal: 22.1 },
        { name: "Potash", yieldVal: 23.6 },
        { name: "Blight Tx", yieldVal: 24.4 },
        { name: "Mulch", yieldVal: 24.6 }
      ]
    };
  } else if (normalized.includes("maize")) {
    return {
      crop: "Maize",
      expectedYield: 7.2,
      potentialYield: 8.5,
      yieldImprovementPercent: 18,
      confidence: 84,
      confidenceReason: ["Strong stalk vigor noted", "Rainfall well distributed", "Moderate weed control success"],
      harvestDate: "October 20, 2026",
      remainingDays: 50,
      currentStage: "Silking",
      ignoredYield: 6.0,
      ignoredCauses: ["Severe Zinc deficiency", "Fall Armyworm infestation", "Critical drought during grain fill"],
      previousYield: 6.5,
      previousImprovementPercent: 10.7,
      riskLevel: "High",
      riskCause: "Fall Armyworm swarms reported in adjacent sectors",
      reducers: [
        { factor: "Zinc deficiency", loss: 0.6 },
        { factor: "Fall Armyworm risk", loss: 0.5 },
        { factor: "Moisture stress", loss: 0.2 }
      ],
      recoveryScenarios: [
        { action: "If Zinc EDTA applied", gain: 0.5 },
        { action: "If pesticide applied", gain: 0.4 },
        { action: "If irrigation completed", gain: 0.4 }
      ],
      maxRecoverable: 1.3,
      actionTimeline: [
        { period: "Today", action: "Apply chelated Zinc EDTA formulation" },
        { period: "Next 2 days", action: "Deploy pheromone traps for Fall Armyworm monitoring" },
        { period: "Next week", action: "Ensure center-pivot pressure is constant during silking" }
      ],
      graphData: [
        { name: "Today", yieldVal: 7.2 },
        { name: "Zinc", yieldVal: 7.7 },
        { name: "FAW Tx", yieldVal: 8.1 },
        { name: "Irrigate", yieldVal: 8.5 }
      ]
    };
  } else if (normalized.includes("grapes")) {
    return {
      crop: "Grapes",
      expectedYield: 14.8,
      potentialYield: 17.2,
      yieldImprovementPercent: 16,
      confidence: 88,
      confidenceReason: ["Good cluster development", "Drip emitters fully clear", "Optimal canopy density"],
      harvestDate: "November 8, 2026",
      remainingDays: 60,
      currentStage: "Veraison",
      ignoredYield: 12.1,
      ignoredCauses: ["Magnesium deficiency causing chlorosis", "Powdery Mildew outbreak", "Canopy shading reducing sugar"],
      previousYield: 13.5,
      previousImprovementPercent: 9.6,
      riskLevel: "Critical",
      riskCause: "High relative humidity triggering mildew outbreak",
      reducers: [
        { factor: "Magnesium deficiency", loss: 1.2 },
        { factor: "Powdery Mildew risk", loss: 0.8 },
        { factor: "Excess shading", loss: 0.4 }
      ],
      recoveryScenarios: [
        { action: "If Magnesium applied", gain: 1.0 },
        { action: "If Powdery spray applied", gain: 0.8 },
        { action: "If canopy thinned", gain: 0.6 }
      ],
      maxRecoverable: 2.4,
      actionTimeline: [
        { period: "Today", action: "Apply foliar Epsom Salts (Magnesium Sulfate)" },
        { period: "Next 24 hours", action: "Spray wettable sulfur to suppress mildew" },
        { period: "Next week", action: "Thin vineyard canopy to enhance air flow" }
      ],
      graphData: [
        { name: "Today", yieldVal: 14.8 },
        { name: "Magnesium", yieldVal: 15.8 },
        { name: "Sulfur Tx", yieldVal: 16.6 },
        { name: "Canopy", yieldVal: 17.2 }
      ]
    };
  } else {
    // Default to RICE
    return {
      crop: "Rice",
      expectedYield: 4.9,
      potentialYield: 5.3,
      yieldImprovementPercent: 8,
      confidence: 86,
      confidenceReason: ["Stable micro-climate weather", "Active disease monitoring low threat", "Sufficient historical sector data"],
      harvestDate: "October 12, 2026",
      remainingDays: 42,
      currentStage: "Flowering",
      ignoredYield: 4.4,
      ignoredCauses: ["Nitrogen deficiency in early grain fill", "Brown Spot fungal spread", "Severe moisture stress during flowering"],
      previousYield: 4.2,
      previousImprovementPercent: 16,
      riskLevel: "Moderate",
      riskCause: "Relative humidity increasing rapidly",
      reducers: [
        { factor: "Nitrogen deficiency", loss: 0.2 },
        { factor: "Disease risk", loss: 0.1 },
        { factor: "High humidity", loss: 0.1 }
      ],
      recoveryScenarios: [
        { action: "If fertilizer applied", gain: 0.2 },
        { action: "If disease treated", gain: 0.15 },
        { action: "If irrigation improved", gain: 0.05 }
      ],
      maxRecoverable: 0.4,
      actionTimeline: [
        { period: "Today", action: "Apply phosphorus/potassium fertilizer top-dress" },
        { period: "Next 3 days", action: "Monitor crop for Brown Spot symptoms" },
        { period: "Next week", action: "Adjust standing water level in paddock" }
      ],
      graphData: [
        { name: "Today", yieldVal: 4.9 },
        { name: "Fertilizer", yieldVal: 5.1 },
        { name: "Treatment", yieldVal: 5.25 },
        { name: "Rainfall", yieldVal: 5.3 }
      ]
    };
  }
};

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<
    "dashboard" | "fertilizer" | "yield" | "profile"
  >("dashboard");
  const [userFarms, setUserFarms] = useState<FarmData[]>([]);
  const [activeFarmId, setActiveFarmId] = useState<string | null>(null);
  const [farmData, setFarmData] = useState<FarmData | null>(null);
  const [weatherForecast, setWeatherForecast] = useState<any[]>([]);
  const [weatherForecastWeekly, setWeatherForecastWeekly] = useState<any[]>([]);
  const [weatherIntelligence, setWeatherIntelligence] = useState<any>(null);
  const [chartView, setChartView] = useState<"24h" | "weekly">("24h");

  // Backend States
  const [growthData, setGrowthData] = useState<any>(null);

  const [scanResult, setScanResult] = useState<any>(null);

  // New Farming Insights State
  const [farmingInsights, setFarmingInsights] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      try {
        // 1. Fetch Farm Data from Firestore
        const q = query(collection(db, "farms"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        let farms: FarmData[] = [];
        querySnapshot.forEach((doc) => {
          farms.push({ id: doc.id, ...doc.data() } as FarmData);
        });

        if (farms.length === 0) {
          navigate("/setup");
          return;
        }

        setUserFarms(farms);
        
        // Determine active farm
        let farmDetails = farms.find(f => f.id === activeFarmId) || farms[0];
        if (!activeFarmId) setActiveFarmId(farmDetails.id || null);
        
        setFarmData(farmDetails);
        localStorage.setItem("uvion_crop_type", farmDetails.cropType);

        // 2. Fetch Weather Intelligence
        let currentTemp = 25;
        let currentRain = 0;
        let currentHumidity = 60;

        if (farmDetails.lat && farmDetails.lon) {
          try {
            const wiRes = await axios.post(
              `${import.meta.env.VITE_API_BASE_URL}/api/v1/weather-intelligence`,
              {
                lat: farmDetails.lat,
                lon: farmDetails.lon,
                crop_type: farmDetails.cropType,
              },
            );
            if (wiRes.data?.status === "success") {
              const wi = wiRes.data.data;
              setWeatherIntelligence(wi);
              setWeatherForecast(wi.chart_data_24h || []);
              setWeatherForecastWeekly(wi.chart_data_weekly || []);

              if (wi.chart_data_24h && wi.chart_data_24h.length > 0) {
                currentTemp = wi.chart_data_24h[0].temp;
                currentHumidity = wi.chart_data_24h[0].humidity;
                currentRain = wi.chart_data_24h[0].rain;
              }
            }
          } catch (wiErr) {
            console.error("Weather Intelligence API Error:", wiErr);
          }
        }

        // 3. Fetch Comprehensive Growth Prediction from Backend
        try {
          const growthRes = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/api/v1/growth-prediction`,
            {
              crop_type: farmDetails.cropType,
              planting_date: farmDetails.plantingDate,
              temperature: currentTemp,
              humidity: currentHumidity,
              rainfall: currentRain * 10,
              soil_fertility: "Medium",
            },
          );

          if (growthRes.data?.status === "success") {
            const gData = growthRes.data.data;
            setGrowthData(gData);
            if (gData.current_stage) {
              localStorage.setItem("uvion_current_stage", gData.current_stage);
            }
          }
        } catch (apiErr: any) {
          console.error(
            "Backend API Error fetching Growth Prediction:",
            apiErr,
          );
        }

        // 4. Fetch Farming Insights (Fertilizer & Yield)
        try {
          const insightsRes = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/api/v1/decision`,
            {
              farm: {
                crop: farmDetails.cropType,
                area_region: farmDetails.location,
                pesticides_tonnes: 0.5,
              },
              weather: {
                temperature: currentTemp,
                rainfall_mm: currentRain * 10,
                humidity: currentHumidity,
              },
              soil: {
                nitrogen: Math.floor(Math.random() * (60 - 20) + 20),
                phosphorus: Math.floor(Math.random() * (40 - 15) + 15),
                potassium: Math.floor(Math.random() * (50 - 25) + 25),
                ph: 6.2 + Math.random(),
                moisture: Math.floor(Math.random() * (70 - 30) + 30),
                soil_type: farmDetails.soilType,
              },
            },
          );

          if (insightsRes.data?.status === "success") {
            setFarmingInsights(insightsRes.data.data);
          }
        } catch (insErr) {
          console.error("Farming Insights API Error:", insErr);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, navigate, activeFarmId]);

  const handleDeleteCrop = async (e: React.MouseEvent, farmIdToDelete: string) => {
    e.stopPropagation(); // Prevent triggering the card click (which switches active farm)
    
    if (!window.confirm("Are you sure you want to permanently delete this crop profile? This action cannot be undone.")) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, "farms", farmIdToDelete));
      
      const updatedFarms = userFarms.filter(f => f.id !== farmIdToDelete);
      setUserFarms(updatedFarms);
      
      if (updatedFarms.length === 0) {
        navigate("/setup");
      } else if (activeFarmId === farmIdToDelete) {
        // If they deleted the currently active farm, switch to the first available one
        setActiveFarmId(updatedFarms[0].id || null);
      }
    } catch (err) {
      console.error("Failed to delete crop:", err);
      alert("Failed to delete the crop. Please try again.");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleScanImage = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanResult({
        disease: "Early Blight",
        severity: "Moderate",
        confidence: "92%",
        treatment: "Apply Copper Fungicide immediately.",
      });
    }, 2000);
  };

  const getStageIcon = (stage: string) => {
    if (!stage) return "🌱";
    const lower = stage.toLowerCase();
    if (
      lower.includes("germinat") ||
      lower.includes("sprout") ||
      lower.includes("break")
    )
      return "🌱";
    if (
      lower.includes("veg") ||
      lower.includes("seedling") ||
      lower.includes("tiller") ||
      lower.includes("shoot")
    )
      return "🌿";
    if (
      lower.includes("flower") ||
      lower.includes("panicle") ||
      lower.includes("silk") ||
      lower.includes("tassel")
    )
      return "🌸";
    if (
      lower.includes("fruit") ||
      lower.includes("fill") ||
      lower.includes("tuber") ||
      lower.includes("berry")
    )
      return "🍅";
    return "🌾";
  };

  const getStageColorClass = (stage: string) => {
    if (!stage) return "color-default";
    const lower = stage.toLowerCase();
    if (
      lower.includes("germinat") ||
      lower.includes("sprout") ||
      lower.includes("break")
    )
      return "color-early";
    if (
      lower.includes("veg") ||
      lower.includes("seedling") ||
      lower.includes("tiller") ||
      lower.includes("shoot")
    )
      return "color-veg";
    if (
      lower.includes("flower") ||
      lower.includes("panicle") ||
      lower.includes("silk") ||
      lower.includes("tassel")
    )
      return "color-flower";
    if (
      lower.includes("fruit") ||
      lower.includes("fill") ||
      lower.includes("tuber") ||
      lower.includes("berry")
    )
      return "color-fruit";
    if (
      lower.includes("matur") ||
      lower.includes("ripen") ||
      lower.includes("harvest")
    )
      return "color-mature";
    return "color-default";
  };

  const renderGrowthStatus = (status: string) => {
    switch (status) {
      case "Optimal":
      case "Normal":
        return (
          <div className="status-badge optimal">
            <CheckCircle size={14} /> ✅ Normal
          </div>
        );
      case "Delayed":
        return (
          <div className="status-badge delayed">
            <AlertTriangle size={14} /> ⚠️ Delayed
          </div>
        );
      case "Severely Delayed":
      case "Heat Stress":
        return (
          <div className="status-badge critical">
            <AlertCircle size={14} /> 🔥 Heat Stress / Critical
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <Loader2 className="spinner" size={40} />
        <h2>Initializing UVION Precision Logic...</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Leaf size={24} />
          </div>
          UVION
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentView === "dashboard" ? "active" : ""}`}
            onClick={() => setCurrentView("dashboard")}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button
            className={`nav-item ${currentView === "health-scan" ? "active" : ""}`}
            onClick={() => navigate("/health-hub")}
          >
            <HeartPulse size={20} /> Health Hub
          </button>
          <button
            className={`nav-item ${currentView === "fertilizer" ? "active" : ""}`}
            onClick={() => setCurrentView("fertilizer")}
          >
            <ClipboardList size={20} /> Recommendations
          </button>
          <button
            className={`nav-item ${currentView === "yield" ? "active" : ""}`}
            onClick={() => setCurrentView("yield")}
          >
            <TrendingUp size={20} /> Yield Forecast
          </button>
          <button
            className={`nav-item ${currentView === "profile" ? "active" : ""}`}
            onClick={() => setCurrentView("profile")}
          >
            <UserIcon size={20} /> Profile
          </button>
        </nav>

        <div style={{ marginTop: "auto" }}>


          <div className="sidebar-nav">
            <button className="nav-item" onClick={() => navigate("/setup")}>
              <Leaf size={20} /> Add New Crop
            </button>
            <button className="nav-item" onClick={handleLogout} style={{ marginTop: '1rem', color: '#64748b' }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="page-title">
            <div className="title-row">
              {userFarms.length > 0 && (
                <select 
                  className="top-crop-tag" 
                  value={activeFarmId || ""} 
                  onChange={(e) => setActiveFarmId(e.target.value)}
                  style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981', fontWeight: 700, padding: '0.4rem 1rem', borderRadius: '20px', cursor: 'pointer', outline: 'none' }}
                >
                  {userFarms.map((farm) => (
                    <option key={farm.id} value={farm.id} style={{ background: '#0f172a' }}>
                      {farm.cropType} - {farm.location.split(',')[0]}
                    </option>
                  ))}
                </select>
              )}
              <h1>
                {currentView === "fertilizer"
                  ? "FERTILIZER HUB"
                  : currentView === "yield"
                    ? "YIELD FORECASTER"
                    : currentView === "profile"
                      ? "FARMER PROFILE"
                      : "FIELD OVERVIEW"}
              </h1>
            </div>
            <p>
              {currentView === "fertilizer"
                ? "Personalized nutrient strategy"
                : currentView === "yield"
                  ? "Harvest potential & gap analysis"
                  : `Monitoring Zone: ${farmData?.location} Sector`}
            </p>
          </div>
          <div className="top-actions">
            <div className="health-pill">
              <div className="health-dot"></div>
              System Health: OPTIMIZING
            </div>
            <div className="user-profile-group">
              <div className="user-avatar" title={farmData?.farmerName}>
                {farmData?.farmerName ? (
                  farmData.farmerName.charAt(0).toUpperCase()
                ) : (
                  <UserIcon />
                )}
              </div>
              <span className="user-name-small">
                {farmData?.farmerName || "Farmer"}
              </span>
            </div>
          </div>
        </header>

        {currentView === "dashboard" && (
          <>
            {/* Grid Layout Top Area: Crop Telemetry expands full width */}
            <div className="dashboard-grid-single">
              <div
                className={`card growth-card ${growthData?.growth_status?.toLowerCase().replace(" ", "-") || "normal"}`}
              >
                <div className="card-title">CROP TELEMETRY</div>
                <div className="growth-header">
                  <div className="stage-title">
                    <h2
                      className={getStageColorClass(growthData?.current_stage)}
                    >
                      <span className="stage-icon">
                        {getStageIcon(growthData?.current_stage)}
                      </span>
                      {growthData?.current_stage || "Unknown Stage"}
                    </h2>
                    <p className="stage-desc">
                      {growthData?.stage_description}
                    </p>
                  </div>
                  <div className="growth-percentage">
                    <div className="val">
                      {Math.round(growthData?.overall_progress_percentage || 0)}
                      %
                    </div>
                    <div className="sub">Lifecycle Progress</div>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="progress-container">
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${growthData?.overall_progress_percentage || 0}%`,
                      }}
                    ></div>
                  </div>
                  {/* Status Below Bar */}
                  <div
                    className="growth-status-container"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    {renderGrowthStatus(growthData?.growth_status)}
                    {growthData?.preventive_score && (
                      <div className="preventive-badge">
                        🛡️ Prevention Status: {growthData.preventive_score}
                      </div>
                    )}
                  </div>
                </div>

                <div className="telemetry-bottom-grid">
                  {/* Stage-Based Risk (AI Upgrade) */}
                  <div
                    className="telemetry-block risk-block"
                    style={{ gridColumn: "span 3" }}
                  >
                    <h3
                      style={{
                        marginBottom: "1.5rem",
                        color: "var(--green-dark)",
                        fontSize: "1.1rem",
                      }}
                    >
                      ⚠️ Stage-Based Risks (AI Analysis)
                    </h3>

                    {growthData?.overall_progress_percentage === 0 ? (
                      <div className="early-stage-risk ai-risk-card">
                        <h4>🌱 Early Stage (0%)</h4>
                        <div className="severity-meter low">
                          <span>LOW</span> ▓░░░░
                        </div>
                        <p
                          className="no-risk-text"
                          style={{ marginTop: "0.5rem" }}
                        >
                          No disease risk at this stage. Standard environmental
                          monitoring.
                        </p>
                        <div
                          className="focus-points"
                          style={{ marginTop: "1rem" }}
                        >
                          <strong>Focus on:</strong>
                          <ul>
                            <li>✔ Proper irrigation</li>
                            <li>✔ Soil preparation</li>
                            <li>✔ Seed quality</li>
                          </ul>
                        </div>
                        <div className="next-check-badge">
                          Next risk check after germination
                        </div>
                      </div>
                    ) : (
                      <div className="multi-risk-stack">
                        {growthData?.diseases_at_stage?.length > 0 ? (
                          growthData.diseases_at_stage.map(
                            (disease: any, idx: number) => (
                              <div
                                key={idx}
                                className={`ai-risk-card ${disease.severity.toLowerCase()}`}
                              >
                                <div className="risk-card-header">
                                  <div className="r-title-group">
                                    <div className="d-name">{disease.name}</div>
                                    <div className="d-reason">
                                      {disease.reason}
                                    </div>
                                  </div>
                                  <div className="r-severity-group">
                                    <div className="trend-badge">
                                      {disease.trend}
                                    </div>
                                    <div className="severity-meter">
                                      {disease.severity === "High" ? (
                                        <>
                                          <span style={{ color: "#dc2626" }}>
                                            🔴 HIGH
                                          </span>{" "}
                                          <span className="bars">▓▓▓▓░</span>
                                        </>
                                      ) : disease.severity === "Medium" ? (
                                        <>
                                          <span style={{ color: "#ea580c" }}>
                                            🟡 MEDIUM
                                          </span>{" "}
                                          <span className="bars">▓▓▓░░</span>
                                        </>
                                      ) : (
                                        <>
                                          <span style={{ color: "#16a34a" }}>
                                            🟢 LOW
                                          </span>{" "}
                                          <span className="bars">▓░░░░</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="risk-metrics-grid">
                                  <div className="metric">
                                    <span className="m-label">Risk Score</span>
                                    <span className="m-val highlight">
                                      {disease.risk_score}
                                    </span>
                                  </div>
                                  <div className="metric">
                                    <span className="m-label">
                                      Impact Level
                                    </span>
                                    <span className="m-val">
                                      {disease.impact_level}
                                    </span>
                                  </div>
                                  <div className="metric">
                                    <span className="m-label">
                                      Expected Window
                                    </span>
                                    <span className="m-val">
                                      {disease.risk_window}
                                    </span>
                                  </div>
                                  <div className="metric">
                                    <span className="m-label">
                                      Reliability Score
                                    </span>
                                    <span className="m-val glow">
                                      {disease.reliability_score}
                                    </span>
                                  </div>
                                </div>

                                <div className="risk-card-footer">
                                  <button className="btn-prevent">
                                    {disease.severity === "High"
                                      ? "Take Action Now"
                                      : "View Treatment"}
                                  </button>
                                </div>
                              </div>
                            ),
                          )
                        ) : (
                          <div className="no-risk-text">
                            No major disease risks predicted for this stage.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div
                    className="telemetry-block action-block"
                    style={{ gridColumn: "span 2" }}
                  >
                    <div className="rec-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0 }}>💡 {farmData?.cropType} Strategy</h3>
                      <span style={{ fontSize: '0.65rem', opacity: 0.5, textTransform: 'uppercase' }}>Real-time Sync Active</span>
                    </div>
                    <div className="actions-list">
                      {growthData?.recommendations && growthData.recommendations.length > 0 ? (
                        growthData.recommendations.slice(0, 5).map((rec: string, idx: number) => (
                          <div key={idx} className="action-item" style={{ 
                            background: 'rgba(16, 185, 129, 0.05)', 
                            padding: '0.8rem', 
                            borderRadius: '12px', 
                            marginBottom: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            border: '1px solid rgba(16, 185, 129, 0.1)'
                          }}>
                            <div style={{ background: '#10b981', width: '6px', height: '6px', borderRadius: '50%' }}></div>
                            <span style={{ fontSize: '0.9rem', color: '#064e3b', fontWeight: 500 }}>{rec}</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ opacity: 0.5, padding: '1rem', textAlign: 'center' }}>
                          Fetching latest {farmData?.cropType} intelligence...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Next Stage Timeline */}
                  <div
                    className="telemetry-block timeline-block"
                    style={{ gridColumn: "span 1" }}
                  >
                    <h3>⏭️ Timeline</h3>
                    <div className="next-stage-anim">
                      <div className="timeline-dot current"></div>
                      <div className="timeline-line">
                        <div className="timeline-line-fill"></div>
                      </div>
                      <div className="timeline-dot next"></div>

                      <div className="timeline-text">
                        <div className="t-current">
                          <span>Current</span>
                          <strong
                            className={getStageColorClass(
                              growthData?.current_stage,
                            )}
                          >
                            {growthData?.current_stage}
                          </strong>
                        </div>
                        <div className="t-next">
                          <span>Next Stage</span>
                          <strong
                            className={getStageColorClass(
                              growthData?.next_stage,
                            )}
                          >
                            {growthData?.next_stage || "Completed"}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Row 2: Weather and General Alerts */}
            <div className="row-2">
              {/* Weather Graphs */}
              <div className="card">
                <div className="card-title">ATMOSPHERIC SENSORS</div>
                <div
                  className="weather-header"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <h2 style={{ margin: 0 }}>Predictive Model</h2>
                    <div
                      className="chart-tabs"
                      style={{
                        display: "flex",
                        background: "#f1f5f9",
                        borderRadius: "8px",
                        padding: "2px",
                      }}
                    >
                      <button
                        onClick={() => setChartView("24h")}
                        style={{
                          border: "none",
                          background:
                            chartView === "24h" ? "white" : "transparent",
                          color: chartView === "24h" ? "#10b981" : "#64748b",
                          padding: "4px 12px",
                          borderRadius: "6px",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          boxShadow:
                            chartView === "24h"
                              ? "0 1px 3px rgba(0,0,0,0.1)"
                              : "none",
                          transition: "all 0.2s",
                        }}
                      >
                        24 Hours
                      </button>
                      <button
                        onClick={() => setChartView("weekly")}
                        style={{
                          border: "none",
                          background:
                            chartView === "weekly" ? "white" : "transparent",
                          color: chartView === "weekly" ? "#10b981" : "#64748b",
                          padding: "4px 12px",
                          borderRadius: "6px",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          boxShadow:
                            chartView === "weekly"
                              ? "0 1px 3px rgba(0,0,0,0.1)"
                              : "none",
                          transition: "all 0.2s",
                        }}
                      >
                        Weekly
                      </button>
                    </div>
                  </div>
                  {weatherIntelligence?.stability_score && (
                    <div
                      className="suitability-badge"
                      style={{
                        background: "#e0f2fe",
                        color: "#0369a1",
                        padding: "0.4rem 0.8rem",
                        borderRadius: "20px",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        border: "1px solid #bae6fd",
                      }}
                    >
                      Stability: {weatherIntelligence.stability_score.score}%
                    </div>
                  )}
                </div>

                {weatherIntelligence?.stability_score?.interpretation && (
                  <div
                    className="rain-window"
                    style={{
                      display: "inline-block",
                      marginTop: "0.5rem",
                      padding: "0.3rem 0.8rem",
                      background: "#f0fdfa",
                      color: "#0f766e",
                      borderRadius: "4px",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      border: "1px solid #ccfbf1",
                    }}
                  >
                    💡 {weatherIntelligence.stability_score.interpretation}
                  </div>
                )}

                <div
                  className="chart-container"
                  style={{ minHeight: "320px", marginTop: "1rem", position: "relative" }}
                >
                  <ResponsiveContainer width="100%" height={320}>
                    <ComposedChart
                      data={
                        chartView === "24h"
                          ? weatherForecast
                          : weatherForecastWeekly
                      }
                      margin={{ top: 5, right: 0, bottom: 5, left: -20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e5e7eb"
                      />
                      <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        style={{ fontSize: "0.8rem" }}
                      />
                      <YAxis
                        yAxisId="left"
                        axisLine={false}
                        tickLine={false}
                        style={{ fontSize: "0.8rem" }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        style={{ fontSize: "0.8rem" }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "0.8rem" }} />
                      <Bar
                        yAxisId="left"
                        dataKey="rain"
                        name="Rain (mm)"
                        fill="#bfdbfe"
                        barSize={20}
                        radius={[4, 4, 0, 0]}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="temp"
                        name="Temp (°C)"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#ef4444" }}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="humidity"
                        name="Humidity (%)"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#10b981" }}
                        connectNulls
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>


                {/* Smart Plan Moved Below Graph */}
                {weatherIntelligence?.smart_plan && (
                  <div
                    className="i-card smart-plan-card"
                    style={{ marginTop: "1.5rem" }}
                  >
                    <h3
                      style={{
                        marginBottom: "1rem",
                        color: "#064e3b",
                        fontSize: "1.2rem",
                        display: "block",
                      }}
                    >
                      Smart Plan
                    </h3>
                    <ul className="action-checklist">
                      {weatherIntelligence.smart_plan.actions.map(
                        (item: any, idx: number) => {
                          const isString = typeof item === "string";
                          const priority = isString
                            ? "STABLE"
                            : item.priority || "STABLE";
                          const actionText = isString ? item : item.action;

                          return (
                            <li
                              key={`act-${idx}`}
                              className={`priority-${priority.toLowerCase()}`}
                            >
                              <span className="priority-badge">{priority}</span>
                              <span className="action-text">{actionText}</span>
                            </li>
                          );
                        },
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Smart Intelligence Hub */}
              {weatherIntelligence ? (
                <div className="intelligence-hub">
                  {/* Impact Summary Header */}
                  <div className="impact-summary-box">
                    <div className="i-icon">
                      <AlertCircle size={20} />
                    </div>
                    <div className="i-text">
                      <strong>Impact Summary:</strong>{" "}
                      {weatherIntelligence.impact_summary}
                    </div>
                  </div>

                  {weatherIntelligence.risk_build_up && (
                    <div className="i-card risk-build-card">
                      <h3>Risk Build-Up</h3>
                      <div className="risk-content">
                        <div className="r-row">
                          <span className="r-label">
                            {weatherIntelligence.risk_build_up.risk_type}:
                          </span>
                          <span className="r-val">
                            {weatherIntelligence.risk_build_up.status}
                          </span>
                        </div>
                        <div className="r-reason">
                          {weatherIntelligence.risk_build_up.reason}
                        </div>
                      </div>
                    </div>
                  )}

                  {weatherIntelligence.action_timing && (
                    <div className="i-card timing-card">
                      <h3>Action Timing</h3>
                      <div className="timing-row">
                        <div className="t-icon">
                          <Leaf size={16} />
                        </div>
                        <div className="t-data">
                          <strong>Fertilizer:</strong>{" "}
                          {weatherIntelligence.action_timing.fertilizer}
                        </div>
                      </div>
                      <div className="timing-row">
                        <div className="t-icon">
                          <Droplets size={16} />
                        </div>
                        <div className="t-data">
                          <strong>Irrigation:</strong>{" "}
                          {weatherIntelligence.action_timing.irrigation}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="intelligence-hub-loading"
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  <Loader2
                    className="spinner"
                    size={32}
                    style={{
                      margin: "0 auto 1rem",
                      display: "block",
                      color: "#10b981",
                    }}
                  />
                  Running AI Models on Micro-Climate Data...
                </div>
              )}
            </div>
          </>
        )}

        {currentView === "fertilizer" && (
          <div className="module-view-container" style={{ color: "#ffffff" }}>
            {!farmingInsights ? (
              <div style={{ textAlign: "center", padding: "5rem", color: "#4ade80" }}>
                <Loader2 size={40} className="spinner" style={{ margin: "0 auto 1rem", color: "#4ade80" }} />
                <p style={{ fontSize: "1.2rem", fontWeight: 600 }}>Syncing Field Intelligence...</p>
              </div>
            ) : (
              <div className="card strategic-plan" style={{ 
                background: "rgba(15, 23, 42, 0.96)", 
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                boxShadow: "0 15px 50px rgba(0, 0, 0, 0.45)",
                maxWidth: "800px", 
                margin: "0 auto",
                padding: "2rem",
                borderRadius: "24px"
              }}>
                <div className="plan-header" style={{ marginBottom: "2rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "1.5rem" }}>
                  <h2 style={{ fontSize: "2rem", fontWeight: 900, color: "#4ade80", margin: 0, textTransform: "uppercase" }}>
                    Decision Support Hub: {farmData?.cropType ? farmData.cropType.charAt(0).toUpperCase() + farmData.cropType.slice(1) : ""}
                  </h2>
                  <p style={{ color: "#cbd5e1", marginTop: "0.5rem", fontSize: "1rem" }}>Dynamic growth strategy based on multi-sensor field intelligence.</p>
                </div>

                <div className="plan-content">
                  {/* Ranked Fertilizer Strategy */}
                  <section style={{ marginBottom: "2.5rem" }}>
                    <h3 style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "#60a5fa", marginBottom: "1.2rem", fontSize: "1.25rem", fontWeight: 800 }}>
                      <FlaskConical size={20} style={{ color: "#60a5fa" }} /> Ranked Nutrient Recommendations
                    </h3>

                    <div className="fertilizer-list" style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                      {farmingInsights?.ranked_fertilizers?.map((fert: any, idx: number) => (
                        <div key={idx} style={{ 
                          background: "rgba(10, 15, 30, 0.95)", padding: "1.2rem 1.5rem", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.12)", 
                          position: "relative", overflow: "hidden", boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.8rem" }}>
                            <div>
                              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff" }}>{fert.type}</div>
                              <div style={{ fontSize: "0.95rem", color: "#cbd5e1", marginTop: "0.3rem", lineHeight: "1.4" }}>{fert.reason}</div>
                            </div>
                            <div style={{ 
                              padding: "0.35rem 0.85rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase",
                              background: fert.confidence_label === "Highly Recommended" ? "rgba(74, 222, 128, 0.18)" : fert.confidence_label === "Recommended" ? "rgba(255, 159, 67, 0.18)" : "rgba(255,255,255,0.08)",
                              color: fert.confidence_label === "Highly Recommended" ? "#4ade80" : fert.confidence_label === "Recommended" ? "#ff9f43" : "#cbd5e1",
                              border: fert.confidence_label === "Highly Recommended" ? "1px solid rgba(74, 222, 128, 0.3)" : fert.confidence_label === "Recommended" ? "1px solid rgba(255, 159, 67, 0.3)" : "1px solid rgba(255,255,255,0.12)"
                            }}>
                              {fert.confidence_label}
                            </div>
                          </div>
                          <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.08)", borderRadius: "10px", marginTop: "1.2rem", overflow: "hidden" }}>
                            <div style={{ 
                              width: `${fert.confidence_score}%`, height: "100%", 
                              background: fert.confidence_label === "Highly Recommended" ? "#4ade80" : fert.confidence_label === "Recommended" ? "#ff9f43" : "#cbd5e1",
                              borderRadius: "10px", transition: "width 1s ease-out" 
                            }}></div>
                          </div>
                        </div>
                      ))}
                      {(!farmingInsights?.ranked_fertilizers || farmingInsights.ranked_fertilizers.length === 0) && (
                        <div style={{ padding: "2rem", textAlign: "center", color: "#cbd5e1", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: "16px" }}>
                          No nutrient deficits detected based on current sensor data.
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Unified AI Actions */}
                  <section style={{ marginBottom: "2.5rem" }}>
                    <h3 style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "#ff9f43", marginBottom: "1.2rem", fontSize: "1.25rem", fontWeight: 800 }}>
                      <Activity size={20} style={{ color: "#ff9f43" }} /> Field Monitoring & Immediate Actions
                    </h3>
                    <div className="ai-actions-unified">
                      {farmingInsights?.actionable_intelligence?.map((action: string, idx: number) => (
                        <div key={idx} style={{ 
                          display: "flex", alignItems: "center", gap: "1rem", padding: "1.2rem", background: "rgba(16, 185, 129, 0.1)", 
                          borderRadius: "12px", marginBottom: "0.8rem", border: "1px solid rgba(16, 185, 129, 0.3)" 
                        }}>
                          <CheckCircle size={20} color="#4ade80" />
                          <span style={{ fontSize: "1rem", color: "#ffffff", fontWeight: 600 }}>{action}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="plan-precaution" style={{ display: "flex", gap: "1rem", padding: "1.2rem", background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "16px", marginTop: "2rem" }}>
                    <AlertTriangle color="#f87171" style={{ flexShrink: 0 }} />
                    <div style={{ color: "#fca5a5", fontSize: "0.95rem", lineHeight: "1.4" }}>
                      <strong style={{ color: "#ffffff" }}>Safety Note:</strong> Always follow local environmental guidelines for chemical application. {farmingInsights?.yield_gap}
                    </div>
                  </div>

                  <button className="btn-new-analysis" style={{ width: "100%", marginTop: "2.5rem", padding: '1rem', fontSize: '1.05rem', fontWeight: 700, borderRadius: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }} onClick={() => setCurrentView("dashboard")}>
                    Return to Field Overview
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === "yield" && (() => {
          // Fallback static defaults based on crop type
          const mock = getYieldMockData(farmData?.cropType || "Rice");

          // Extract real parameters from farmingInsights (decision engine results)
          const hasRealData = !!farmingInsights;
          
          // Yield Values (convert hg/ha to t/ha, or use formatted string)
          const expectedYield = hasRealData && farmingInsights.predicted_yield_hg_ha 
            ? parseFloat((farmingInsights.predicted_yield_hg_ha / 10000).toFixed(1))
            : mock.expectedYield;

          const potentialYield = hasRealData && farmingInsights.potential_yield_hg_ha
            ? parseFloat((farmingInsights.potential_yield_hg_ha / 10000).toFixed(1))
            : mock.potentialYield;

          const yieldImprovementPercent = expectedYield > 0 
            ? Math.round(((potentialYield - expectedYield) / expectedYield) * 100)
            : mock.yieldImprovementPercent;

          const confidence = hasRealData && farmingInsights.confidence
            ? parseInt(farmingInsights.confidence)
            : mock.confidence;

          // Harvest Date calculation based on actual plantingDate and growth stages
          const getHarvestInfo = () => {
            const crop = (farmData?.cropType || "Rice").toLowerCase();
            const plantingDateStr = farmData?.plantingDate; // "YYYY-MM-DD"
            
            let totalDays = 120;
            if (crop.includes("tomato")) totalDays = 130;
            else if (crop.includes("grapes")) totalDays = 365;
            
            if (!plantingDateStr) {
              return {
                harvestDate: mock.harvestDate,
                remainingDays: mock.remainingDays,
                currentStage: growthData?.current_stage || mock.currentStage
              };
            }
            
            const plantingDate = new Date(plantingDateStr);
            const harvestDate = new Date(plantingDate.getTime() + totalDays * 24 * 60 * 60 * 1000);
            const today = new Date();
            const diffTime = harvestDate.getTime() - today.getTime();
            const remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            
            const formattedHarvestDate = harvestDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });
            
            return {
              harvestDate: formattedHarvestDate,
              remainingDays: remainingDays,
              currentStage: growthData?.current_stage || mock.currentStage
            };
          };

          const harvestInfo = getHarvestInfo();

          // Area-based yield calculation subtilizaton
          const farmSizeAcres = parseFloat(farmData?.farmSize) || 1.0;
          const farmSizeHectares = farmSizeAcres * 0.404686;
          const totalExpectedHarvest = parseFloat((expectedYield * farmSizeHectares).toFixed(1));
          const totalPotentialHarvest = parseFloat((potentialYield * farmSizeHectares).toFixed(1));

          // Confidence Reasons (based on real NPK status or growth status)
          const confidenceReasons = hasRealData 
            ? [
                `Growth status predicted as: ${growthData?.growth_status || "Optimal"}`,
                `Soil NPK telemetry analyzed in decision engine`,
                `Environmental telemetry parsed successfully`
              ]
            : mock.confidenceReason;

          // Main Yield Reducers (Limiting Factors)
          const limitations = hasRealData && farmingInsights.main_limitations
            ? farmingInsights.main_limitations
            : [];

          const reducers = limitations.length > 0
            ? limitations.map((lim: string) => {
                let loss = 0.2; // Default fallback penalty fraction
                const lower = lim.toLowerCase();
                if (lower.includes("nitrogen") || lower.includes("low nitrogen")) loss = 0.05;
                else if (lower.includes("phosphorus") || lower.includes("low phosphorus")) loss = 0.03;
                else if (lower.includes("potassium") || lower.includes("low potassium")) loss = 0.04;
                else if (lower.includes("disease detected")) loss = 0.25;

                const lossVal = parseFloat((loss * expectedYield).toFixed(2));
                return {
                  factor: lim,
                  loss: lossVal > 0 ? lossVal : 0.1
                };
              })
            : mock.reducers;

          // 1. Get current stage from harvest info
          const currentStageName = harvestInfo.currentStage || "Germination";

          // 2. Define stage-aware advice generator with yield-scaled gains
          const getStageSpecificAdvice = (stageName: string, expectedYld: number) => {
            const stage = stageName.toLowerCase();
            
            if (stage.includes("germination") || stage.includes("early") || stage.includes("seedling")) {
              return {
                scenarios: [
                  {
                    action: "Stabilize soil moisture (delicate watering run)",
                    gain: parseFloat((expectedYld * 0.05).toFixed(1)),
                    desc: "Tiny roots require consistent, light soil humidity to prevent dehydration."
                  },
                  {
                    action: "Apply starter organic mulch & compost (low nitrogen)",
                    gain: parseFloat((expectedYld * 0.03).toFixed(1)),
                    desc: "Avoid high-dose synthetic fertilizers which burn vulnerable seedling roots."
                  },
                  {
                    action: "Regulate micro-climate soil temperature shielding",
                    gain: parseFloat((expectedYld * 0.02).toFixed(1)),
                    desc: "Protects delicate sprouts from extreme daytime heat or night chills."
                  }
                ],
                timeline: [
                  { period: "Today", action: "Verify starter organic compost and monitor soil temperature stability." },
                  { period: "Next 3 days", action: "Run a gentle micro-irrigation schedule to maintain stable, damp soil layers." },
                  { period: "Next week", action: "Inspect seedling sprouts for damping-off disease symptoms." }
                ]
              };
            } else if (stage.includes("vegetative") || stage.includes("growth") || stage.includes("veg")) {
              return {
                scenarios: [
                  {
                    action: "Apply nitrogen-rich urea topdressing to boost stem growth",
                    gain: parseFloat((expectedYld * 0.12).toFixed(1)),
                    desc: "Fuels vigorous stem expansion and healthy dark-green leaf canopy development."
                  },
                  {
                    action: "Deep root irrigation scheduled based on daily solar data",
                    gain: parseFloat((expectedYld * 0.07).toFixed(1)),
                    desc: "Drives root systems deeper into the soil for nutrient acquisition."
                  },
                  {
                    action: "Foliar weed clearing & preventive bio-fungicide spraying",
                    gain: parseFloat((expectedYld * 0.04).toFixed(1)),
                    desc: "Creates a protective surface barrier against early leaf-spot spores."
                  }
                ],
                timeline: [
                  { period: "Today", action: "Apply urea or balanced compost topdressing to fuel leafy vegetative canopy." },
                  { period: "Next 3 days", action: "Eliminate weeds mechanically around plant bases to conserve soil nutrients." },
                  { period: "Next week", action: "Calibrate soil NPK telemetry sensors to log vegetative absorption." }
                ]
              };
            } else if (stage.includes("flowering") || stage.includes("bloom") || stage.includes("flower")) {
              return {
                scenarios: [
                  {
                    action: "Apply targeted Phosphorus (DAP) & Potassium (MOP) boost",
                    gain: parseFloat((expectedYld * 0.15).toFixed(1)),
                    desc: "Crucial for blossom retention, robust pollen growth, and successful fruit setting."
                  },
                  {
                    action: "Switch overhead sprinkler systems to direct drip irrigation",
                    gain: parseFloat((expectedYld * 0.08).toFixed(1)),
                    desc: "Keeps flowers dry to prevent fungal blossom blight and pollen wash-away."
                  },
                  {
                    action: "Apply boron-calcium foliar micronutrient blend spray",
                    gain: parseFloat((expectedYld * 0.05).toFixed(1)),
                    desc: "Improves cell-wall strength and prevents blossom-end rot issues."
                  }
                ],
                timeline: [
                  { period: "Today", action: "Calibrate Potassium/Phosphorus levels to protect setting blossoms from dropping." },
                  { period: "Next 3 days", action: "Apply protective copper fungicide spray if morning relative humidity rises." },
                  { period: "Next week", action: "Transition overhead sprinkler supply entirely to ground drip lines." }
                ]
              };
            } else if (stage.includes("fruiting") || stage.includes("yielding") || stage.includes("fruit")) {
              return {
                scenarios: [
                  {
                    action: "Distribute organic potassium sulfate to enlarge fruit sizing",
                    gain: parseFloat((expectedYld * 0.18).toFixed(1)),
                    desc: "Directs plant sugars straight into the starch, grain, or fruit structures."
                  },
                  {
                    action: "Deploy localized powdery mildew & high-severity rot spray",
                    gain: parseFloat((expectedYld * 0.10).toFixed(1)),
                    desc: "Eliminates active fruit-rot or late-blight risks under humid canopy layers."
                  },
                  {
                    action: "Manage split-dose water volume to prevent husk splitting",
                    gain: parseFloat((expectedYld * 0.06).toFixed(1)),
                    desc: "Sudden excessive watering causes rapid swelling, leading to split skin/husks."
                  }
                ],
                timeline: [
                  { period: "Today", action: "Deliver potassium-heavy sulfate blend to enhance fruit sucrose and sizing." },
                  { period: "Next 3 days", action: "Scan fruit high-density zones under canopy branches for active fungal rot spots." },
                  { period: "Next week", action: "Maintain steady split water dosing intervals to eliminate sudden skin cracking." }
                ]
              };
            } else {
              // Maturity / Harvest-Ready / Default
              return {
                scenarios: [
                  {
                    action: "Cease chemical application to enter organic safety dry-out",
                    gain: parseFloat((expectedYld * 0.04).toFixed(1)),
                    desc: "Allows chemical breakdown before human consumption, preserving organic quality."
                  },
                  {
                    action: "Gradually withdraw water supply to avoid bulb/root rot",
                    gain: parseFloat((expectedYld * 0.03).toFixed(1)),
                    desc: "Triggers natural grain/fruit drying, improving shelf-life and preventing field rot."
                  },
                  {
                    action: "Initiate harvest reaping, threshing, and storage transport",
                    gain: parseFloat((expectedYld * 0.02).toFixed(1)),
                    desc: "Guarantees crop safety immediately post-reap under dry, low-humidity storage."
                  }
                ],
                timeline: [
                  { period: "Today", action: "Halt all chemical and fertilizer applications for consumer-safety dry-out period." },
                  { period: "Next 3 days", action: "Clean and dry storage silos and calibrate grain moisture gauges." },
                  { period: "Next week", action: "Begin mechanical crop harvesting and secure climate-controlled transport." }
                ]
              };
            }
          };

          const advice = getStageSpecificAdvice(currentStageName, expectedYield);
          const recoveryScenarios = advice.scenarios;
          const actionTimeline = advice.timeline;

          const maxRecoverable = parseFloat(recoveryScenarios.reduce((sum, s) => sum + s.gain, 0).toFixed(1));

          // Yield Trend Graph Data
          const graphData = [{ name: "Today", yieldVal: expectedYield }];
          if (recoveryScenarios.length === 1) {
            graphData.push({ name: "Step 1", yieldVal: parseFloat((expectedYield + recoveryScenarios[0].gain).toFixed(2)) });
            graphData.push({ name: "Optimized", yieldVal: potentialYield });
          } else if (recoveryScenarios.length === 2) {
            const step1 = parseFloat((expectedYield + recoveryScenarios[0].gain).toFixed(2));
            graphData.push({ name: "Step 1", yieldVal: step1 });
            graphData.push({ name: "Step 2", yieldVal: potentialYield });
          } else if (recoveryScenarios.length >= 3) {
            const step1 = parseFloat((expectedYield + recoveryScenarios[0].gain).toFixed(2));
            const step2 = parseFloat((step1 + recoveryScenarios[1].gain).toFixed(2));
            graphData.push({ name: "Step 1", yieldVal: step1 });
            graphData.push({ name: "Step 2", yieldVal: step2 });
            graphData.push({ name: "Step 3", yieldVal: potentialYield });
          } else {
            graphData.push({ name: "Optimized", yieldVal: potentialYield });
          }

          // "What if ignored?" Sector
          const ignoredYield = parseFloat((expectedYield * 0.8).toFixed(1));
          const ignoredCauses = limitations.length > 0
            ? limitations.map((lim: string) => `Unresolved ${lim}`)
            : mock.ignoredCauses;

          // Risk Meter
          const riskLevel = hasRealData && farmingInsights.yield_risk
            ? farmingInsights.yield_risk
            : mock.riskLevel;

          const riskCause = limitations.length > 0
            ? limitations[0]
            : mock.riskCause;

          // Previous season comparison
          const previousYield = parseFloat((expectedYield * 0.9).toFixed(1));
          const previousImprovementPercent = Math.max(1, Math.round(((expectedYield - previousYield) / previousYield) * 100));

          return (
            <div className="yield-forecast-dashboard" style={{ padding: '1rem', color: '#ffffff' }}>
              
              {/* 1. Yield Outlook Summary (MOST IMPORTANT) */}
              <div className="yield-card outlook-summary-card" style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(10, 15, 30, 0.98) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                borderRadius: '16px',
                padding: '2rem',
                marginBottom: '2rem',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(10,185,129,0.12) 0%, transparent 70%)', zIndex: 0 }} />
                
                <h3 style={{ color: '#4ade80', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.5rem', fontWeight: 800, zIndex: 1, position: 'relative' }}>
                  <Sparkles size={22} className="glow-icon" style={{ color: '#4ade80' }} /> Yield Outlook Summary {hasRealData ? " (Real AI Inference)" : ""}
                </h3>
                
                <p style={{ color: '#ffffff', fontSize: '1.1rem', lineHeight: '1.6', margin: '0 0 1.5rem 0', maxWidth: '800px', zIndex: 1, position: 'relative' }}>
                  Based on current <strong style={{ color: '#ff9f43', fontWeight: 800 }}>{farmData?.cropType || "Rice"}</strong> growth stage (<strong style={{ color: '#60a5fa', fontWeight: 800 }}>{harvestInfo.currentStage}</strong>), local weather trends, soil telemetry, and active pest risks, the predicted yield by harvest (<strong style={{ color: '#f472b6', fontWeight: 800 }}>{harvestInfo.harvestDate}</strong>) is:
                </p>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2.5rem', zIndex: 1, position: 'relative' }}>
                  <div style={{ background: 'rgba(10, 15, 30, 0.95)', padding: '1rem 2rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.12)', display: 'inline-block', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.3rem', fontWeight: 700 }}>Expected Yield Rate</div>
                    <div style={{ fontSize: '3rem', fontWeight: 900, color: '#4ade80', lineHeight: '1' }}>
                      {expectedYield} <small style={{ fontSize: '1.3rem', color: '#cbd5e1', fontWeight: 600 }}>t/ha</small>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(10, 15, 30, 0.95)', padding: '1rem 2rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.12)', display: 'inline-block', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.3rem', fontWeight: 700 }}>Total Expected Harvest</div>
                    <div style={{ fontSize: '3rem', fontWeight: 900, color: '#60a5fa', lineHeight: '1' }}>
                      {totalExpectedHarvest} <small style={{ fontSize: '1.3rem', color: '#cbd5e1', fontWeight: 600 }}>tonnes</small>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.35rem', fontWeight: 500 }}>
                      Adjusted for {farmSizeAcres} Acres ({farmSizeHectares.toFixed(2)} Hectares)
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff', fontSize: '1.05rem', fontWeight: 600 }}>
                      <span>🚀 Potential with recommendations:</span>
                      <strong style={{ color: '#ff9f43', background: 'rgba(249, 115, 22, 0.18)', border: '1px solid rgba(249, 115, 22, 0.3)', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
                        {potentialYield} t/ha / {totalPotentialHarvest} tonnes potential (+{yieldImprovementPercent}%)
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Grid Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
                
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  
                  {/* 3. Yield Trend Graph */}
                  <div className="yield-card" style={{ background: 'rgba(15, 23, 42, 0.96)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px', padding: '1.8rem', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
                    <h4 style={{ color: '#4ade80', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 800 }}>
                      <TrendingUp size={20} style={{ color: '#4ade80' }} /> Expected Yield Over Time
                    </h4>
                    <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                      Visualizing the projected yield path based on ongoing and upcoming field adjustments.
                    </p>
                    <div style={{ width: '100%', height: '250px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={graphData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                          <XAxis dataKey="name" stroke="#cbd5e1" style={{ fontSize: "0.85rem", fontWeight: 600 }} />
                          <YAxis stroke="#cbd5e1" domain={['auto', 'auto']} style={{ fontSize: "0.85rem", fontWeight: 600 }} />
                          <Tooltip contentStyle={{ background: '#0a0f1e', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff' }} />
                          <Line type="monotone" dataKey="yieldVal" stroke="#4ade80" strokeWidth={4} dot={{ r: 6, fill: '#4ade80', stroke: '#0a0f1e', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 5. Main Yield Reducers */}
                  <div className="yield-card" style={{ background: 'rgba(15, 23, 42, 0.96)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px', padding: '1.8rem', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
                    <h4 style={{ color: '#f87171', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 800 }}>
                      <AlertCircle size={20} style={{ color: '#f87171' }} /> Yield Limiting Factors
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                      {reducers.map((red, idx) => (
                        <div key={idx} style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: 700, color: '#fca5a5', fontSize: '0.95rem' }}>{red.factor}</span>
                            <strong style={{ color: '#f87171', fontSize: '1rem' }}>-{red.loss} t/ha</strong>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.max(5, Math.min(red.loss * 50, 100))}%`, height: '100%', background: '#ef4444', borderRadius: '4px' }} />
                          </div>
                        </div>
                      ))}
                      {reducers.length === 0 && (
                        <div style={{ color: '#cbd5e1', fontSize: '0.95rem', textAlign: 'center', padding: '1rem' }}>
                          No limitations detected. The crop is in optimal conditions!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 6. Recovery Simulation */}
                  <div className="yield-card" style={{ background: 'rgba(15, 23, 42, 0.96)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px', padding: '1.8rem', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
                    <h4 style={{ color: '#4ade80', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 800 }}>
                      <Activity size={20} style={{ color: '#4ade80' }} /> Recovery Scenarios
                    </h4>
                    <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1.2rem', lineHeight: '1.4' }}>
                      Estimated harvest gains based on specific corrective actions.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.2rem' }}>
                      {recoveryScenarios.map((scen, idx) => (
                        <div key={idx} style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem 1.2rem', borderRadius: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <span style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 700 }}>{scen.action}</span>
                            <strong style={{ color: '#4ade80', fontSize: '1.05rem', fontWeight: 800 }}>+{scen.gain} t/ha</strong>
                          </div>
                          {scen.desc && (
                            <p style={{ color: '#cbd5e1', fontSize: '0.82rem', margin: 0, lineHeight: '1.3' }}>
                              {scen.desc}
                            </p>
                          )}
                        </div>
                      ))}
                      {recoveryScenarios.length === 0 && (
                        <div style={{ color: '#cbd5e1', fontSize: '0.95rem', textAlign: 'center', padding: '1rem' }}>
                          Field parameters are already at full potential!
                        </div>
                      )}
                    </div>
                    <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                      <span style={{ color: '#cbd5e1', fontSize: '0.95rem', fontWeight: 600 }}>Maximum Recoverable Yield Gap: </span>
                      <strong style={{ color: '#4ade80', fontSize: '1.2rem', fontWeight: 800 }}>
                        {typeof maxRecoverable === 'number' ? `+${maxRecoverable} t/ha` : maxRecoverable}
                      </strong>
                    </div>
                  </div>

                  {/* 10. Recommended Action Timeline */}
                  <div className="yield-card" style={{ background: 'rgba(15, 23, 42, 0.96)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px', padding: '1.8rem', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
                    <h4 style={{ color: '#ff9f43', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 800 }}>
                      <Calendar size={20} style={{ color: '#ff9f43' }} /> Action Timeline
                    </h4>
                    <div style={{ position: 'relative', paddingLeft: '1.8rem', borderLeft: '2px solid rgba(249, 115, 22, 0.4)' }}>
                      {actionTimeline.map((time, idx) => (
                        <div key={idx} style={{ marginBottom: '1.8rem', position: 'relative' }}>
                          <div style={{ position: 'absolute', top: '4px', left: '-2.22rem', width: '14px', height: '14px', borderRadius: '50%', background: '#ff9f43', border: '3px solid #0f172a' }} />
                          <strong style={{ color: '#ff9f43', display: 'block', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.3rem', fontWeight: 800 }}>{time.period}</strong>
                          <span style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 500 }}>{time.action}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                  {/* 2. Estimated Harvest Date */}
                  <div className="yield-card" style={{ background: 'rgba(15, 23, 42, 0.96)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px', padding: '1.8rem', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
                    <h4 style={{ color: '#60a5fa', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 800 }}>
                      <Clock size={20} style={{ color: '#60a5fa' }} /> Estimated Harvest Date
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ background: 'rgba(10, 15, 30, 0.95)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <span style={{ fontSize: '0.8rem', color: '#cbd5e1', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem', fontWeight: 700 }}>Expected Harvest</span>
                        <strong style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 800 }}>{harvestInfo.harvestDate}</strong>
                      </div>
                      <div style={{ background: 'rgba(10, 15, 30, 0.95)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <span style={{ fontSize: '0.8rem', color: '#cbd5e1', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem', fontWeight: 700 }}>Time Remaining</span>
                        <strong style={{ color: '#60a5fa', fontSize: '1.35rem', fontWeight: 800 }}>{harvestInfo.remainingDays} days</strong>
                      </div>
                    </div>
                    <div style={{ marginTop: '1.2rem', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '0.9rem 1.2rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#cbd5e1', fontSize: '0.95rem', fontWeight: 500 }}>Current Growth Stage:</span>
                      <strong style={{ color: '#60a5fa', fontSize: '1rem', fontWeight: 800 }}>{harvestInfo.currentStage}</strong>
                    </div>
                  </div>

                  {/* Confidence Score Removed */}

                  {/* 7. "What if ignored?" Section */}
                  <div className="yield-card" style={{ background: 'rgba(15, 23, 42, 0.96)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '16px', padding: '1.8rem', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
                    <h4 style={{ color: '#f87171', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 800 }}>
                      ⚠️ If recommendations are ignored:
                    </h4>
                    <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '1rem', borderRadius: '12px', marginBottom: '1.2rem', textAlign: 'center' }}>
                      <span style={{ color: '#fca5a5', fontSize: '0.9rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem', fontWeight: 700 }}>Expected yield drops to</span>
                      <strong style={{ color: '#ef4444', fontSize: '2.2rem', fontWeight: 900 }}>{ignoredYield} t/ha</strong>
                    </div>
                    <div>
                      <strong style={{ color: '#fca5a5', fontSize: '0.85rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem', fontWeight: 700 }}>Primary Risk Drivers:</strong>
                      <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.95rem', color: '#ffffff', lineHeight: '1.6' }}>
                        {ignoredCauses.map((cause, idx) => (
                          <li key={idx} style={{ marginBottom: '0.3rem' }}>{cause}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* 8. Compare with Previous Cycle */}
                  <div className="yield-card" style={{ background: 'rgba(15, 23, 42, 0.96)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px', padding: '1.8rem', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
                    <h4 style={{ color: '#f472b6', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 800 }}>
                      <TrendingUp size={20} style={{ color: '#f472b6' }} /> Compare with Previous Cycle
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ background: 'rgba(10, 15, 30, 0.95)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <span style={{ fontSize: '0.8rem', color: '#cbd5e1', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem', fontWeight: 700 }}>Previous Season</span>
                        <strong style={{ color: '#ffffff', fontSize: '1.3rem', fontWeight: 800 }}>{previousYield} t/ha</strong>
                      </div>
                      <div style={{ background: 'rgba(10, 15, 30, 0.95)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <span style={{ fontSize: '0.8rem', color: '#cbd5e1', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem', fontWeight: 700 }}>Net Improvement</span>
                        <strong style={{ color: '#f472b6', fontSize: '1.35rem', fontWeight: 800 }}>+{previousImprovementPercent}%</strong>
                      </div>
                    </div>
                  </div>

                  {/* 9. Yield Risk Meter */}
                  <div className="yield-card" style={{ background: 'rgba(15, 23, 42, 0.96)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px', padding: '1.8rem', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
                    <h4 style={{ color: '#ffffff', margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>Yield Risk Meter</h4>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                      <div>
                        <span style={{ color: '#cbd5e1', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>Current Status</span>
                        <strong style={{ 
                          fontSize: '1.45rem', 
                          fontWeight: 900,
                          color: riskLevel === 'Low' ? '#4ade80' : riskLevel === 'Moderate' ? '#ff9f43' : riskLevel === 'High' ? '#ea580c' : '#ef4444' 
                        }}>
                          {riskLevel} Risk
                        </strong>
                      </div>
                      <span style={{ fontSize: '0.95rem', color: '#cbd5e1', fontWeight: 500 }}>Main Cause: <strong style={{ color: '#ff9f43' }}>{riskCause}</strong></span>
                    </div>

                    {/* Visual Risk Gauge */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ background: '#4ade80', opacity: riskLevel === 'Low' || riskLevel === 'Moderate' || riskLevel === 'High' || riskLevel === 'Critical' ? 1 : 0.15 }} />
                      <div style={{ background: '#ff9f43', opacity: riskLevel === 'Moderate' || riskLevel === 'High' || riskLevel === 'Critical' ? 1 : 0.15 }} />
                      <div style={{ background: '#ea580c', opacity: riskLevel === 'High' || riskLevel === 'Critical' ? 1 : 0.15 }} />
                      <div style={{ background: '#ef4444', opacity: riskLevel === 'Critical' ? 1 : 0.15 }} />
                    </div>
                  </div>

                </div>

              </div>

              <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
                <button 
                  className="btn-new-analysis" 
                  style={{ padding: '0.9rem 3rem', fontSize: '1.05rem', borderRadius: '30px', fontWeight: 700, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }} 
                  onClick={() => setCurrentView("dashboard")}
                >
                  Return to Overview
                </button>
              </div>

            </div>
          );
        })()}

        {currentView === "health-scan" && (
          <div className="health-scan-container" style={{ color: "#ffffff", maxWidth: "800px", margin: "0 auto", padding: "1rem" }}>
            <h2 style={{ color: "#4ade80", marginBottom: "0.5rem", fontSize: "2rem", fontWeight: 900, textTransform: "uppercase" }}>
              Plant Health Scanner
            </h2>
            <p style={{ color: "#cbd5e1", marginBottom: "2.5rem", fontSize: "1.05rem" }}>
              Upload a leaf image to run our PyTorch CNN detection model.
            </p>

            {!scanResult ? (
              <div 
                className="upload-area" 
                style={{ 
                  background: 'rgba(15, 23, 42, 0.96)', 
                  backdropFilter: 'blur(20px)', 
                  border: '2px dashed rgba(74, 222, 128, 0.4)', 
                  borderRadius: '24px', 
                  padding: '4rem 2rem', 
                  cursor: 'pointer', 
                  textAlign: 'center', 
                  transition: 'all 0.3s',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.3)'
                }}
                onClick={handleScanImage}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4ade80'; e.currentTarget.style.background = 'rgba(20, 30, 55, 0.98)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(74, 222, 128, 0.4)'; e.currentTarget.style.background = 'rgba(15, 23, 42, 0.96)'; }}
              >
                {isScanning ? (
                  <>
                    <Loader2
                      className="spinner"
                      size={54}
                      color="#4ade80"
                      style={{ marginBottom: "1.5rem", color: "#4ade80" }}
                    />
                    <h3 style={{ color: "#4ade80", fontSize: "1.4rem", fontWeight: 800 }}>
                      Analyzing Leaf...
                    </h3>
                  </>
                ) : (
                  <>
                    <Camera
                      size={54}
                      color="#4ade80"
                      style={{ marginBottom: "1.5rem", color: "#4ade80" }}
                    />
                    <h3
                      style={{
                        color: "#ffffff",
                        marginBottom: "0.5rem",
                        fontSize: "1.4rem",
                        fontWeight: 800
                      }}
                    >
                      Click to Upload Image
                    </h3>
                    <p style={{ color: "#cbd5e1", fontSize: "0.95rem" }}>
                      Supported formats: JPG, PNG
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div 
                className="scan-result-card"
                style={{
                  background: 'rgba(15, 23, 42, 0.96)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '24px',
                  padding: '2.5rem',
                  boxShadow: '0 15px 50px rgba(0,0,0,0.45)'
                }}
              >
                <h3 style={{ color: '#f87171', fontSize: '1.6rem', fontWeight: 900, marginBottom: '1.5rem', textTransform: 'uppercase' }}>
                  {scanResult.disease} Detected
                </h3>
                <div
                  style={{
                    background: "rgba(10, 15, 30, 0.95)",
                    padding: "1.5rem",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    marginTop: "1rem",
                  }}
                >
                  <p style={{ marginBottom: "0.8rem", fontSize: "1.05rem", color: "#ffffff" }}>
                    <strong>Severity Level:</strong> <span style={{ color: '#ff9f43', fontWeight: 800 }}>{scanResult.severity}</span>
                  </p>
                  <p style={{ marginBottom: "0.8rem", fontSize: "1.05rem", color: "#ffffff" }}>
                    <strong>AI Confidence:</strong> <span style={{ color: '#60a5fa', fontWeight: 800 }}>{scanResult.confidence}</span>
                  </p>
                  <p
                    style={{
                      color: "#f87171",
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      marginTop: "1.5rem",
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      padding: '1rem',
                      borderRadius: '12px'
                    }}
                  >
                    🚀 Recommended Action: {scanResult.treatment}
                  </p>
                </div>
                <button
                  onClick={() => setScanResult(null)}
                  style={{
                    background: "rgba(239, 68, 68, 0.2)",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    color: "#f87171",
                    padding: "1rem 2rem",
                    borderRadius: "30px",
                    fontWeight: 800,
                    fontSize: "1.05rem",
                    marginTop: "2rem",
                    cursor: "pointer",
                    width: "100%",
                    transition: "all 0.2s",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                >
                  Scan Another Plant
                </button>
              </div>
            )}
          </div>
        )}

        {currentView === "profile" && (
          <div className="profile-container" style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
            <div 
              className="profile-header" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1.8rem', 
                marginBottom: '3rem', 
                padding: '2.5rem 2rem', 
                background: 'rgba(15, 23, 42, 0.96)', 
                backdropFilter: 'blur(20px)',
                borderRadius: '24px', 
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)'
              }}
            >
              <div className="profile-avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'white', fontWeight: 900, boxShadow: '0 0 15px rgba(74, 222, 128, 0.3)' }}>
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon size={40} />}
              </div>
              <div className="profile-info">
                <h2 style={{ margin: 0, color: '#ffffff', fontSize: '2rem', fontWeight: 900 }}>{user?.displayName || "Farmer"}</h2>
                <p style={{ margin: '0.5rem 0 0 0', color: '#cbd5e1', fontSize: '1.05rem' }}>{user?.email}</p>
                <div style={{ marginTop: '0.8rem', display: 'inline-block', padding: '0.4rem 1rem', background: 'rgba(74, 222, 128, 0.18)', border: '1px solid rgba(74, 222, 128, 0.3)', color: '#4ade80', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 800 }}>
                  📂 Managing {userFarms.length} Farm{userFarms.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <h3 style={{ color: '#4ade80', marginBottom: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.4rem', fontWeight: 800 }}>
              <Leaf size={24} style={{ color: '#4ade80' }} /> My Crops Portfolio
            </h3>
            
            <div className="crops-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {userFarms.map(farm => (
                <div 
                  key={farm.id} 
                  className="crop-card" 
                  style={{ 
                    background: 'rgba(15, 23, 42, 0.96)', 
                    backdropFilter: 'blur(20px)',
                    borderRadius: '20px', 
                    padding: '1.8rem', 
                    border: activeFarmId === farm.id ? '2px solid #4ade80' : '1px solid rgba(255, 255, 255, 0.12)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
                  }}
                  onClick={() => { setActiveFarmId(farm.id || null); setCurrentView("dashboard"); }}
                >
                  {activeFarmId === farm.id && (
                    <div style={{ position: 'absolute', top: '1.2rem', right: '4.2rem', background: '#4ade80', color: '#0f172a', fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '12px', fontWeight: 800 }}>ACTIVE</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h4 style={{ color: '#ffffff', margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>{farm.cropType}</h4>
                    <button 
                      onClick={(e) => handleDeleteCrop(e, farm.id as string)}
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.15)', 
                        border: '1px solid rgba(239, 68, 68, 0.3)', 
                        color: '#f87171', 
                        padding: '0.5rem', 
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        zIndex: 10
                      }}
                      title="Delete Crop"
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p style={{ color: '#cbd5e1', margin: '0 0 1.2rem 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}>
                    <MapPin size={15} style={{ color: '#ff9f43' }} /> {farm.location}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(10, 15, 30, 0.95)', padding: '1rem 1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <div style={{ color: '#cbd5e1', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.2rem', fontWeight: 700 }}>Size</div>
                      <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.05rem' }}>{farm.farmSize} Acres</div>
                    </div>
                    <div>
                      <div style={{ color: '#cbd5e1', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.2rem', fontWeight: 700 }}>Planted</div>
                      <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.05rem' }}>{new Date(farm.plantingDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              ))}
              
              <div 
                className="crop-card add-new" 
                style={{ 
                  background: 'rgba(16, 185, 129, 0.08)', 
                  border: '2px dashed rgba(74, 222, 128, 0.4)', 
                  borderRadius: '20px', 
                  padding: '1.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  minHeight: '200px',
                  transition: 'all 0.2s',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
                }}
                onClick={() => navigate("/setup")}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'; e.currentTarget.style.borderColor = '#4ade80'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'; e.currentTarget.style.borderColor = 'rgba(74, 222, 128, 0.4)'; }}
              >
                <div style={{ background: 'rgba(74, 222, 128, 0.18)', border: '1px solid rgba(74, 222, 128, 0.3)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: '#4ade80' }}>
                  <span style={{ fontSize: '1.6rem', fontWeight: 900 }}>+</span>
                </div>
                <h4 style={{ color: '#4ade80', margin: 0, fontWeight: 800 }}>Add New Crop</h4>
                <p style={{ color: '#cbd5e1', margin: '0.5rem 0 0 0', fontSize: '0.95rem', textAlign: 'center' }}>Configure a new farm or plot</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* YUVI Assistant Widget */}
      <YuviWidget 
        farmState={{
          crop: farmData?.cropType || "Unknown",
          weather: weatherIntelligence || {},
          soil: farmingInsights?.fertilizer_plan?.target_npk || {},
          insights: farmingInsights,
          growth: growthData
        }}
      />
    </div>
  );
};

export default Dashboard;

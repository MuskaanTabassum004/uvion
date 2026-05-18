import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@contexts/authStore";
import { db } from "@services/firebase";
import { collection, addDoc } from "firebase/firestore";
import { MapPin, Sprout, Calendar, Maximize, Droplets, Loader2, User, Check, ArrowRight } from "lucide-react";
import "./Setup.css";

const CROP_OPTIONS = [
  { id: "Rice", name: "Rice", scientific: "Oryza sativa", image: `${import.meta.env.BASE_URL}assets/crops/rice.png` },
  { id: "Tomato", name: "Tomato", scientific: "Solanum lycopersicum", image: `${import.meta.env.BASE_URL}assets/crops/tomato.png` },
  { id: "Potato", name: "Potato", scientific: "Solanum tuberosum", image: `${import.meta.env.BASE_URL}assets/crops/potato.png` },
  { id: "Maize", name: "Maize", scientific: "Zea mays", image: `${import.meta.env.BASE_URL}assets/crops/maize.png` },
  { id: "Grapes", name: "Grapes", scientific: "Vitis vinifera", image: `${import.meta.env.BASE_URL}assets/crops/grapes.png` },
];

const Setup: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    farmerName: user?.displayName || "",
    cropType: "Rice",
    plantingDate: new Date().toISOString().split("T")[0],
    farmSize: "",
    soilType: "Loamy",
    location: "",
    lat: 0,
    lon: 0,
  });
  const [isLocating, setIsLocating] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const selectCrop = (cropId: string) => {
    setFormData((prev) => ({ ...prev, cropType: cropId }));
  };

  const detectGPS = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/geocode/reverse`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ lat: latitude, lon: longitude })
          });
          const data = await res.json();
          if (res.ok) {
            const locName = `${data.name}, ${data.state || data.country}`;
            setFormData(prev => ({ ...prev, location: locName, lat: latitude, lon: longitude }));
            setLocationSearch(locName);
          } else throw new Error("Failed to geocode");
        } catch (err) {
          setFormData(prev => ({ ...prev, lat: latitude, lon: longitude, location: "GPS Coordinates Secured" }));
          setLocationSearch("GPS Coordinates Secured");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setError("GPS permission denied. Please search your village or city below.");
        setIsLocating(false);
      }
    );
  };

  const handleSearchLocation = async () => {
    if (!locationSearch.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/geocode/search`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ query: locationSearch })
      });
      const data = await res.json();
      if (res.ok) {
        const locName = `${data.name}, ${data.state || data.country}`;
        setFormData(prev => ({ ...prev, location: locName, lat: data.lat, lon: data.lon }));
        setLocationSearch(locName);
      } else {
        setError("Location not found. Try another village or city.");
      }
    } catch (err) {
      setError("Network error while searching location.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.lat || !formData.lon) {
      setError("Please detect your GPS location or search for your city before proceeding.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      const docRef = await addDoc(collection(db, "farms"), {
        userId: user.uid,
        ...formData,
        farmSize: Number(formData.farmSize),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      localStorage.setItem("uvion_active_farm_id", docRef.id);
      localStorage.setItem("uvion_crop_type", formData.cropType);
      navigate("/dashboard");
    } catch (err: any) {
      setError("Failed to save farm details. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="setup-page-wrapper">
      <div className="setup-layout">
        
        {/* Left Column: Crop Selection */}
        <div className="setup-main-col">
          <div className="step-badge">STEP 01 / CONFIGURATION</div>
          <h1 className="main-title">Select your <br /><span>Primary Crop</span></h1>
          
          <div className="crop-grid">
            {CROP_OPTIONS.map((crop) => (
              <div 
                key={crop.id}
                className={`crop-card ${formData.cropType === crop.id ? 'selected' : ''}`}
                onClick={() => selectCrop(crop.id)}
              >
                <div className="crop-img-wrapper">
                  <img src={crop.image} alt={crop.name} />
                </div>
                <h3>{crop.name}</h3>
                <p className="scientific-name">{crop.scientific}</p>
                <div className="select-status">
                  {formData.cropType === crop.id ? (
                    <span className="badge-selected">SELECTED</span>
                  ) : (
                    <span className="badge-select">SELECT</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Form Inputs */}
        <div className="setup-side-col">
          <div className="form-card profile-card">
            <div className="card-header">
              <User size={18} />
              <h3>Farmer Profile</h3>
            </div>
            <div className="form-group">
              <label>Farmer Name</label>
              <input
                type="text"
                name="farmerName"
                value={formData.farmerName}
                onChange={handleChange}
                placeholder="e.g. Muskan"
                className="setup-input"
                required
              />
            </div>
          </div>

          <div className="form-card environment-card">
             <div className="card-header">
              <Sprout size={18} />
              <h3>Environment</h3>
            </div>
            <div className="form-group">
              <label>Soil Type</label>
              <select
                name="soilType"
                value={formData.soilType}
                onChange={handleChange}
                className="setup-select"
                required
              >
                <option value="Sandy">Sandy</option>
                <option value="Clay">Clay</option>
                <option value="Loamy">Loamy</option>
                <option value="Silt">Silt</option>
                <option value="Peaty">Peaty</option>
                <option value="Saline">Saline</option>
              </select>
            </div>
            <div className="form-group">
              <label>Farm Size (Acres)</label>
              <div className="input-suffix">
                <input
                  type="number"
                  name="farmSize"
                  value={formData.farmSize}
                  onChange={handleChange}
                  placeholder="e.g. 5.5"
                  step="0.1"
                  min="0.1"
                  className="setup-input"
                  required
                />
                <span className="suffix">Acres</span>
              </div>
            </div>
          </div>

          <div className="form-card logistics-card">
            <div className="card-header">
              <Calendar size={18} />
              <h3>Logistics</h3>
            </div>
            <div className="form-group">
              <label>Planting Date</label>
              <input
                type="date"
                name="plantingDate"
                value={formData.plantingDate}
                onChange={handleChange}
                className="setup-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Farm Location</label>
              <div className="loc-search-box">
                <input
                  type="text"
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  placeholder="Village or city..."
                  className="setup-input"
                />
                <button type="button" className="btn-search" onClick={handleSearchLocation} disabled={isSearching}>
                  {isSearching ? <Loader2 size={16} className="spinner" /> : "Search"}
                </button>
              </div>
              <button type="button" className="btn-gps-compact" onClick={detectGPS} disabled={isLocating}>
                {isLocating ? <Loader2 size={14} className="spinner" /> : <MapPin size={14} />}
                {formData.location ? "Location Locked" : "Use GPS"}
              </button>
            </div>
          </div>

          {error && <div className="setup-error">{error}</div>}

          <button className="btn-initialize" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="spinner" size={20} />
            ) : (
              <>
                Initialize Setup <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Setup;

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Search, 
  Info, 
  AlertTriangle, 
  Droplet, 
  Thermometer, 
  Wind,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Sparkles,
  MapPin
} from 'lucide-react';
import { detectDisease, ScanResult, startTreatmentPlan } from '../../services/healthService';
import { useAuth } from '../../contexts/authStore';
import './HealthComponents.css';

interface DiseaseDetectionProps {
  onSwitchTab?: (tab: string) => void;
}

const DiseaseDetection: React.FC<DiseaseDetectionProps> = ({ onSwitchTab }) => {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartTreatment = async () => {
    if (!result || !user?.uid) return;
    setIsSavingPlan(true);
    try {
      const success = await startTreatmentPlan(user.uid, result);
      if (success) {
        if (onSwitchTab) onSwitchTab('treatment');
      }
    } catch (err) {
      console.error("Failed to start plan", err);
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);

    setIsScanning(true);
    setResult(null);

    try {
      // In a real app, we'd get the current stage from the growth module
      const currentStage = localStorage.getItem('uvion_current_stage') || 'Vegetative';
      const scanResult = await detectDisease(file, user?.uid, currentStage);
      
      // Simulate extra processing time for "AI feel"
      setTimeout(() => {
        setResult(scanResult);
        setIsScanning(false);
      }, 1500);
    } catch (error) {
      console.error("Detection Error:", error);
      alert("Failed to analyze image. Please try again.");
      setIsScanning(false);
    }
  };

  const getDiseaseImage = (diseaseName: string) => {
    const name = diseaseName.toLowerCase().replace(/\s+/g, '_');
    if (name.includes('rust')) return '/assets/diseases/common_rust.png';
    if (name.includes('blight')) return '/assets/diseases/early_blight.png';
    if (name.includes('spot')) return '/assets/diseases/brown_spot.png';
    if (name.includes('healthy')) return '/assets/diseases/healthy.png';
    return '/assets/diseases/healthy.png'; // Fallback
  };

  return (
    <div className="detection-container">
      {!result ? (
        <div className="upload-wrapper">
          <div className={`scan-card ${isScanning ? 'scanning' : ''}`}>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleUpload} 
              style={{ display: 'none' }} 
              accept="image/*"
            />
            
            {isScanning ? (
              <div className="scanning-ui">
                <div className="dna-loader">
                  <Sparkles className="sparkle-icon" />
                </div>
                <h3>Neural Analysis in Progress</h3>
                <p>Cross-referencing pathogen signatures with UVION Dataset...</p>
                <div className="progress-bar-mini">
                  <div className="progress-fill"></div>
                </div>
              </div>
            ) : (
              <div className="upload-prompt" onClick={() => fileInputRef.current?.click()}>
                <div className="icon-circle">
                  <Upload size={32} />
                </div>
                <h2>Capture or Upload Crop Image</h2>
                <p>Use high-resolution images for 99.2% accuracy</p>
                <div className="feature-badges">
                  <span><Search size={14}/> 30+ Disease Classes</span>
                  <span><Droplet size={14}/> Humidity Aware</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="result-view">
          {/* Header Section */}
          <div className="result-header-premium">
            <div className="disease-visual">
              <img src={getDiseaseImage(result.disease)} alt={result.disease} className="disease-img-main" />
              <div className="confidence-overlay">
                <div className="conf-val">{(result.confidence * 100).toFixed(1)}%</div>
                <div className="conf-label">Match Score</div>
              </div>
            </div>
            
            <div className="disease-info-main">
              <div className="status-line">
                <span className={`severity-badge ${result.severity.toLowerCase()}`}>
                  {result.severity} Severity
                </span>
                <span className="urgency-tag">
                  <AlertTriangle size={14}/> {result.urgency} Urgency
                </span>
              </div>
              <h1>{result.disease}</h1>
              <p className="crop-sub"><MapPin size={14}/> Detected in {result.crop} Sector</p>
              
              <div className="reasoning-card">
                <Sparkles size={16} color="#fbbf24" />
                <p><strong>AI Reasoning:</strong> {result.ai_reasoning}</p>
              </div>
            </div>
          </div>

          <div className="result-details-grid">
            {/* Left Column: Clinical Data */}
            <div className="detail-col">
              <div className="hub-card-p">
                <h3><Info size={18}/> Pathogen Analysis</h3>
                <div className="info-section">
                  <label>Symptoms</label>
                  <p>{result.symptoms}</p>
                </div>
                <div className="info-section">
                  <label>Probable Causes</label>
                  <p>{result.causes}</p>
                </div>
                <div className="info-section">
                  <label>Affected Area</label>
                  <p>{result.affected_area}</p>
                </div>
              </div>

              <div className="hub-card-p mt-4">
                <h3><Search size={18}/> Differential Diagnosis (Top 3)</h3>
                <div className="top3-list">
                  {result.top3.map((t, i) => (
                    <div key={i} className="top3-item">
                      <span>{t.disease}</span>
                      <div className="mini-bar-bg">
                        <div className="mini-bar-fill" style={{ width: `${t.confidence * 100}%` }}></div>
                      </div>
                      <span className="conf-perc">{(t.confidence * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Treatment & Nutrition */}
            <div className="detail-col">
              <div className="hub-card-p treatment-card">
                <h3><ClipboardList size={18}/> Proper Treatment Plan</h3>
                <div className="steps-timeline">
                  {result.treatment_plans.map((step, i) => (
                    <div key={i} className="step-point">
                      <div className="step-num">{i + 1}</div>
                      <p>{step}</p>
                    </div>
                  ))}
                </div>
                
                <div className="weather-treatment-box">
                  <div className="w-icon"><Thermometer size={16}/> <Droplet size={16}/></div>
                  <div className="w-text">
                    <label>Weather-Optimized Protocol</label>
                    <p>{result.weather_treatment}</p>
                  </div>
                </div>
              </div>

              <div className="hub-card-p nutrition-card mt-4">
                <h3><Sparkles size={18}/> Prescriptive Nutrition</h3>
                <div className="fert-grid">
                  <div className="fert-item disease-based">
                    <label>Disease Recovery Fertilizer</label>
                    <div className="fert-tags">
                      {result.disease_fertilizers.map((f, i) => (
                        <span key={i} className="fert-tag">{f}</span>
                      ))}
                    </div>
                  </div>
                  
                  {result.stage_fertilizer && (
                    <div className="fert-item stage-based">
                      <label>Growth Stage Nutrient Support</label>
                      <div className="fert-tag gold">{result.stage_fertilizer}</div>
                    </div>
                  )}
                </div>
              </div>

              <button 
                className="btn-primary-p" 
                onClick={handleStartTreatment}
                disabled={isSavingPlan}
                style={{ background: '#fbbf24', color: '#000' }}
              >
                {isSavingPlan ? 'Initializing Neural Plan...' : 'Initiate Recovery Protocol'} 
                <ClipboardList size={18} />
              </button>

              <button className="h-detail-btn mt-4" onClick={() => setResult(null)}>
                Scan Another Plant <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiseaseDetection;

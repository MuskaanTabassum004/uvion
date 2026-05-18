import React, { useEffect, useState } from 'react';
import { Calendar, Tag, Shield, Loader2, ChevronRight, MapPin, Sparkles } from 'lucide-react';

import { fetchHistory, ScanResult, startTreatmentPlan } from '../../services/healthService';

import { useAuth } from '../../contexts/authStore';
import './HealthComponents.css';

interface ScanHistoryProps {
  onSwitchTab?: (tab: string) => void;
}

const ScanHistory: React.FC<ScanHistoryProps> = ({ onSwitchTab }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<ScanResult | null>(null);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  const handleStartTreatment = async (item: ScanResult) => {
    if (!user?.uid) return;
    setIsSavingPlan(true);
    try {
      const success = await startTreatmentPlan(user.uid, item);
      if (success) {
        if (onSwitchTab) onSwitchTab('treatment');
      }
    } catch (err) {
      console.error("Failed to start plan from history", err);
    } finally {
      setIsSavingPlan(false);
    }
  };

  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      try {
        const data = await fetchHistory(user.uid);
        setHistory(data);
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [user]);

  const getDiseaseImage = (diseaseName: string) => {
    const name = diseaseName.toLowerCase().replace(/\s+/g, '_');
    if (name.includes('rust')) return '/assets/diseases/common_rust.png';
    if (name.includes('blight')) return '/assets/diseases/early_blight.png';
    if (name.includes('spot')) return '/assets/diseases/brown_spot.png';
    return '/assets/diseases/healthy.png';
  };

  if (loading) return (
    <div className="flex-center p-20" style={{ opacity: 0.5, textAlign: 'center', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <Loader2 className="animate-spin" size={32} />
      <p style={{ marginTop: '1rem' }}>Synchronizing with Neural Archives...</p>
    </div>
  );

  if (!user) return (
    <div className="flex-center p-20" style={{ opacity: 0.5, textAlign: 'center', padding: '5rem' }}>
      <p>Please log in to view your scan history.</p>
    </div>
  );

  if (history.length === 0) return (
    <div className="flex-center p-20" style={{ opacity: 0.3, textAlign: 'center', padding: '5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Shield size={48} style={{ marginBottom: '1rem' }} />
      <p>No health records found. Perform a scan in the "Detection" tab to start your history.</p>
      <button className="btn-refresh-history mt-4" onClick={() => { setLoading(true); setHistory([]); }} style={{ marginTop: '1rem' }}>
        Try Refreshing
      </button>
    </div>
  );

  return (
    <div className="history-container">
      {selectedResult ? (
        <div className="result-view-overlay">
          <button className="back-btn-p" onClick={() => setSelectedResult(null)}>
            <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> Back to Archives
          </button>
          
          <div className="result-view" style={{ marginTop: '1rem' }}>
            {/* Header Section */}
            <div className="result-header-premium">
              <div className="disease-visual">
                <img src={getDiseaseImage(selectedResult.disease)} alt={selectedResult.disease} className="disease-img-main" />
                <div className="confidence-overlay">
                  <div className="conf-val">{(selectedResult.confidence * 100).toFixed(1)}%</div>
                  <div className="conf-label">Match Score</div>
                </div>
              </div>
              
              <div className="disease-info-main">
                <div className="status-line">
                  <span className={`severity-badge ${selectedResult.severity.toLowerCase()}`}>
                    {selectedResult.severity} Severity
                  </span>
                  <span className="urgency-tag">
                    <Shield size={14}/> {selectedResult.urgency} Urgency
                  </span>
                </div>
                <h1>{selectedResult.disease}</h1>
                <p className="crop-sub"><MapPin size={14}/> Detected in {selectedResult.crop} Sector</p>
                
                <div className="reasoning-card">
                  <Sparkles size={16} color="#fbbf24" />
                  <p><strong>AI Reasoning:</strong> {selectedResult.ai_reasoning}</p>
                </div>
              </div>
            </div>

            <div className="result-details-grid">
              <div className="detail-col">
                <div className="hub-card-p">
                  <h3>Pathogen Analysis</h3>
                  <div className="info-section">
                    <label>Symptoms</label>
                    <p>{selectedResult.symptoms}</p>
                  </div>
                  <div className="info-section">
                    <label>Probable Causes</label>
                    <p>{selectedResult.causes}</p>
                  </div>
                </div>
              </div>
              <div className="detail-col">
                <div className="hub-card-p treatment-card">
                  <h3>Treatment Protocol</h3>
                  {selectedResult.treatment_plans && selectedResult.treatment_plans.length > 0 ? (
                    <div className="steps-timeline">
                      {selectedResult.treatment_plans.map((step, i) => (
                        <div key={i} className="step-point">
                          <div className="step-num">{i + 1}</div>
                          <p>{step}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-treatment-p">
                      <p>No specific protocol attached to this archive. You can generate one below.</p>
                    </div>
                  )}
                  
                  <button 
                    className="btn-primary-p mt-4" 
                    onClick={() => handleStartTreatment(selectedResult)}
                    disabled={isSavingPlan}
                    style={{ background: '#fbbf24', color: '#000', marginTop: '2rem' }}
                  >
                    {isSavingPlan ? 'Initializing Protocol...' : 'Initiate Recovery Protocol'} 
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="history-header-p">
            <div className="h-title-group">
              <h2>Diagnostic Archives</h2>
              <p>Historical pathogen signatures for your sector</p>
            </div>
            <button className="btn-refresh-history" onClick={() => { setLoading(true); setHistory([]); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={16} /> Synchronize Archives
            </button>
          </div>
          
          <div className="history-grid">
            {history.map((item) => (
              <div key={item.scan_id} className="history-card-p">
                <div className="h-img-wrapper">
                  <img src={getDiseaseImage(item.disease)} alt={item.disease} />
                  <div className="h-conf">{(item.confidence * 100).toFixed(0)}%</div>
                </div>
                <div className="h-content">
                  <div className="h-date">
                    <Calendar size={12}/> 
                    {new Date(item.timestamp * 1000).toLocaleDateString()}
                  </div>
                  <h3>{item.disease}</h3>
                  <div className="h-meta">
                    <span><Tag size={12}/> {item.crop}</span>
                    <span className={`h-sev ${item.severity.toLowerCase()}`}>{item.severity}</span>
                  </div>
                  <button className="h-detail-btn" onClick={() => setSelectedResult(item)}>View Full Report</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};


export default ScanHistory;

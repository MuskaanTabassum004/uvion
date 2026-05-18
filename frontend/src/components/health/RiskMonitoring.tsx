import React, { useEffect, useState } from 'react';
import { ShieldAlert, TrendingUp, Thermometer, Droplet, Zap, Wind, AlertTriangle, Clock, Sprout } from 'lucide-react';

import axios from 'axios';
import './HealthComponents.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const RiskMonitoring: React.FC = () => {
  const [riskData, setRiskData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRisk = async () => {
      try {
        const crop = localStorage.getItem('uvion_crop_type') || 'Rice';
        const stage = localStorage.getItem('uvion_current_stage') || 'Vegetative';
        const response = await axios.get(`${API_BASE_URL}/api/v1/health/risk?crop=${crop}&stage=${stage}`);
        setRiskData(response.data.data);
      } catch (err) {
        console.error("Risk fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRisk();
  }, []);

  const currentCrop = localStorage.getItem('uvion_crop_type') || 'Rice';

  if (loading) return <div className="p-10 text-center opacity-50">Calculating real-time risk vectors...</div>;

  if (!riskData) return <div className="p-10 text-center opacity-50">Risk monitoring temporarily offline.</div>;


  return (
    <div className="risk-container-p">
      <div className="risk-header-row">
        <div className="risk-main-card">
          <div className="risk-score-circle">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className={`circle ${riskData.risk_level.toLowerCase()}`} 
                strokeDasharray={`${riskData.risk_score}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
              />
            </svg>
            <div className="percentage">{riskData.risk_score}%</div>
          </div>
          <div className="risk-summary">
            <label>{currentCrop} Threat Assessment</label>
            <h2 className={riskData.risk_level.toLowerCase()}>{riskData.risk_level} RISK</h2>
            <p>{riskData.reason}</p>
          </div>
          
          {/* Fix for 'Black Image' - Adding a dynamic visual element */}
          <div className="risk-visual-blob">
              <Sprout size={120} className="blob-icon" />
          </div>
        </div>

        <div className="weather-stats-p">
          <div className="stat-p">
            <Thermometer size={16} />
            <div className="s-info">
              <label>Ambient Temp</label>
              <span>{riskData.temperature}°C</span>
            </div>
          </div>
          <div className="stat-p">
            <Droplet size={16} />
            <div className="s-info">
              <label>Relative Humidity</label>
              <span>{riskData.humidity}%</span>
            </div>
          </div>
          <div className="stat-p">
            <TrendingUp size={16} />
            <div className="s-info">
              <label>Vector Trend</label>
              <span className={riskData.trend === 'Increasing' ? 'trend-up' : 'trend-stable'}>{riskData.trend}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="threat-vectors mt-8">
        <h3>Primary Threat Vectors</h3>
        <div className="vector-grid">
          {/* Primary Threat Vector fallback */}
          <div className="vector-card">
            <Zap size={20} color="#fbbf24" />
            <div className="v-content">
              <h4>{riskData.risk_type || 'Biological'} Pathogens</h4>
              <p>Conditions are {riskData.risk_score > 60 ? 'optimal' : 'sub-optimal'} for pathogen development.</p>
              <div className="v-bar"><div className="v-fill" style={{ width: `${riskData.risk_score || 0}%` }}></div></div>
            </div>
          </div>
          <div className="vector-card">
            <Wind size={20} color="#60a5fa" />
            <div className="v-content">
              <h4>Spore Dispersion</h4>
              <p>Wind velocity suggests low-to-moderate dispersal probability.</p>
              <div className="v-bar"><div className="v-fill" style={{ width: '35%' }}></div></div>
            </div>
          </div>
        </div>
      </div>

      <div className="risk-forecast-timeline mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3>Neural Risk Timeline (48h)</h3>
          <span className="text-xs opacity-50">Predictive intelligence updated 2m ago</span>
        </div>
        <div className="forecast-scroll-p">
          {riskData.forecast?.map((item: any) => (
            <div key={item.hour} className={`forecast-card-p ${item.level.toLowerCase()}`}>
              <span className="f-hour">+{item.hour}h</span>
              <div className="f-icon">
                {item.level === 'High' ? <AlertTriangle size={18} /> : <Clock size={18} />}
              </div>
              <span className="f-score">{item.score}%</span>
              <span className="f-cond">{item.condition}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default RiskMonitoring;

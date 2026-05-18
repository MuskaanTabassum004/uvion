import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Activity, 
  Camera, 
  History, 
  ShieldAlert, 
  ClipboardList, 
  Upload,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Health.css';
import HealthOverview from '../components/health/HealthOverview';
import DiseaseDetection from '../components/health/DiseaseDetection';
import ScanHistory from '../components/health/ScanHistory';
import RiskMonitoring from '../components/health/RiskMonitoring';
import ActionTracker from '../components/health/ActionTracker';
import TreatmentPlans from '../components/health/TreatmentPlans';



const Health = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeCrop, setActiveCrop] = useState(localStorage.getItem('uvion_crop_type') || 'Rice');
  const [activeStage, setActiveStage] = useState(localStorage.getItem('uvion_current_stage') || 'Vegetative');

  useEffect(() => {
    // Refresh crop info from localStorage
    const crop = localStorage.getItem('uvion_crop_type') || 'Rice';
    const stage = localStorage.getItem('uvion_current_stage') || 'Vegetative';
    setActiveCrop(crop);
    setActiveStage(stage);
  }, []);

  return (
    <div className="health-hub-container">
      {/* SIDEBAR */}
      <aside className="hub-sidebar">
        <div className="hub-logo">UVION</div>
        <div className="hub-subtitle">Health Hub</div>

        <Link to="/dashboard" className="back-btn">
          <ArrowLeft size={18} />
          <span>Main Dashboard</span>
        </Link>

        <nav className="hub-nav">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'detection', label: 'Detection', icon: Camera },
            { id: 'history', label: 'Scan History', icon: History },
            { id: 'risk', label: 'Risk Monitoring', icon: ShieldAlert },
            { id: 'treatment', label: 'Treatment Plans', icon: ClipboardList },
            { id: 'tracker', label: 'Action Tracker', icon: ClipboardList }
          ].map((tab) => (
            <div 
              key={tab.id}
              className={`hub-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </div>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(6, 95, 70, 0.05)', borderRadius: '12px' }}>
          <div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '0.3rem' }}>Active Crop</div>
          <div style={{ fontWeight: 700, color: '#064e3b', textTransform: 'uppercase' }}>
            {activeCrop} ({activeStage})
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="hub-main">
        <header className="hub-header">
          <h1>
            {activeTab === 'detection' ? 'AI Disease Detection' : 
             activeTab === 'overview' ? 'Health Overview' :
             activeTab === 'history' ? 'Crop Scan History' : 
             activeTab === 'risk' ? 'Risk Intelligence' : 
             activeTab === 'treatment' ? 'Recovery Protocols' : 'Action Tracker'}
          </h1>
          <p>
            {activeTab === 'detection' ? 'Analyze biomass for pathogen signatures.' : 
             activeTab === 'overview' ? 'Real-time telemetry and health diagnostics.' :
             'Manage and track your crop health recovery.'}
          </p>
        </header>

        <section className="hub-content">
          {activeTab === 'overview' && <HealthOverview />}
          {activeTab === 'detection' && <DiseaseDetection onSwitchTab={setActiveTab} />}
          {activeTab === 'history' && <ScanHistory onSwitchTab={setActiveTab} />}
          {activeTab === 'risk' && <RiskMonitoring />}
          {activeTab === 'treatment' && <TreatmentPlans />}
          {activeTab === 'tracker' && <ActionTracker />}
        </section>
      </main>
    </div>
  );
};

export default Health;

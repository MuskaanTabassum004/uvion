import React, { useEffect, useState } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { getHealthOverview } from '../../services/healthService';
import { useAuth } from '../../contexts/authStore';
import './HealthComponents.css';

const HealthOverview: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentCrop, setCurrentCrop] = useState(localStorage.getItem('uvion_crop_type') || 'Rice');

  useEffect(() => {
    const crop = localStorage.getItem('uvion_crop_type') || 'Rice';
    setCurrentCrop(crop);

    const loadData = async () => {
      if (!user?.uid) return;
      try {
        const res = await getHealthOverview(user.uid, crop);
        setData(res);
      } catch (err) {
        console.error("Health overview fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  if (loading) return (
    <div className="flex-center p-20" style={{ opacity: 0.5, textAlign: 'center', minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <Loader2 className="animate-spin" size={32} />
      <p style={{ marginTop: '1rem' }}>Calibrating Sector Telemetry...</p>
    </div>
  );

  return (
    <div className="overview-grid-p">
      <div className="hub-card-p score-card-p">
        <div className="score-circle-p">
          <div className="score-val-p">{data?.health_score || 82}</div>
          <div className="score-label-p">Health Index</div>
        </div>
        <div className="score-trend-p">↑ {data?.status_label || 'Stable'} condition</div>
        {data?.action_impact > 0 && (
          <div className="action-bonus-pill">
            🚀 +{data.action_impact}% Intervention Bonus
          </div>
        )}
        <p className="score-desc-p">{data?.risk_summary || `Based on current ${currentCrop} pathogen signatures and environmental risk factors.`}</p>
      </div>

      <div className="hub-card-p">
        <h3><ShieldAlert size={18}/> Critical Risk Zones</h3>
        {data?.active_alerts > 0 ? (
          <div className="risk-item-p high">
            <div className="r-indicator"></div>
            <div className="r-content">
              <label>Environmental Threat</label>
              <p>{data?.risk_summary}</p>
            </div>
          </div>
        ) : (

          <div className="risk-item-p stable">
            <div className="r-indicator"></div>
            <div className="r-content">
              <label>No Active Threats</label>
              <p>Conditions within optimal parameters for your {currentCrop}.</p>
            </div>
          </div>
        )}
        <div className="risk-item-p stable">
          <div className="r-indicator"></div>
          <div className="r-content">
            <label>Physical Integrity</label>
            <p>Moisture and biomass levels within optimal parameters for {currentCrop}.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthOverview;

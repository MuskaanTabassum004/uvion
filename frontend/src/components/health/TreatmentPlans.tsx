import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Calendar, Clock, AlertTriangle, ShieldCheck, ChevronRight, Activity, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/authStore';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, limit } from 'firebase/firestore';

import './HealthComponents.css';

interface TreatmentStep {
  day: number;
  action: string;
  material: string;
  completed: boolean;
}

interface ActivePlan {
  id: string;
  disease: string;
  crop: string;
  startDate: number;
  duration: number;
  steps: TreatmentStep[];
  status: 'active' | 'completed' | 'paused';
}

const TreatmentPlans: React.FC = () => {
  const { user } = useAuth();
  const [activePlan, setActivePlan] = useState<ActivePlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'treatment_plans'),
      where('user_id', '==', user.uid),
      where('status', '==', 'active'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        setActivePlan({ id: snapshot.docs[0].id, ...docData } as ActivePlan);
      } else {
        setActivePlan(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error listening to treatment plan:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleStep = async (stepIndex: number) => {
    if (!activePlan || !user) return;

    const updatedSteps = [...activePlan.steps];
    updatedSteps[stepIndex].completed = !updatedSteps[stepIndex].completed;

    try {
      const planRef = doc(db, 'treatment_plans', activePlan.id);
      await updateDoc(planRef, { steps: updatedSteps });
      setActivePlan({ ...activePlan, steps: updatedSteps });
    } catch (err) {
      console.error("Error updating step:", err);
    }
  };

  if (loading) return <div className="p-20 text-center opacity-50">Loading recovery protocols...</div>;

  if (!activePlan) return (
    <div className="flex-center p-20" style={{ opacity: 0.5, textAlign: 'center', padding: '5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <ClipboardCheck size={64} style={{ marginBottom: '1.5rem', color: '#10b981' }} />
      <h2 style={{ color: 'white' }}>No Active Treatment Plans</h2>
      <p style={{ maxWidth: '400px', margin: '1rem auto' }}>
        When a pathogen is detected in your sector, you can initiate a structured recovery protocol here to guide your treatment.
      </p>
      <div className="hub-card-p" style={{ marginTop: '2rem', background: 'rgba(16, 185, 129, 0.05)' }}>
        <p style={{ fontSize: '0.9rem', color: '#6ee7b7' }}>
          <Zap size={14} /> <strong>Tip:</strong> Use the "Detection" tab to scan a crop and generate a custom treatment plan.
        </p>
      </div>
    </div>
  );

  const progress = (activePlan.steps && activePlan.steps.length > 0)
    ? Math.round((activePlan.steps.filter(s => s.completed).length / activePlan.steps.length) * 100)
    : 0;

  return (
    <div className="treatment-container-p">
      <div className="plan-header-p">
        <div className="plan-title-group">
          <span className="active-tag"><Activity size={12}/> Active Protocol</span>
          <h1>Recovery: {activePlan.disease}</h1>
          <p>Sector: {activePlan.crop} | Started: {new Date(activePlan.startDate * 1000).toLocaleDateString()}</p>
        </div>
        <div className="plan-progress-p">
          <div className="prog-val">{progress}%</div>
          <div className="prog-label">Completion</div>
          <div className="prog-bar-bg-p">
            <div className="prog-bar-fill-p" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      <div className="treatment-grid-p">
        <div className="steps-column-p">
          <div className="hub-card-p">
            <h3><Calendar size={18}/> Treatment Schedule</h3>
            <div className="plan-steps-list">
              {activePlan.steps.map((step, index) => (
                <div key={index} className={`plan-step-item ${step.completed ? 'done' : ''}`} onClick={() => toggleStep(index)}>
                  <div className="step-check">
                    {step.completed ? <ShieldCheck size={20} color="#10b981" /> : <div className="check-ring"></div>}
                  </div>
                  <div className="step-content">
                    <label>Day {step.day}</label>
                    <p>{step.action}</p>
                    <span className="material-tag">{step.material}</span>
                  </div>
                  {!step.completed && <ChevronRight size={16} className="arrow" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="details-column-p">
          <div className="hub-card-p warning-box-p">
            <h3><AlertTriangle size={18} color="#fbbf24"/> Critical Warnings</h3>
            <ul>
              <li>Avoid irrigation for 24 hours after fungicide application.</li>
              <li>Always use PPE when handling chemical treatments.</li>
              <li>Dispose of infected plant matter at least 50m from sector.</li>
            </ul>
          </div>

          <div className="hub-card-p">
            <h3><Clock size={18}/> Estimated Recovery</h3>
            <div className="recovery-stat">
              <div className="stat-item">
                <label>Total Duration</label>
                <p>{activePlan.duration} Days</p>
              </div>
              <div className="stat-item">
                <label>Expected Outcome</label>
                <p>Pathogen Elimination</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreatmentPlans;

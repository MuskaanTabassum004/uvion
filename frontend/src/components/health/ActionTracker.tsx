import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, Info, Activity, ShieldCheck, Leaf, Sprout, FlaskConical, Droplets } from 'lucide-react';
import { useAuth } from '../../contexts/authStore';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './HealthComponents.css';

const ActionTracker: React.FC = () => {
  const { user } = useAuth();
  const currentCrop = localStorage.getItem('uvion_crop_type') || 'Rice';
  
  // Dynamic Task Library - Simplified & Expanded
  const cropTasks: any = {
    "Rice": [
      { id: 1, text: 'Check for brown spots on leaves', category: 'Monitoring', impact: '+10 Health', icon: <Leaf size={16}/> },
      { id: 2, text: 'Use organic medicine to stop fungus', category: 'Treatment', impact: '+15 Health', icon: <FlaskConical size={16}/> },
      { id: 3, text: 'Drain extra water from the field', category: 'Field Work', impact: '+8 Stability', icon: <Droplets size={16}/> },
      { id: 4, text: 'Remove weeds around the plants', category: 'Cleaning', impact: '+5 Growth', icon: <Sprout size={16}/> },
      { id: 5, text: 'Check if leaves are turning yellow', category: 'Nutrition', impact: '+12 Health', icon: <Activity size={16}/> }
    ],
    "Tomato": [
      { id: 1, text: 'Cut off bottom leaves to keep them dry', category: 'Pruning', impact: '+12 Health', icon: <Sprout size={16}/> },
      { id: 2, text: 'Spray copper medicine to kill germs', category: 'Treatment', impact: '+18 Health', icon: <FlaskConical size={16}/> },
      { id: 3, text: 'Check for white flies under leaves', category: 'Pests', impact: '+10 Safety', icon: <Activity size={16}/> },
      { id: 4, text: 'Tie tall plants to sticks for support', category: 'Support', impact: '+8 Stability', icon: <ShieldCheck size={16}/> },
      { id: 5, text: 'Water the ground, not the leaves', category: 'Irrigation', impact: '+10 Health', icon: <Droplets size={16}/> }
    ],
    "Potato": [
      { id: 1, text: 'Keep soil moist but not soaking wet', category: 'Irrigation', impact: '+10 Health', icon: <Droplets size={16}/> },
      { id: 2, text: 'Spray medicine to stop leaf rot', category: 'Treatment', impact: '+20 Health', icon: <FlaskConical size={16}/> },
      { id: 3, text: 'Look for small green bugs on stems', category: 'Pests', impact: '+8 Security', icon: <Activity size={16}/> },
      { id: 4, text: 'Cover growing potatoes with more soil', category: 'Field Work', impact: '+12 Growth', icon: <Sprout size={16}/> },
      { id: 5, text: 'Check for holes in the leaves', category: 'Monitoring', impact: '+7 Safety', icon: <Leaf size={16}/> }
    ],
    "Maize": [
      { id: 1, text: 'Spray Zinc spray to help growth', category: 'Nutrition', impact: '+12 Growth', icon: <Sprout size={16}/> },
      { id: 2, text: 'Check for orange spots on leaves', category: 'Monitoring', impact: '+10 Safety', icon: <Leaf size={16}/> },
      { id: 3, text: 'Check for rot if the air is very wet', category: 'Disease', impact: '+15 Recovery', icon: <Activity size={16}/> },
      { id: 4, text: 'Remove small plants that are too close', category: 'Thinning', impact: '+10 Growth', icon: <ShieldCheck size={16}/> },
      { id: 5, text: 'Look for worms in the plant center', category: 'Pests', impact: '+15 Safety', icon: <Activity size={16}/> }
    ],
    "Grapes": [
      { id: 1, text: 'Trim branches to let more air in', category: 'Pruning', impact: '+15 Health', icon: <Sprout size={16}/> },
      { id: 2, text: 'Use sulfur spray for white leaf powder', category: 'Treatment', impact: '+18 Recovery', icon: <FlaskConical size={16}/> },
      { id: 3, text: 'Check for dark spots after it rains', category: 'Monitoring', impact: '+12 Stability', icon: <Activity size={16}/> },
      { id: 4, text: 'Remove dry or dead grapes from bunches', category: 'Cleaning', impact: '+10 Quality', icon: <Leaf size={16}/> },
      { id: 5, text: 'Check if roots need more water', category: 'Irrigation', impact: '+8 Health', icon: <Droplets size={16}/> }
    ]
  };

  // Alias Corn to Maize
  if (currentCrop === "Corn") cropTasks["Corn"] = cropTasks["Maize"];

  const [actions, setActions] = useState<any[]>([]);

  useEffect(() => {
    const initialTasks = cropTasks[currentCrop] || cropTasks["Rice"];
    setActions(initialTasks.map((t: any) => ({...t, completed: false})));
  }, [currentCrop]);

  const toggleAction = async (id: number) => {
    const newActions = actions.map(a => {
      if (a.id === id) {
        const updated = { ...a, completed: !a.completed };
        if (updated.completed && user?.uid) {
          addDoc(collection(db, 'farm_actions'), {
            user_id: user.uid,
            type: 'TASK_COMPLETE',
            action: updated.text,
            impact: updated.impact,
            timestamp: serverTimestamp()
          }).catch(err => console.error("Action Log Error:", err));
        }
        return updated;
      }
      return a;
    });
    setActions(newActions);
  };

  const completionRate = Math.round((actions.filter(a => a.completed).length / actions.length) * 100) || 0;

  return (
    <div className="action-tracker-p">
      <div className="tracker-header">
        <div className="t-title">
          <h2>Precision Protocols: {currentCrop}</h2>
          <p>Interventions generated based on localized {currentCrop} phenotypes.</p>
        </div>
        <div className="completion-stats">
            <div className="stat-label">Progress</div>
            <div className="stat-value">{completionRate}%</div>
        </div>
      </div>

      <div className="action-list-p">
        {actions.map(action => (
          <div key={action.id} className={`action-item-p ${action.completed ? 'done' : ''}`}>
            <div className="action-check" onClick={() => toggleAction(action.id)}>
              {action.completed ? <CheckCircle2 size={24} color="#10b981" /> : <Circle size={24} color="rgba(255,255,255,0.1)" />}
            </div>
            <div className="action-info-p">
              <div className="a-meta">
                <span className="a-cat">{action.icon} {action.category}</span>
                <span className="a-impact">{action.impact}</span>
              </div>
              <h4>{action.text}</h4>
            </div>
            <div className="action-help">
              <Info size={16} />
            </div>
          </div>
        ))}
      </div>

      <div className="impact-summary-p">
        <div className="impact-card-p">
          <ShieldCheck size={28} color="#10b981" />
          <div className="im-data">
            <label>Safety Margin</label>
            <span>{completionRate > 60 ? 'Optimal' : 'Low'}</span>
          </div>
        </div>
        <div className="impact-card-p">
          <Activity size={28} color="#60a5fa" />
          <div className="im-data">
            <label>Completed Tasks</label>
            <span>{actions.filter(a => a.completed).length}/{actions.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionTracker;

import axios from 'axios';
import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp, Timestamp } from 'firebase/firestore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export interface ScanResult {
  scan_id: string;
  disease: string;
  crop: string;
  confidence: number;
  top3: Array<{ disease: string; confidence: number }>;
  symptoms: string;
  causes: string;
  management: string;
  affected_area: string;
  severity: string;
  urgency: string;
  treatment_plans: string[];
  weather_treatment: string;
  stage_fertilizer?: string;
  disease_fertilizers: string[];
  ai_reasoning: string;
  timestamp: number;
}

export const detectDisease = async (file: File, uid?: string, cropStage: string = "Vegetative"): Promise<ScanResult> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const url = `${API_BASE_URL}/api/v1/health/detect-disease?crop_stage=${cropStage}`;
  const response = await axios.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  const result = response.data.data;
  
  // If user is logged in, save to Firestore directly from frontend
  if (uid) {
    try {
      await addDoc(collection(db, 'health_records'), {
        ...result,
        user_id: uid,
        created_at: serverTimestamp()
      });
    } catch (err) {
      console.error("Firestore Save Error:", err);
    }
  }
  
  return result;
};

export const fetchHistory = async (uid: string): Promise<ScanResult[]> => {
  try {
    const q = query(
      collection(db, 'health_records'),
      where('user_id', '==', uid),
      limit(50)
    );
    
    const querySnapshot = await getDocs(q);
    const results: ScanResult[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = data.created_at as Timestamp;
      results.push({
        ...data,
        scan_id: doc.id,
        timestamp: createdAt ? createdAt.seconds : Date.now() / 1000
      } as ScanResult);
    });
    
    // Sort manually in JS to avoid "Missing Index" errors
    return results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  } catch (err) {
    console.error("Fetch History Error:", err);
    // Fallback to empty if index is missing or other error
    return [];
  }
};

export const logAction = async (uid: string, action: any) => {
  // Handled by frontend now
  return { status: "success" };
};

export const fetchActionCount = async (uid: string): Promise<number> => {
  try {
    const q = query(
      collection(db, 'farm_actions'),
      where('user_id', '==', uid)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (err) {
    console.error("Action count error:", err);
    return 0;
  }
};

export const startTreatmentPlan = async (uid: string, result: ScanResult) => {
  try {
    const planSteps = result.treatment_plans.map((action, index) => ({
      day: index + 1,
      action: action,
      material: "Recommended Fungicide/Treatment",
      completed: false
    }));

    await addDoc(collection(db, 'treatment_plans'), {
      user_id: uid,
      disease: result.disease,
      crop: result.crop,
      startDate: Math.floor(Date.now() / 1000),
      duration: planSteps.length,
      steps: planSteps,
      status: 'active'
    });
    return true;
  } catch (err) {
    console.error("Start Treatment Plan Error:", err);
    return false;
  }
};

export const getHealthOverview = async (uid: string, crop: string, lat: number = 0, lon: number = 0) => {
  // First get actions count
  let actionsCount = 0;
  try {
    const q = query(collection(db, 'farm_actions'), where('user_id', '==', uid));
    const snapshot = await getDocs(q);
    actionsCount = snapshot.size;
  } catch (e) {}

  const response = await axios.get(`${API_BASE_URL}/api/v1/health/overview?uid=${uid}&crop=${crop}&lat=${lat}&lon=${lon}&actions_done=${actionsCount}`);
  return response.data.data;
};



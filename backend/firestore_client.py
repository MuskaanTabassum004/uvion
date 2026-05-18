import os
import firebase_admin
from firebase_admin import credentials, firestore
import time

class FirestoreClient:
    def __init__(self):
        self.project_id = os.environ.get("VITE_FIREBASE_PROJECT_ID", "uvion-21ac2")
        
        # Initialize Firebase Admin
        # In a real environment, you'd provide a service account JSON.
        # Here we attempt to use default credentials or project ID.
        try:
            if not firebase_admin._apps:
                # Attempt to initialize with default credentials
                firebase_admin.initialize_app(options={
                    'projectId': self.project_id,
                })
            self.db = firestore.client()
            print(f"[OK] Firestore initialized for project: {self.project_id}")
        except Exception as e:
            print(f"[ERROR] Firestore initialization failed: {e}")
            self.db = None

    def save_health_record(self, user_id, record):
        if not self.db: 
            print("[DEBUG] No DB client available for save")
            return None
        
        try:
            print(f"[DEBUG] Saving health record for user: {user_id}")
            doc_ref = self.db.collection('health_records').document()
            record['id'] = doc_ref.id
            record['user_id'] = user_id
            record['created_at'] = firestore.SERVER_TIMESTAMP
            doc_ref.set(record)
            print(f"[DEBUG] Record saved successfully with ID: {doc_ref.id}")
            return doc_ref.id
        except Exception as e:
            print(f"[DEBUG] Error saving health record: {e}")
            return None

    def get_health_records(self, user_id, limit=10):
        if not self.db: 
            print("[DEBUG] No DB client available for fetch")
            return []
        
        try:
            print(f"[DEBUG] Fetching records for user: {user_id}")
            docs = self.db.collection('health_records') \
                .where('user_id', '==', user_id) \
                .limit(limit) \
                .stream()

            
            results = []
            for doc in docs:
                data = doc.to_dict()
                # Convert timestamp for frontend compatibility
                if 'created_at' in data and data['created_at']:
                    # Handle both Datetime and potential float/string
                    try:
                        data['timestamp'] = data['created_at'].timestamp()
                    except:
                        data['timestamp'] = time.time()
                elif 'timestamp' not in data:
                    data['timestamp'] = time.time()
                results.append(data)
            
            print(f"[DEBUG] Found {len(results)} records for user: {user_id}")
            # Sort in memory since Firestore index might be missing
            results.sort(key=lambda x: x.get('timestamp', 0), reverse=True)
            return results



        except Exception as e:
            print(f"Error fetching health records: {e}")
            return []

    def save_action(self, user_id, action):
        if not self.db: return None
        
        try:
            doc_ref = self.db.collection('user_actions').document()
            action['id'] = doc_ref.id
            action['user_id'] = user_id
            action['timestamp'] = firestore.SERVER_TIMESTAMP
            # Ensure required fields exist
            if 'completed' not in action:
                action['completed'] = True
            doc_ref.set(action)
            return doc_ref.id
        except Exception as e:
            print(f"Error saving user action: {e}")
            return None

    def get_recent_user_actions(self, user_id, limit=5):
        if not self.db: return []
        
        try:
            docs = self.db.collection('user_actions') \
                .where('user_id', '==', user_id) \
                .order_by('timestamp', direction=firestore.Query.DESCENDING) \
                .limit(limit) \
                .stream()
            
            results = []
            for doc in docs:
                data = doc.to_dict()
                results.append(data)
            return results
        except Exception as e:
            print(f"Error fetching user actions: {e}")
            return []

    def save_crop_history(self, user_id, history_data):
        if not self.db: return None
        
        try:
            doc_ref = self.db.collection('crop_history').document()
            history_data['id'] = doc_ref.id
            history_data['user_id'] = user_id
            history_data['timestamp'] = firestore.SERVER_TIMESTAMP
            doc_ref.set(history_data)
            return doc_ref.id
        except Exception as e:
            print(f"Error saving crop history: {e}")
            return None

    def get_crop_history(self, user_id, limit=3):
        if not self.db: return []
        
        try:
            docs = self.db.collection('crop_history') \
                .where('user_id', '==', user_id) \
                .order_by('timestamp', direction=firestore.Query.DESCENDING) \
                .limit(limit) \
                .stream()
            
            results = []
            for doc in docs:
                data = doc.to_dict()
                results.append(data)
            return results
        except Exception as e:
            print(f"Error fetching crop history: {e}")
            return []

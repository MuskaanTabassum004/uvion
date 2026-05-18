import { create } from "zustand";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth, db } from "@services/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { User, AuthContextType } from "@types/auth";

interface AuthStore extends Omit<AuthContextType, "clearError"> {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  initializeAuth: () => void;
}

export const useAuth = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  signup: async (email: string, password: string, displayName: string) => {
    try {
      set({ loading: true, error: null });

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const firebaseUser = userCredential.user;

      // Update profile with display name
      await updateProfile(firebaseUser, { displayName });

      // Save user to Firestore
      await setDoc(doc(db, "users", firebaseUser.uid), {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayName,
        photoURL: firebaseUser.photoURL || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      set({
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: displayName,
          photoURL: firebaseUser.photoURL || null,
        },
        loading: false,
      });
    } catch (error: any) {
      const errorMessage = error.message || "Signup failed";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const firebaseUser = userCredential.user;

      // Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      const userData = userDoc.data();

      set({
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || userData?.displayName || "",
          photoURL: firebaseUser.photoURL || null,
        },
        loading: false,
      });
    } catch (error: any) {
      const errorMessage = error.message || "Login failed";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  loginWithGoogle: async () => {
    try {
      set({ loading: true, error: null });
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;

      // Check if user exists, if not create in Firestore
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      set({
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "",
          photoURL: firebaseUser.photoURL || null,
        },
        loading: false,
      });
    } catch (error: any) {
      const errorMessage = error.message || "Google Login failed";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ loading: true, error: null });
      await signOut(auth);
      set({ user: null, loading: false });
    } catch (error: any) {
      const errorMessage = error.message || "Logout failed";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  initializeAuth: () => {
    set({ loading: true });
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          const userData = userDoc.data();

          set({
            user: {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName:
                firebaseUser.displayName || userData?.displayName || "",
              photoURL: firebaseUser.photoURL || null,
            },
            loading: false,
          });
        } catch (error) {
          set({ loading: false });
        }
      } else {
        set({ user: null, loading: false });
      }
    });

    return unsubscribe;
  },
}));

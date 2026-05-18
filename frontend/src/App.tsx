import React, { useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "@contexts/authStore";
import ProtectedRoute from "@components/ProtectedRoute";
import Login from "@pages/Login";
import Signup from "@pages/Signup";
import Setup from "@pages/Setup";
import Dashboard from "@pages/Dashboard";
import Health from "@pages/Health";
import "@styles/globals.css";

const App: React.FC = () => {
  const { initializeAuth } = useAuth();

  // Initialize auth on mount
  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe?.();
  }, [initializeAuth]);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route
          path="/setup"
          element={
            <ProtectedRoute>
              <Setup />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/health-hub"
          element={
            <ProtectedRoute>
              <Health />
            </ProtectedRoute>
          }
        />
        <Route path="/health" element={<Navigate to="/health-hub" replace />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />



        {/* Redirect to login by default */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;

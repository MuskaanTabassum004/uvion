import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@contexts/authStore";
import { theme } from "@styles/theme";
import "./Auth.css";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, user, loading, error, clearError } = useAuth();

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setLocalError(null);
    try {
      await loginWithGoogle();
      navigate("/setup");
    } catch (err: any) {
      setLocalError(err.message || "Google Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/setup");
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setLocalError(null);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);

    if (!formData.email || !formData.password) {
      setLocalError("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(formData.email, formData.password);
      navigate("/setup");
    } catch (err: any) {
      const errorMsg = err.message || "Login failed. Please try again.";
      setLocalError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-gradient-bg"></div>

      <div className="auth-content">
        {/* Header Section */}
        <div className="auth-header">
          <div className="auth-logo">
            <div className="logo-icon">🌾</div>
          </div>
          <h1>Welcome to UVION</h1>
          <p>AI-Powered Autonomous Farming System</p>
        </div>

        {/* Form Card */}
        <div className="auth-card">
          <div className="auth-form-section">
            <h2>Sign In</h2>
            <p className="auth-subtitle">
              Enter your credentials to access your farm
            </p>

            {(localError || error) && (
              <div className="alert alert-error animate-fade-in">
                <span className="alert-icon">⚠️</span>
                <span>{localError || error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {/* Email Field */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">📧</span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading || isSubmitting}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading || isSubmitting}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="form-actions">
                <label className="checkbox-wrapper">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <a href="#" className="forgot-password">
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || isSubmitting}
                className="btn-primary btn-lg"
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="divider">
              <span>or</span>
            </div>

            {/* Social Login */}
            <div className="social-login">
              <button 
                type="button" 
                onClick={handleGoogleLogin} 
                disabled={loading || isSubmitting} 
                className="btn-social btn-google"
              >
                <span className="btn-icon">Google</span>
              </button>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="auth-footer">
            <p>
              Don't have an account?{" "}
              <Link to="/signup" className="auth-link">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

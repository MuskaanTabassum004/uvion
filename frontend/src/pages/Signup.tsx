import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@contexts/authStore";
import "./Auth.css";

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signup, loginWithGoogle, user, loading, error, clearError } = useAuth();

  const handleGoogleSignup = async () => {
    setIsSubmitting(true);
    setLocalError(null);
    try {
      await loginWithGoogle();
      navigate("/setup");
    } catch (err: any) {
      setLocalError(err.message || "Google Signup failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<
    "weak" | "medium" | "strong"
  >("weak");

  useEffect(() => {
    if (user) {
      navigate("/setup");
    }
  }, [user, navigate]);

  useEffect(() => {
    // Calculate password strength
    const password = formData.password;
    if (password.length < 6) {
      setPasswordStrength("weak");
    } else if (
      password.length < 10 ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      setPasswordStrength("medium");
    } else {
      setPasswordStrength("strong");
    }
  }, [formData.password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setLocalError(null);
    clearError();
  };

  const validateForm = (): boolean => {
    if (
      !formData.displayName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setLocalError("Please fill in all fields");
      return false;
    }

    if (formData.password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError("Passwords do not match");
      return false;
    }

    if (!formData.email.includes("@")) {
      setLocalError("Please enter a valid email");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(formData.email, formData.password, formData.displayName);
      navigate("/setup");
    } catch (err: any) {
      const errorMsg = err.message || "Signup failed. Please try again.";
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
          <h1>Join UVION</h1>
          <p>Create your farming account</p>
        </div>

        {/* Form Card */}
        <div className="auth-card">
          <div className="auth-form-section">
            <h2>Create Account</h2>
            <p className="auth-subtitle">
              Start your smart farming journey today
            </p>

            {(localError || error) && (
              <div className="alert alert-error animate-fade-in">
                <span className="alert-icon">⚠️</span>
                <span>{localError || error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {/* Full Name Field */}
              <div className="form-group">
                <label htmlFor="displayName" className="form-label">
                  Full Name
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    placeholder="John Farmer"
                    value={formData.displayName}
                    onChange={handleChange}
                    disabled={loading || isSubmitting}
                    className="form-input"
                  />
                </div>
              </div>

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
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading || isSubmitting}
                    className="form-input"
                  />
                </div>
                <div className="password-strength">
                  <div
                    className={`strength-bar strength-${passwordStrength}`}
                  ></div>
                  <span
                    className={`strength-text strength-${passwordStrength}`}
                  >
                    {passwordStrength === "weak" && "Weak password"}
                    {passwordStrength === "medium" && "Medium strength"}
                    {passwordStrength === "strong" && "Strong password"}
                  </span>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading || isSubmitting}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Terms & Conditions */}
              <label className="checkbox-wrapper">
                <input type="checkbox" required />
                <span>
                  I agree to the{" "}
                  <a href="#" className="terms-link">
                    Terms & Conditions
                  </a>
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || isSubmitting}
                className="btn-primary btn-lg"
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="divider">
              <span>or</span>
            </div>

            {/* Social Signup */}
            <div className="social-login">
              <button 
                type="button" 
                onClick={handleGoogleSignup} 
                disabled={loading || isSubmitting} 
                className="btn-social btn-google"
              >
                <span className="btn-icon">Sign up with Google</span>
              </button>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="auth-footer">
            <p>
              Already have an account?{" "}
              <Link to="/login" className="auth-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;

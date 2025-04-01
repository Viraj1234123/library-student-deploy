import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "./Login.css";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import image from "../assets/login.jpg";
import libraryLogo from "../assets/logo.jpg"

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const Auth = () => {
  const [activeTab, setActiveTab] = useState("student"); // "student" or "admin"
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const navigate = useNavigate();

  // Student Login states
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentLoginError, setStudentLoginError] = useState("");

  // Admin Login states
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  // Input handlers
  const handleStudentLoginChange = (e) => {
    const { id, value } = e.target;
    if (id === "student-email") setStudentEmail(value);
    if (id === "student-password") setStudentPassword(value);
  };

  const handleAdminLoginChange = (e) => {
    const { id, value } = e.target;
    if (id === "admin-email") setAdminEmail(value);
    if (id === "admin-password") setAdminPassword(value);
  };

  // Form submission handlers
  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setStudentLoginError("");
    try {
      const res = await API.post("/students/login", { email: studentEmail, password: studentPassword });
      if (res?.data) navigate("/dashboard");
    } catch (err) {
      console.error("Student Login Error:", err);
      setStudentLoginError(err.response?.data?.message || "Login failed. Please check your credentials.");
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminLoginError("");
    try {
      const res = await API.post("/admins/login", { email: adminEmail, password: adminPassword });
      if (res?.data) navigate("/admin");
    } catch (err) {
      console.error("Admin Login Error:", err);
      setAdminLoginError(err.response?.data?.message || "Login failed. Please check your credentials.");
    }
  };

  const handleGoogleLogin = async (response, isAdmin = false) => {
    try {
      const endpoint = `${process.env.REACT_APP_BACKEND_URL}/api/v1/auth/google`;
      
      const res = await axios.post(
        endpoint, 
        { credential: response.credential },
        { withCredentials: true }
      );
      
      if (res.status === 200) {
        navigate(res.data.data.role === "admin" ? "/admin" : "/dashboard");
      }
    } catch (error) {
      console.error('Google Login Error:', error);
      if (isAdmin) {
        setAdminLoginError("Google login failed. Please try again.");
      } else {
        setStudentLoginError("Google login failed. Please try again.");
      }
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    
    const endpoint = activeTab === "student" ? "/students/reset-password-request" : "/admin/reset-password-request";
    
    try {
      const res = await API.post(endpoint, { email: forgotEmail });
      if (res.data.success) {
        setForgotSuccess("A reset link has been sent to your email.");
      } else {
        setForgotError(res.data.message || "Reset password request failed. Please try again.");
      }
    } catch (err) {
      console.error("Forgot Password Error:", err);
      setForgotError(err.response?.data?.message || "Reset password request failed. Please try again.");
    }
  };

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className="auth-page">
        {/* Library title at the top center */}
        <div className="library-title">
          <div className="library-logo">
            <img 
              src={libraryLogo} 
              alt="Nalanda Library Logo" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain' 
              }} 
            />
          </div>
          Nalanda Library
        </div>
        
        {/* Container for auth-image and auth-form */}
        <div className="auth-container">
          {/* Left section with image */}
          <div className="auth-image-section">
            <img 
              src={image} 
              alt="Nalanda Library" 
              className="auth-image" 
            />
            <div className="auth-image-caption">
              <h2>Welcome to Nalanda Library, IIT Ropar</h2>
              <p>Access thousands of educational resources to enhance your academic journey.</p>
            </div>
          </div>
          
          {/* Right section with login forms */}
          <div className="auth-form-section">
            <div className="auth-box">
              <div className="auth-toggle">
                <button
                  className={activeTab === "student" && !isForgotPassword ? "active" : ""}
                  onClick={() => {
                    setActiveTab("student");
                    setIsForgotPassword(false);
                  }}
                >
                  Student Sign In
                </button>
                <button
                  className={activeTab === "admin" && !isForgotPassword ? "active" : ""}
                  onClick={() => {
                    setActiveTab("admin");
                    setIsForgotPassword(false);
                  }}
                >
                  Admin Sign In
                </button>
              </div>
              
              {isForgotPassword ? (
                <form onSubmit={handleForgotPassword} className="auth-form">
                  <h2>Reset Password</h2>
                  {forgotError && <p className="error">{forgotError}</p>}
                  {forgotSuccess && <p className="success">{forgotSuccess}</p>}
                  <div className="form-group">
                    <label htmlFor="forgot-email">Email Address</label>
                    <input
                      id="forgot-email"
                      type="email"
                      placeholder={`Enter your ${activeTab === "admin" ? "admin" : "institutional"} email`}
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit">Send Reset Link</button>
                  <p className="back-to-login" onClick={() => setIsForgotPassword(false)}>
                    Return to Sign In
                  </p>
                </form>
              ) : activeTab === "student" ? (
                <form onSubmit={handleStudentLogin} className="auth-form">
                  <h2>Student Sign In</h2>
                  {studentLoginError && <p className="error">{studentLoginError}</p>}
                  <div className="form-group">
                    <label htmlFor="student-email">Email Address</label>
                    <input
                      id="student-email"
                      type="email"
                      placeholder="Enter your institutional email"
                      value={studentEmail}
                      onChange={handleStudentLoginChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="student-password">Password</label>
                    <input
                      id="student-password"
                      type="password"
                      placeholder="Enter your password"
                      value={studentPassword}
                      onChange={handleStudentLoginChange}
                      required
                    />
                  </div>
                  <button type="submit">Sign In</button>
                  <p className="forgot-password" onClick={() => setIsForgotPassword(true)}>
                    Forgot Password?
                  </p>
                  
                  <div className="google-login-container">
                    <div className="separator">
                      <span>OR</span>
                    </div>
                    <GoogleLogin
                      onSuccess={(response) => handleGoogleLogin(response, false)}
                      onError={(error) => {
                        console.error("Google Login Error:", error);
                        setStudentLoginError("Google login failed. Please try again.");
                      }}
                      useOneTap
                      text="sign_in_with"
                      shape="rectangular"
                      width="100%"
                    />
                  </div>
                </form>
              ) : (
                <form onSubmit={handleAdminLogin} className="auth-form">
                  <h2>Admin Sign In</h2>
                  {adminLoginError && <p className="error">{adminLoginError}</p>}
                  <div className="form-group">
                    <label htmlFor="admin-email">Email Address</label>
                    <input
                      id="admin-email"
                      type="email"
                      placeholder="Enter your admin email"
                      value={adminEmail}
                      onChange={handleAdminLoginChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="admin-password">Password</label>
                    <input
                      id="admin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={adminPassword}
                      onChange={handleAdminLoginChange}
                      required
                    />
                  </div>
                  <button type="submit">Sign In</button>
                  <p className="forgot-password" onClick={() => setIsForgotPassword(true)}>
                    Forgot Password?
                  </p>
                  
                  {/* Added Google Sign In for Admin */}
                  <div className="google-login-container">
                    <div className="separator">
                      <span>OR</span>
                    </div>
                    <GoogleLogin
                      onSuccess={(response) => handleGoogleLogin(response, true)}
                      onError={(error) => {
                        console.error("Google Login Error:", error);
                        setAdminLoginError("Google login failed. Please try again.");
                      }}
                      useOneTap
                      text="sign_in_with"
                      shape="rectangular"
                      width="100%"
                    />
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Auth;
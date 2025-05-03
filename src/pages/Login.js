import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "./Login.css";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import image from "../assets/login.jpg";
import libraryLogo from "../assets/logo.jpg";
import Alert from "../components/Alert";

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const Auth = () => {
  const [activeTab, setActiveTab] = useState("student"); // "student" or "admin"
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const navigate = useNavigate();

  // Student Login states
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  
  // Admin Login states
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  
  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState("");

  // Alert state
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "error"
  });

  // Handle showing alerts
  const showAlert = (message, type = "error") => {
    setAlert({
      show: true,
      message,
      type
    });
  };

  // Handle dismissing alerts
  const dismissAlert = () => {
    setAlert({
      ...alert,
      show: false
    });
  };

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
    dismissAlert();
    try {
      const res = await API.post("/students/login", { email: studentEmail, password: studentPassword });
      if (res?.data) navigate("/dashboard");
    } catch (err) {
      console.error("Student Login Error:", err);
      showAlert(err.response?.data?.message || "Login failed. Please check your credentials.");
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    dismissAlert();
    try {
      const res = await API.post("/admins/login", { email: adminEmail, password: adminPassword });
      if (res?.data) window.location.href = "/admin/";
    } catch (err) {
      console.error("Admin Login Error:", err);
      showAlert(err.response?.data?.message || "Login failed. Please check your credentials.");
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
        if(res.data.data.role === "admin") {
          window.location.href = "/admin/";
        }
        else{
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error('Google Login Error:', error);
      if (error.response.data.message === "Please login with your IIT Ropar email id") {
        showAlert(error.response.data.message);
      }
      else showAlert("Google login failed. Please try again.");
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    dismissAlert();
    
    const endpoint = activeTab === "student" ? "/students/reset-password-request" : "/admins/reset-password-request";
    
    try {
      const res = await API.post(endpoint, { email: forgotEmail });
      if (res.status === 200) {
        showAlert("A reset link has been sent to your email.", "success");
      } else {
        showAlert(res.data.message || "Reset password request failed. Please try again.");
      }
    } catch (err) {
      console.error("Forgot Password Error:", err);
      if(err?.status === 404) {
        showAlert("Please check your email address.");
      }
      else showAlert(err.response?.data?.message || "Reset password request failed. Please try again.");
    }
  };

  // Clear alerts when switching tabs or forms
  useEffect(() => {
    dismissAlert();
  }, [activeTab, isForgotPassword]);

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className="auth-page">
        {/* Alert Component */}
        <Alert 
          message={alert.message}
          type={alert.type}
          show={alert.show}
          onDismiss={dismissAlert}
          autoDismissTime={5000}
        />
        
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
                        showAlert("Google login failed. Please try again.");
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
                        showAlert("Google login failed. Please try again.");
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
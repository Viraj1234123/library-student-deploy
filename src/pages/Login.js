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
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const navigate = useNavigate();

  // Login states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  // Registration states in a single object
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    dateOfBirth: "",
    gender: "M",
    phoneNumber: "",
    rollNo: "",
    department: "",
    degree: "",
    password: ""
  });
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");

  // Input handlers
  const handleLoginChange = (e) => {
    const { id, value } = e.target;
    if (id === "login-email") setLoginEmail(value);
    if (id === "login-password") setLoginPassword(value);
  };

  const handleRegisterChange = (e) => {
    const { id, value } = e.target;
    setRegisterData({
      ...registerData,
      [id.replace('reg-', '')]: value
    });
  };

  // Form submission handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await API.post("/students/login", { email: loginEmail, password: loginPassword });
      if (res?.data) navigate("/dashboard");
    } catch (err) {
      console.error("Login Error:", err);
      setLoginError(err.response?.data?.message || "Login failed. Please check your credentials.");
    }
  };

  const handleGoogleLogin = async (response) => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/v1/auth/google`, 
        { credential: response.credential },
        { withCredentials: true }
      );
      if (res.status === 200) navigate("/dashboard");
    } catch (error) {
      console.error('Google Login Error:', error);
      setLoginError("Google login failed. Please try again.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");
    try {
      await API.post("/students/register", registerData);
      setRegisterSuccess("Verification mail sent successfully. Please check your email.");
    } catch (err) {
      console.error("Registration Error:", err);
      setRegisterError(err.response?.data?.message || "Registration failed. Please check your details.");
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    try {
      const res = await API.post("/students/reset-password-request", { email: forgotEmail });
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
          
          {/* Right section with login/register forms */}
          <div className="auth-form-section">
            <div className="auth-box">
              <div className="auth-toggle">
                <button
                  className={isLogin && !isForgotPassword ? "active" : ""}
                  onClick={() => {
                    setIsLogin(true);
                    setIsForgotPassword(false);
                  }}
                >
                  Sign In
                </button>
                <button
                  className={!isLogin ? "active" : ""}
                  onClick={() => {
                    setIsLogin(false);
                    setIsForgotPassword(false);
                  }}
                >
                  Register
                </button>
              </div>
              
              {isLogin ? (
                isForgotPassword ? (
                  <form onSubmit={handleForgotPassword} className="auth-form">
                    <h2>Reset Password</h2>
                    {forgotError && <p className="error">{forgotError}</p>}
                    {forgotSuccess && <p className="success">{forgotSuccess}</p>}
                    <div className="form-group">
                      <label htmlFor="forgot-email">Email Address</label>
                      <input
                        id="forgot-email"
                        type="email"
                        placeholder="Enter your institutional email"
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
                ) : (
                  <form onSubmit={handleLogin} className="auth-form">
                    <h2>Student Sign In</h2>
                    {loginError && <p className="error">{loginError}</p>}
                    <div className="form-group">
                      <label htmlFor="login-email">Email Address</label>
                      <input
                        id="login-email"
                        type="email"
                        placeholder="Enter your institutional email"
                        value={loginEmail}
                        onChange={handleLoginChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="login-password">Password</label>
                      <input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={handleLoginChange}
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
                        onSuccess={handleGoogleLogin}
                        onError={(error) => {
                          console.error("Google Login Error:", error);
                          setLoginError("Google login failed. Please try again.");
                        }}
                        useOneTap
                        text="sign_in_with"
                        shape="rectangular"
                        width="100%"
                      />
                    </div>
                  </form>
                )
              ) : (
                <form onSubmit={handleRegister} className="auth-form register-form">
                  <h2>Student Registration</h2>
                  {registerError && <p className="error">{registerError}</p>}
                  {registerSuccess && <p className="success">{registerSuccess}</p>}
                  
                  <div className="scrollable-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="reg-name">Full Name</label>
                        <input 
                          id="reg-name"
                          type="text" 
                          placeholder="Full name" 
                          value={registerData.name} 
                          onChange={handleRegisterChange} 
                          required 
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="reg-email">Email</label>
                        <input 
                          id="reg-email"
                          type="email" 
                          placeholder="Institutional email" 
                          value={registerData.email} 
                          onChange={handleRegisterChange} 
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="reg-dateOfBirth">Date of Birth</label>
                        <input 
                          id="reg-dateOfBirth"
                          type="date" 
                          value={registerData.dateOfBirth} 
                          onChange={handleRegisterChange} 
                          required 
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="reg-gender">Gender</label>
                        <select 
                          id="reg-gender"
                          value={registerData.gender} 
                          onChange={handleRegisterChange} 
                          required
                        >
                          <option value="M">Male</option>
                          <option value="F">Female</option>
                          <option value="O">Other</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="reg-phoneNumber">Phone</label>
                        <input 
                          id="reg-phoneNumber"
                          type="tel" 
                          placeholder="Phone number" 
                          value={registerData.phoneNumber} 
                          onChange={handleRegisterChange} 
                          required 
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="reg-rollNo">Roll No.</label>
                        <input 
                          id="reg-rollNo"
                          type="text" 
                          placeholder="Roll number" 
                          value={registerData.rollNo} 
                          onChange={handleRegisterChange} 
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="reg-department">Department</label>
                        <input 
                          id="reg-department"
                          type="text" 
                          placeholder="Department" 
                          value={registerData.department} 
                          onChange={handleRegisterChange} 
                          required 
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="reg-degree">Degree</label>
                        <input 
                          id="reg-degree"
                          type="text" 
                          placeholder="Degree program" 
                          value={registerData.degree} 
                          onChange={handleRegisterChange} 
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="reg-password">Password</label>
                      <input 
                        id="reg-password"
                        type="password" 
                        placeholder="Create a secure password" 
                        value={registerData.password} 
                        onChange={handleRegisterChange} 
                        required 
                      />
                    </div>
                  </div>
                  
                  <button type="submit">Register Account</button>
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
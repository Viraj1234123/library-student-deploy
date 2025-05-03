import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../api";
import "./Login.css"; // Reusing the same CSS
import image from "../assets/login.jpg";
import libraryLogo from "../assets/logo.jpg";
import Alert from "../components/Alert"; // Import the Alert component

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const [token, setToken] = useState("");
  
  // Alert state
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "error"
  });

  const navigate = useNavigate();
  const location = useLocation();

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

  // Extract token from URL on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlToken = searchParams.get("token");

    if (urlToken) {
      setToken(urlToken);
      // Optional: Validate token before showing form
      // verifyToken(urlToken);
    } else {
      setTokenValid(false);
      showAlert("Reset token is missing. Please use the link from your email.");
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dismissAlert();

    if (password.length < 8) {
      showAlert("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      showAlert("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Try student reset first
      const res = await API.patch("/students/reset-password", {
        token,
        password
      });

      showAlert("Password has been reset successfully!", "success");
      setLoading(false);
      
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      // If student reset fails, try admin reset
      try {
        const res = await API.patch("/admins/reset-password", {
          token,
          password
        });
        showAlert("Password has been reset successfully!", "success");
        setLoading(false);

        setTimeout(() => {
          navigate("/");
        }, 2000);

      } catch (err) {
        if (err.response?.data === "jwt expired") {
          showAlert("Reset password link has expired");
        }
        else showAlert("Password reset failed. Please try again.");
        setLoading(false);
      }
    }
  };

  return (
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

        {/* Right section with password reset form */}
        <div className="auth-form-section">
          <div className="auth-box">
            <div className="auth-toggle">
              <button className="active">
                Reset Password
              </button>
            </div>

            {!tokenValid ? (
              <div className="auth-form">
                <h2>Invalid Reset Link</h2>
                <p className="back-to-login" onClick={() => navigate("/")}>
                  Return to Sign In
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="auth-form">
                <h2>Reset Your Password</h2>

                <div className="form-group">
                  <label htmlFor="new-password">New Password</label>
                  <input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    maxLength={100}
                    pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$"
                    title="Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirm-password">Confirm Password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    validate={password === confirmPassword}
                    pattern={password}
                    title="Passwords must match."
                  />
                </div>

                <button type="submit" disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password"}
                </button>

                <p className="back-to-login" onClick={() => navigate("/")}>
                  Return to Sign In
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
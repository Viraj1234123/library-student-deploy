import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api"; // Assuming this is the same API used in Dashboard
import "../pages/Dashboard.css"; // Import the relevant CSS

const MobileHeader = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth <= 768);
  const [userName, setUserName] = useState("");
  const [showProfileDropdownMobile, setShowProfileDropdownMobile] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "error",
  });

  const profileDropdownRef = useRef(null);

  // Fetch user profile when the component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await API.get("/students/current-student");
        const userData = response.data.data;
        setUserName(userData.name || "Student");
        setUserProfile(userData);
      } catch (error) {
        console.error("Error fetching user profile", error);
        setAlert({
          show: true,
          message: "Failed to load user profile",
          type: "error",
        });
      }
    };

    fetchUserProfile();

    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdownMobile(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    // Emit an event or use a context to notify the parent (Dashboard) about sidebar state change
    // For simplicity, we'll assume Dashboard listens to this state change elsewhere
    window.dispatchEvent(new CustomEvent("toggleSidebar", { detail: { isCollapsed: !isCollapsed } }));
  };

  const toggleProfileDropdownMobile = () => {
    setShowProfileDropdownMobile(!showProfileDropdownMobile);
  };

  const handleLogout = async () => {
    try {
      await API.post("/students/logout");
      setAlert({
        show: true,
        message: "Logged out successfully",
        type: "success",
      });
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      console.error("Error during logout", error);
      setAlert({
        show: true,
        message: "Failed to logout properly",
        type: "warning",
      });
      setTimeout(() => {
        navigate("/");
      }, 1000);
    }
  };

  return (
    <div className="mobile-header">
      <button className="toggle-btn" onClick={toggleSidebar}>
        <span className="hamburger-icon">☰</span>
      </button>
      <div className="mobile-header-text">Nalanda Library</div>
      <div className="profile-actions" ref={profileDropdownRef}>
        <button className="profile-btn" onClick={toggleProfileDropdownMobile}>
          <span className="profile-initial">{userName.charAt(0)}</span>
        </button>
        {showProfileDropdownMobile && (
          <div className="profile-dropdown">
            <div className="profile-header">
              <div className="profile-avatar">
                <span className="profile-initial-large">{userName.charAt(0)}</span>
              </div>
              <div className="profile-info">
                <h3>{userName}</h3>
                <p>{userProfile?.email || "No email available"}</p>
              </div>
            </div>
            <div className="profile-details">
              <div className="profile-detail-item">
                <span className="detail-label">Roll Number:</span>
                <span className="detail-value">{userProfile?.rollNo || "N/A"}</span>
              </div>
              <div className="profile-detail-item">
                <span className="detail-label">Department:</span>
                <span className="detail-value">
                  {userProfile?.department === "Not set" ? "N/A" : userProfile?.department || "N/A"}
                </span>
              </div>
              <div className="profile-detail-item">
                <span className="detail-label">Degree:</span>
                <span className="detail-value">
                  {userProfile?.degree === "Not set" ? "N/A" : userProfile?.degree || "N/A"}
                </span>
              </div>
              <div className="profile-detail-item">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">
                  {userProfile?.phoneNumber === userProfile?.email
                    ? "N/A"
                    : userProfile?.phoneNumber || "N/A"}
                </span>
              </div>
            </div>
            <div className="profile-actions-footer">
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileHeader;
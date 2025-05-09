import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Slider from "react-slick";
import API from "../api";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Dashboard.css";
import Sidebar from "../components/Sidebar";
import Alert from "../components/Alert";
import MobileHeader from "../components/MobileHeader";
import ProfileButton from "../components/ProfileButton";

const Dashboard = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth <= 768);
  const [userName, setUserName] = useState("");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [formData, setFormData] = useState({
    department: "",
    degree: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "M",
    password: "",
  });
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "error",
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const profileDropdownRef = useRef(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await API.get("/announcements/get-all");
        setAnnouncements(response.data.data);
      } catch (error) {
        console.error("Error fetching announcements", error);
        setAlert({
          show: true,
          message: "Failed to load announcements",
          type: "error",
        });
      }
    };

    const fetchUserProfile = async () => {
      try {
        const response = await API.get("/students/current-student");
        const userData = response.data.data;
        setUserName(userData.name || "Student");
        setUserProfile(userData);

        const isProfileIncomplete =
          !userData.department ||
          userData.department === "Not set" ||
          !userData.degree ||
          userData.degree === "Not set" ||
          !userData.phoneNumber ||
          userData.phoneNumber === userData.email ||
          !userData.dateOfBirth ||
          !userData.gender;

        if (isProfileIncomplete) {
          setShowProfileCompletion(true);
          setFormData({
            department: userData.department !== "Not set" ? userData.department : "",
            degree: userData.degree !== "Not set" ? userData.degree : "",
            phoneNumber: userData.phoneNumber !== userData.email ? userData.phoneNumber : "",
            semester: userData.semester || "",
            dateOfBirth: userData.dateOfBirth || "",
            gender: userData.gender || "",
            password: "",
          });
        }
      } catch (error) {
        console.error("Error fetching user profile", error);
        navigate("/");
        setAlert({
          show: true,
          message: "Failed to load user profile",
          type: "error",
        });
      }
    };

    fetchAnnouncements();
    fetchUserProfile();

    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setIsCollapsed(true);
      }
    };

    // Listen for sidebar toggle event from MobileHeader
    const handleSidebarToggle = (event) => {
      setIsCollapsed(event.detail.isCollapsed);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("toggleSidebar", handleSidebarToggle);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("toggleSidebar", handleSidebarToggle);
    };
  }, []);

  useEffect(() => {
    // Broadcast current sidebar state to all components
    window.dispatchEvent(new CustomEvent("toggleSidebar", { 
      detail: { isCollapsed: isCollapsed } 
    }));
  }, [isCollapsed]);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    fade: true,
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "phoneNumber") {
      const numericValue = value.replace(/\D/g, "");
      const truncatedValue = numericValue.slice(0, 10);
      setFormData({
        ...formData,
        [name]: truncatedValue,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (formData.phoneNumber && formData.phoneNumber.length !== 10) {
      setAlert({
        show: true,
        message: "Phone number must be exactly 10 digits",
        type: "error",
      });
      return;
    }

    const updateData = {};
    if (!userProfile.department || userProfile.department === "Not set") {
      updateData.department = formData.department;
    }
    if (!userProfile.degree || userProfile.degree === "Not set") {
      updateData.degree = formData.degree;
    }
    if (!userProfile.phoneNumber || userProfile.phoneNumber === userProfile.email) {
      updateData.phoneNumber = formData.phoneNumber;
    }
    if (formData.dateOfBirth) {
      const date = new Date(formData.dateOfBirth);
      const formattedDate = date.toISOString().split("T")[0];
      updateData.dateOfBirth = formattedDate;
    }
    if (formData.gender) {
      updateData.gender = formData.gender;
    }
    if (!userProfile.password) {
      updateData.password = formData.password;
    }

    try {
      await API.patch("/students/update-profile", updateData);
      setUserProfile({
        ...userProfile,
        ...updateData,
      });
      setShowProfileCompletion(false);
      setAlert({
        show: true,
        message: "Profile updated successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error updating profile", error);
      setAlert({
        show: true,
        message: "Failed to update profile. Please try again.",
        type: "error",
      });
    }
  };

  const handleSkipProfile = () => {
    setShowProfileCompletion(false);
  };

  const dismissAlert = () => {
    setAlert({
      ...alert,
      show: false,
    });
  };

  const isFieldComplete = (fieldName) => {
    if (!userProfile) return false;
    switch (fieldName) {
      case "department":
        return userProfile.department && userProfile.department !== "Not set";
      case "degree":
        return userProfile.degree && userProfile.degree !== "Not set";
      case "phoneNumber":
        return userProfile.phoneNumber && userProfile.phoneNumber !== userProfile.email;
      case "semester":
        return !!userProfile.semester;
      default:
        return false;
    }
  };

  const FloatingAnnouncements = ({ announcements }) => {
    const [visibleAnnouncements, setVisibleAnnouncements] = useState([]);
    const containerRef = useRef(null);
    const sRef = useRef(0);

    const containerHeight = 400;
    const itemHeight = 120;
    const gap = 20;
    const spacing = itemHeight + gap;
    const animationSpeed = 20;
    const intervalTime = 100;

    useEffect(() => {
      if (!announcements || announcements.length === 0) return;

      const N = announcements.length;
      let idCounter = 0;

      const interval = setInterval(() => {
        sRef.current += animationSpeed * (intervalTime / 1000);
        const currentS = sRef.current;

        const minM = Math.ceil((currentS - itemHeight) / spacing);
        const maxM = Math.floor((currentS + containerHeight) / spacing);

        const newVisible = [];
        for (let m = minM; m <= maxM; m++) {
          const index = (m % N + N) % N;
          const announcement = announcements[index];
          const position = m * spacing - currentS;

          let opacity = 1;
          if (position < 50) {
            opacity = Math.max(0, position / 50);
          } else if (position > containerHeight - itemHeight) {
            opacity = Math.min(1, (containerHeight - position) / 50);
          }

          newVisible.push({
            announcement,
            position,
            opacity,
            id: `${announcement._id}-${m}`,
          });
        }

        setVisibleAnnouncements(newVisible);
      }, intervalTime);

      return () => clearInterval(interval);
    }, [announcements]);

    if (!announcements || announcements.length === 0) {
      return (
        <div className="floating-announcements-container">
          <div className="floating-announcements-heading">Announcements</div>
          <div className="empty-state" style={{ height: "calc(100% - 40px)" }}>
            <span className="empty-icon">📢</span>
            <p>No announcements available at the moment</p>
          </div>
        </div>
      );
    }

    return (
      <div className="floating-announcements-container" ref={containerRef}>
        <div className="floating-announcements-heading">Announcements</div>
        <div className="floating-announcements-wrapper">
          {visibleAnnouncements.map((item) => (
            <div
              key={item.id}
              className="floating-announcement-item"
              style={{
                transform: `translateY(${item.position}px)`,
                opacity: item.opacity,
                transition: "opacity 0.3s ease-in-out",
              }}
            >
              <h3>{item.announcement.title}</h3>
              <p>{item.announcement.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  return (
    <div className={`dashboard-container ${isCollapsed ? "sidebar-collapsed" : ""} `}>
      <Alert
        message={alert.message}
        type={alert.type}
        show={alert.show}
        onDismiss={dismissAlert}
        autoDismissTime={5000}
      />

      <MobileHeader /> {/* No parameters passed */}

      <Sidebar isCollapsed={isCollapsed} toggleSidebar={() => setIsCollapsed(!isCollapsed)} activeItem="dashboard" />

      <div className={`main-content ${!isCollapsed && window.innerWidth <= 768 ? "blurred" : ""}`}>
        <div className="dashboard-header">
          <div className="greeting">Hello, {userName}! 👋</div>
          <div className="profile-actions" ref={profileDropdownRef}>
            <ProfileButton/>
          </div>
        </div>

        <div className="announcement-slider-container">
          {announcements.length > 0 ? (
            <Slider {...settings}>
              {announcements.map((announcement) => (
                <div key={announcement._id} className="announcement-slide">
                  <img src={announcement.imageLink} alt={announcement.title} className="announcement-image" />
                  {!isMobile && (
                    <div className="announcement-text">
                      <h3>{announcement.title}</h3>
                      <p>{announcement.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </Slider>
          ) : (
            <div className="no-announcements">
              <div className="empty-state">
                <span className="empty-icon">📢</span>
                <p>No announcements available at the moment</p>
              </div>
            </div>
          )}
        </div>

        <FloatingAnnouncements announcements={announcements} />

        {showProfileCompletion && (
          <div className="profile-completion-overlay">
            <div className="profile-completion-form">
              <h3>{userProfile?.dateOfBirth && userProfile?.gender ? "Edit Profile" : "Complete Your Profile"}</h3>
              <form onSubmit={handleProfileSubmit}>
                {!isFieldComplete("department") && (
                  <div className="form-field">
                    <label htmlFor="department">Department</label>
                    <select
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Department</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Artificial Intelligence">Artificial Intelligence</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Chemical Engineering">Chemical Engineering</option>
                      <option value="Biotechnology">Biotechnology</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Mathematics">Mathematics</option>
                    </select>
                  </div>
                )}
                {!isFieldComplete("degree") && (
                  <div className="form-field">
                    <label htmlFor="degree">Degree</label>
                    <select
                      id="degree"
                      name="degree"
                      value={formData.degree}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Degree</option>
                      <option value="B.Tech">B.Tech</option>
                      <option value="M.Tech">M.Tech</option>
                      <option value="PhD">PhD</option>
                      <option value="B.Sc">B.Sc</option>
                      <option value="M.Sc">M.Sc</option>
                    </select>
                  </div>
                )}
                {!isFieldComplete("phoneNumber") && (
                  <div className="form-field">
                    <label htmlFor="phoneNumber">Phone Number</label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="Enter your 10-digit phone number"
                      pattern="[0-9]{10}"
                      title="Phone number must be exactly 10 digits"
                      required
                    />
                    {formData.phoneNumber && formData.phoneNumber.length !== 10 && (
                      <span className="validation-error">Phone number must be exactly 10 digits</span>
                    )}
                  </div>
                )}
                <div className="form-field">
                  <label htmlFor="dateOfBirth">Date of Birth</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={8}
                    maxLength={100}
                    pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$"
                    title="Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number."
                    placeholder="Enter password which you can use to login"
                  />
                </div>
                <div className="form-actions">
                  
                  <button type="submit" className="save-profile-btn">
                    Save Profile
                  </button>
                  <button type="button" className="skip-btn" onClick={handleSkipProfile}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Slider from "react-slick";
import API from "../api";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Dashboard.css";
import Sidebar from "../components/Sidebar";

const Dashboard = () => {
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState([]);
    const [isCollapsed, setIsCollapsed] = useState(false);
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
        password: ""
    });
    
    const profileDropdownRef = useRef(null);
    
    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const response = await API.get("/announcements/get-all");
                setAnnouncements(response.data.data);
            } catch (error) {
                console.error("Error fetching announcements", error);
            }
        };
        
        const fetchUserProfile = async () => {
            try {
                const response = await API.get("/students/current-student");
                const userData = response.data.data;
                setUserName(userData.name || "Student");
                setUserProfile(userData);
                
                // Check if profile is incomplete
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
                    // Pre-fill the form with existing data
                    setFormData({
                        department: userData.department !== "Not set" ? userData.department : "",
                        degree: userData.degree !== "Not set" ? userData.degree : "",
                        phoneNumber: userData.phoneNumber !== userData.email ? userData.phoneNumber : "",
                        semester: userData.semester || "",
                        dateOfBirth: userData.dateOfBirth || "",
                        gender: userData.gender || "",
                        password: ""
                    });
                }
            } catch (error) {
                console.error("Error fetching user profile", error);
            }
        };
        
        fetchAnnouncements();
        fetchUserProfile();

        // Click outside to close profile dropdown
        const handleClickOutside = (event) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    const handleLogout = async () => {
        try {
            await API.post("/students/logout");
            navigate("/");
        } catch (error) {
            console.error("Error during logout", error);
            navigate("/");
        }
    };

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    const toggleProfileDropdown = () => {
        setShowProfileDropdown(!showProfileDropdown);
    };
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };
    
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        
        // Prepare data for submission - only include fields that need updating
        const updateData = {};
        
        // Only include empty or new fields
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
            const formattedDate = date.toISOString().split('T')[0]; // This will give yyyy-MM-dd
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
            // Update local state with new profile data
            setUserProfile({
                ...userProfile,
                ...updateData
            });
            setShowProfileCompletion(false);
        } catch (error) {
            console.error("Error updating profile", error);
            alert("Failed to update profile. Please try again.");
        }
    };
    
    const handleSkipProfile = () => {
        setShowProfileCompletion(false);
    };

    // Check if a field is complete and should be read-only
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

    return (
        <div className={`dashboard-container ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
            {/* Use the Sidebar component */}
            <Sidebar 
                isCollapsed={isCollapsed} 
                toggleSidebar={toggleSidebar}
                activeItem="dashboard"
            />

            {/* Main Content */}
            <div className="main-content">
                {/* Header section with profile buttons */}
                <div className="dashboard-header">
                    <div className="greeting">
                        Hello, {userName}! 👋
                    </div>
                    <div className="profile-actions" ref={profileDropdownRef}>
                        <button className="profile-btn" onClick={toggleProfileDropdown}>
                            <span className="profile-initial">{userName.charAt(0)}</span>
                        </button>
                        {showProfileDropdown && (
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
                                        <span className="detail-value">{userProfile?.department === "Not set" ? "N/A" : userProfile?.department || "N/A"}</span>
                                    </div>
                                    <div className="profile-detail-item">
                                        <span className="detail-label">Degree:</span>
                                        <span className="detail-value">{userProfile?.degree === "Not set" ? "N/A" : userProfile?.degree || "N/A"}</span>
                                    </div>
                                    <div className="profile-detail-item">
                                        <span className="detail-label">Phone:</span>
                                        <span className="detail-value">{userProfile?.phoneNumber === userProfile?.email ? "N/A" : userProfile?.phoneNumber || "N/A"}</span>
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

                {/* Announcement Slider */}
                <div className="announcement-slider-container">
                    {announcements.length > 0 ? (
                        <Slider {...settings}>
                            {announcements.map((announcement) => (
                                <div key={announcement._id} className="announcement-slide">
                                    <img src={announcement.imageLink} alt={announcement.title} className="announcement-image" />
                                    <div className="announcement-text">
                                        <h3>{announcement.title}</h3>
                                        <p>{announcement.description}</p>
                                    </div>
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

                {/* Library Info Section REMOVED */}
            </div>
            
            {/* Profile Completion Form */}
            {showProfileCompletion && (
                <div className="profile-completion-overlay">
                    <div className="profile-completion-form">
                        <h3>{userProfile?.dateOfBirth && userProfile?.gender ? "Edit Profile" : "Complete Your Profile"}</h3>
                        <form onSubmit={handleProfileSubmit}>
                            {/* Form fields remain the same */}
                            {/* ... (previous form code unchanged) ... */}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
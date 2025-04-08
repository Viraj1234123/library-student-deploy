import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Alert from '../components/Alert';

const ProfileButton = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState("");
    const [userProfile, setUserProfile] = useState(null);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const profileDropdownRef = useRef(null);
    const [alert, setAlert] = useState({
        show: false,
        message: "",
        type: "error"
    });

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await API.get("/students/current-student");
                const userData = response.data.data;
                setUserName(userData.name || "Student");
                setUserProfile(userData);
            } catch (error) {
                console.error("Error fetching user profile", error);
                showAlert("Failed to load profile information", "error");
            }
        };

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

    const showAlert = (message, type = "error") => {
        setAlert({
            show: true,
            message,
            type
        });
    };

    const hideAlert = () => {
        setAlert(prev => ({ ...prev, show: false }));
    };

    const handleLogout = async () => {
        try {
            await API.post("/students/logout");
            showAlert("Logged out successfully", "success");
            setTimeout(() => {
                navigate("/");
            }, 1000);
        } catch (error) {
            showAlert("Failed to logout properly", "warning");
            setTimeout(() => {
                navigate("/");
            }, 2000);
        }
    };

    const toggleProfileDropdown = () => {
        setShowProfileDropdown(!showProfileDropdown);
    };

    return (
        <>
            <Alert 
                show={alert.show}
                type={alert.type}
                message={alert.message}
                onDismiss={hideAlert}
                autoDismissTime={3000}
            />
            
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
                                    {userProfile?.phoneNumber === userProfile?.email ? "N/A" : userProfile?.phoneNumber || "N/A"}
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
        </>
    );
};

export default ProfileButton;
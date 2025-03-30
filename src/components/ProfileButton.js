import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const ProfileButton = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState("");
    const [userProfile, setUserProfile] = useState(null);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const profileDropdownRef = useRef(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await API.get("/students/current-student");
                const userData = response.data.data;
                setUserName(userData.name || "Student");
                setUserProfile(userData);
            } catch (error) {
                console.error("Error fetching user profile", error);
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

    const handleLogout = async () => {
        try {
            await API.post("/students/logout");
            navigate("/");
        } catch (error) {
            console.error("Error during logout", error);
            navigate("/");
        }
    };

    const toggleProfileDropdown = () => {
        setShowProfileDropdown(!showProfileDropdown);
    };

    return (
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
    );
};

export default ProfileButton;
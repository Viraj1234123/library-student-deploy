import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Sidebar.css";
import API from "../api";

const Sidebar = ({ isCollapsed, toggleSidebar, activeItem, onLogout }) => {
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  
  const handleLogout = async () => {
    try {
      await API.post("/students/logout");
      navigate("/");
    } catch (error) {
      console.error("Error during logout", error);
      navigate("/");
    }
  };

  // Function to handle clicks outside the sidebar on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only run this for mobile screens (you can adjust the width as needed)
      if (window.innerWidth <= 768) {
        // Check if sidebar is open and the click is outside
        if (!isCollapsed && 
            sidebarRef.current && 
            !sidebarRef.current.contains(event.target)) {
          toggleSidebar();
        }
      }
    };

    // Add event listener when component mounts
    document.addEventListener("mousedown", handleClickOutside);
    
    // Remove event listener when component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCollapsed, toggleSidebar]);
 
  const openFloorPlan = () => {
    window.open("https://www.iitrpr.ac.in/library/floor_plan.php", "_blank");
  };

  return (
    <div 
      ref={sidebarRef}
      className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
    >
      <div className="sidebar-header">
        <button className="toggle-btn" onClick={toggleSidebar}>
          <span className="hamburger-icon">☰</span>
        </button>
        {!isCollapsed && (
          <h2 className="sidebar-title">User Portal</h2>
        )}
      </div>
     
      <ul className="sidebar-menu">
        <li
          className={activeItem === "dashboard" ? "active" : ""}
          onClick={() => navigate("/dashboard")}
        >
          <span className="menu-icon">🏠</span>
          {!isCollapsed && <span className="menu-text">Dashboard</span>}
        </li>
        <li
          className={activeItem === "seat-booking" ? "active" : ""}
          onClick={() => navigate("/seat-booking")}
        >
          <span className="menu-icon">💺</span>
          {!isCollapsed && <span className="menu-text">Seats</span>}
        </li>
        {/* <li
          className={activeItem === "books" ? "active" : ""}
          onClick={() => navigate("/book-issue-rating")}
        >
          <span className="menu-icon">📖</span>
          {!isCollapsed && <span className="menu-text">Books</span>}
        </li> */}
        <li
          className={activeItem === "complaints" ? "active" : ""}
          onClick={() => navigate("/complaints")}
        >
          <span className="menu-icon">📩</span>
          {!isCollapsed && <span className="menu-text">Grievances</span>}
        </li>
        <li
          className={activeItem === "article-request" ? "active" : ""}
          onClick={() => navigate("/article-request")}
        >
          <span className="menu-icon">📄</span>
          {!isCollapsed && <span className="menu-text">Request Article</span>}
        </li>
        <li
          className={activeItem === "my-articles" ? "active" : ""}
          onClick={() => navigate("/my-articles")}
        >
          <span className="menu-icon">📑</span>
          {!isCollapsed && <span className="menu-text">My Articles</span>}
        </li>
        <li
          className={activeItem === "bookings" ? "active" : ""}
          onClick={() => navigate("/profile")}
        >
          <span className="menu-icon">🗓️</span>
          {!isCollapsed && <span className="menu-text">Bookings</span>}
        </li>
        <li
          className={activeItem === "floor-plan" ? "active" : ""}
          onClick={openFloorPlan}
        >
          <span className="menu-icon">🗺️</span>
          {!isCollapsed && <span className="menu-text">Library Floor Plan</span>}
        </li>
      </ul>
     
      {/* Uncomment if you want to use the logout section
      <div className="sidebar-footer">
        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          <span className="menu-icon">🚪</span>
          {!isCollapsed && <span className="menu-text">Logout</span>}
        </button>
      </div>
      */}
    </div>
  );
};

export default Sidebar;
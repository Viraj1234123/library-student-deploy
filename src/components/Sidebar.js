import React from "react";
import { useNavigate } from "react-router-dom";
import "./Sidebar.css";
import API from "../api";

const Sidebar = ({ isCollapsed, toggleSidebar, activeItem, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
        await API.post("/students/logout");
        navigate("/");
    } catch (error) {
        console.error("Error during logout", error);
        navigate("/");
    }
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">
          {!isCollapsed && " Student Portal"}
          {isCollapsed && ""}
        </h2>
        <button className="toggle-btn" onClick={toggleSidebar}>
          <span className="hamburger-icon">☰</span>
        </button>
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
        <li
          className={activeItem === "books" ? "active" : ""}
          onClick={() => navigate("/book-issue-rating")}
        >
          <span className="menu-icon">📖</span>
          {!isCollapsed && <span className="menu-text">Books</span>}
        </li>
        <li
          className={activeItem === "complaints" ? "active" : ""}
          onClick={() => navigate("/complaints")}
        >
          <span className="menu-icon">📩</span>
          {!isCollapsed && <span className="menu-text">Complaints</span>}
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
      </ul>
      
      {/* <div className="sidebar-logout-section">
        <button 
          className="logout-btn" 
          onClick={handleLogout}
        >
          <span className="menu-icon">🚪</span>
          {!isCollapsed && <span className="menu-text">Logout</span>}
        </button>
      </div> */}
    </div>
  );
};

export default Sidebar;
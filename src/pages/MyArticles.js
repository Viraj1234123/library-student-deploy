import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import Sidebar from "../components/Sidebar";
import "./MyArticles.css";
import ProfileButton from "../components/ProfileButton";
import MobileHeader from "../components/MobileHeader"; // Import MobileHeader
import Alert from "../components/Alert"; // Import Alert

const MyArticles = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth <= 768); // Initial state based on screen size
  const [alertInfo, setAlertInfo] = useState({
    show: false,
    message: "",
    type: "error",
  });

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await API.get("/article-sharing/student");
        setArticles(response.data.data || response.data);
      } catch (err) {
        console.error("Error fetching articles:", err);
        setAlertInfo({
          show: true,
          message: "Failed to load your article requests. Please try again later.",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, []);

  // Listen for sidebar toggle event from MobileHeader
  useEffect(() => {
    const handleSidebarToggle = (event) => {
      setIsCollapsed(event.detail.isCollapsed);
    };

    window.addEventListener("toggleSidebar", handleSidebarToggle);

    // Cleanup the event listener on unmount
    return () => {
      window.removeEventListener("toggleSidebar", handleSidebarToggle);
    };
  }, []);

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleRequestNew = () => {
    navigate("/article-request");
  };

  const handleViewArticle = (id) => {
    navigate(`/article/${id}`);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    // Dispatch event to sync with MobileHeader
    window.dispatchEvent(new CustomEvent("toggleSidebar", { detail: { isCollapsed: !isCollapsed } }));
  };

  const dismissAlert = () => {
    setAlertInfo({ ...alertInfo, show: false });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "requested":
        return "status-pending";
      case "shared":
        return "status-fulfilled";
      case "rejected":
        return "status-rejected";
      default:
        return "status-pending";
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case "requested":
        return "pending";
      case "shared":
        return "fulfilled";
      case "rejected":
        return "rejected";
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateDaysRemaining = (validTill) => {
    if (!validTill) return 0;
    const today = new Date();
    const expiryDate = new Date(validTill);
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className={`dashboard-container ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      <Alert
        message={alertInfo.message}
        type={alertInfo.type}
        show={alertInfo.show}
        onDismiss={dismissAlert}
        autoDismissTime={5000}
      />

      <MobileHeader /> {/* Add MobileHeader here */}

      <Sidebar
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
        activeItem="my-articles"
      />

      <div className={`main-content ${!isCollapsed && window.innerWidth <= 768 ? "blurred" : ""}`}>
        <div className="my-articles-container">
          <div className="dashboard-header">
            <div className="heading_color">📂 My Article Requests</div>
            <div className="header-buttons">
              <button className="request-button" onClick={handleRequestNew}>
                + New Request
              </button>
              <ProfileButton />
            </div>
          </div>

          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading your articles...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="empty-state">
              <h2>No Article Requests Yet</h2>
              <p>You haven't requested any articles yet. Need something specific for your research?</p>
              <button onClick={handleRequestNew}>Request an Article</button>
            </div>
          ) : (
            <div className="articles-list">
              {articles.map((article) => {
                const daysRemaining = article.validTill ? calculateDaysRemaining(article.validTill) : 0;

                return (
                  <div key={article._id} className="article-card">
                    <div className="article-header">
                      <h2>{article.title}</h2>
                      <span className={`status-badge ${getStatusBadgeClass(article.status)}`}>
                        {getStatusDisplay(article.status)}
                      </span>
                    </div>

                    <div className="article-details">
                      {article.authors && <p><strong>Author(s):</strong> {article.authors}</p>}
                      {article.journal && <p><strong>Journal:</strong> {article.journal}</p>}
                      {article.publicationYear && <p><strong>Year:</strong> {article.publicationYear}</p>}
                      {article.DOI && <p><strong>DOI:</strong> {article.DOI}</p>}
                      <p><strong>Requested:</strong> {formatDate(article.requestedAt || article.createdAt)}</p>

                      {article.status === "shared" && article.sharedAt && (
                        <p><strong>Fulfilled:</strong> {formatDate(article.sharedAt)}</p>
                      )}

                      {article.validTill && (
                        <p className={daysRemaining < 3 ? "expiry-warning" : ""}>
                          <strong>Available until:</strong> {formatDate(article.validTill)}
                          {daysRemaining > 0 ? ` (${daysRemaining} days remaining)` : " (Expired)"}
                        </p>
                      )}
                    </div>

                    {article.additionalInfo && (
                      <div className="additional-info">
                        <p><strong>Additional Information:</strong></p>
                        <p>{article.additionalInfo}</p>
                      </div>
                    )}

                    {article.status === "shared" && (
                      <div className="article-actions">
                        <button
                          onClick={() => handleViewArticle(article._id)}
                          className="view-button"
                          disabled={daysRemaining === 0}
                        >
                          {daysRemaining > 0 ? "View Article" : "Access Expired"}
                        </button>
                      </div>
                    )}

                    {article.status === "requested" && (
                      <div className="article-status-message">
                        <p>Your request is being reviewed by library staff.</p>
                      </div>
                    )}

                    {article.status === "rejected" && (
                      <div className="article-status-message rejected">
                        <p><strong>Unable to fulfill:</strong> We couldn't find or access this article.</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyArticles;
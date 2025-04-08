import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "./Article.css";
import Sidebar from "../components/Sidebar";
import ProfileButton from "../components/ProfileButton";
import Alert from "../components/Alert";

const ArticleRequest = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("error"); // Can be "error", "warning", "success", "info"
  
  const [formData, setFormData] = useState({
    title: "",
    authors: "",
    journal: "",
    publicationYear: "",
    DOI: "",
    additionalInfo: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const displayAlert = (message, type = "error") => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await API.post("/article-sharing/request", formData);
      setSubmitted(true);
      setFormData({
        title: "",
        authors: "",
        journal: "",
        publicationYear: "",
        DOI: "",
        additionalInfo: ""
      });
      displayAlert("Article request submitted successfully!", "success");
    } catch (error) {
      console.error("Error submitting article request:", error);
      displayAlert("Failed to submit article request. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const dismissAlert = () => {
    setShowAlert(false);
  };

  return (
    <div className="dashboard-container article-request-container">
      {/* Alert Component */}
      <Alert 
        message={alertMessage}
        type={alertType}
        show={showAlert}
        onDismiss={dismissAlert}
        autoDismissTime={5000}
      />
      
      {/* Sidebar Component */}
      <Sidebar 
        isCollapsed={isCollapsed} 
        toggleSidebar={toggleSidebar}
        activeItem="article-request"
      />

      {/* Main Content */}
      <div className="main-content">
        <div className="dashboard-header">
          <div className="heading_color">📝 Request an Article</div>
          <ProfileButton />
        </div>

        {submitted ? (
          <div className="success-message">
            <h2>✅ Request Submitted Successfully!</h2>
            <p>
              Your article request has been submitted to the library staff. You will
              receive a notification when the article is available for download.
            </p>
            <div className="action-buttons">
              <button onClick={() => setSubmitted(false)}>Request Another Article</button>
              <button onClick={() => navigate("/my-articles")}>View My Requests</button>
            </div>
          </div>
        ) : (
          <div className="article-request-form-container">
            <div className="info-panel">
              <h3>How it works:</h3>
              <ol>
                <li>Fill out the form with as much information as possible</li>
                <li>Our librarians will locate the article from our subscriptions or partner libraries</li>
                <li>Once available, you can view the article for the given time limit</li>
                <li>Article requests are typically fulfilled within 1-3 business days</li>
              </ol>
              <p className="note">
                <strong>Note:</strong> Please ensure you're requesting articles for
                academic purposes in compliance with copyright laws.
              </p>
            </div>

            <form className="article-request-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">Article Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Enter the full title of the article"
                />
              </div>

              <div className="form-group">
                <label htmlFor="authors">Author(s)</label>
                <input
                  type="text"
                  id="authors"
                  name="authors"
                  value={formData.authors}
                  onChange={handleChange}
                  placeholder="e.g., Smith, J., Johnson, A."
                />
              </div>

              <div className="form-group">
                <label htmlFor="journal">Journal/Publication</label>
                <input
                  type="text"
                  id="journal"
                  name="journal"
                  value={formData.journal}
                  onChange={handleChange}
                  placeholder="e.g., Nature, Science, IEEE Transactions"
                />
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="publicationYear">Publication Year</label>
                  <input
                    type="text"
                    id="publicationYear"
                    name="publicationYear"
                    value={formData.publicationYear}
                    onChange={handleChange}
                    placeholder="e.g., 2023"
                  />
                </div>

                <div className="form-group half">
                  <label htmlFor="DOI">DOI *</label>
                  <input
                    type="text"
                    id="DOI"
                    name="DOI"
                    value={formData.DOI}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 10.1000/xyz123"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="additionalInfo">Additional Information</label>
                <textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleChange}
                  placeholder="Any other details that might help us locate the article"
                  rows="4"
                ></textarea>
              </div>

              <button
                type="submit"
                className="artice-submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleRequest;
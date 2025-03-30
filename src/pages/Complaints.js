import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import API from "../api";
import "./Complaints.css";
import ProfileButton from "../components/ProfileButton";

const Complaint = () => {
  const navigate = useNavigate();
  const [myComplaints, setMyComplaints] = useState([]);
  const [allComplaints, setAllComplaints] = useState([]);
  const [newComplaint, setNewComplaint] = useState({
    title: "",
    description: "",
    attachments: [], 
  });
  const [activeTab, setActiveTab] = useState("complaints");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formType, setFormType] = useState(null);

  useEffect(() => {
    fetchMyComplaints();
    fetchAllComplaints();
  }, []);

  const fetchMyComplaints = async () => {
    try {
      const res = await API.get("/students/get-my-complaints");
      setMyComplaints(res.data.data);
    } catch (err) {
      console.error("Error fetching my complaints:", err);
    }
  };

  const fetchAllComplaints = async () => {
    try {
      const res = await API.get("/complaints");
      setAllComplaints(res.data.data);
    } catch (err) {
      console.error("Error fetching all complaints:", err);
    }
  };

  const handleComplaintChange = (e) => {
    if (e.target.name === "attachments") {
      const files = Array.from(e.target.files);
      setNewComplaint({ ...newComplaint, attachments: files });
    } else {
      setNewComplaint({ ...newComplaint, [e.target.name]: e.target.value });
    }
    if (formErrors[e.target.name]) {
      setFormErrors({ ...formErrors, [e.target.name]: null });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!newComplaint.title) errors.title = "Title is required";
    if (!newComplaint.description) errors.description = "Description is required";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitComplaint = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("category", formType === "complaint" ? "Complaint" : "Feedback");
      formData.append("title", newComplaint.title);
      formData.append("description", newComplaint.description);
      
      newComplaint.attachments.forEach((file, index) => {
        formData.append(`files`, file);
      });

      const res = await API.post("/complaints/", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.status === 201) {
        const successElement = document.getElementById("submission-success");
        successElement.style.display = "flex";
        setTimeout(() => {
          successElement.style.display = "none";
        }, 3000);
        
        fetchMyComplaints();
        fetchAllComplaints();
        setNewComplaint({ title: "", description: "", attachments: [] });
        setFormType(null);
      } else {
        alert("Failed to submit");
      }
    } catch (err) {
      console.error("Error submitting:", err);
      alert("Error submitting");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  const getStatusBadge = (status) => {
    let badgeClass = "status-badge ";
    switch(status) {
      case "Pending":
        badgeClass += "status-pending";
        break;
      case "In Progress":
        badgeClass += "status-in-progress";
        break;
      case "Resolved":
        badgeClass += "status-resolved";
        break;
      case "Closed":
        badgeClass += "status-closed";
        break;
      default:
        badgeClass += "status-pending";
    }
    return <span className={badgeClass}>{status || "Pending"}</span>;
  };

  const renderComplaintsList = (complaints, isMyComplaints = false) => {
    if (complaints.length === 0) {
      return (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <p>{isMyComplaints ? "No personal submissions yet" : "No complaints found"}</p>
          <p className="empty-subtitle">Submit your first complaint or feedback!</p>
        </div>
      );
    }

    return (
      <div className="complaints-list-container">
        <div className="complaints-grid">
          {complaints.map((complaint, index) => (
            <div 
              key={index} 
              className={`complaint-card ${complaint.category === 'Feedback' ? 'feedback-card' : ''}`}
            >
              <div className="card-top">
                <span className="complaint-category">
                  {complaint.category || 'Complaint'}
                </span>
                {complaint.category !== 'Feedback' && getStatusBadge(complaint.status)}
              </div>
              <h3 className="complaint-title">{complaint.title}</h3>
              <p className="complaint-description">{complaint.description}</p>
              <div className="complaint-footer">
                <span className="complaint-date">
                  {new Date(complaint.createdAt).toLocaleDateString()}
                </span>
                {complaint.attachments && complaint.attachments.length > 0 && (
                  <div 
                    className="attachment-icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      complaint.attachments.forEach(attachment => {
                        window.open(attachment, '_blank');
                      });
                    }}
                    style={{ 
                      cursor: 'pointer',
                      userSelect: 'none',
                      display: 'inline-block',
                      padding: '0 5px'
                    }}
                  >
                    📎 {complaint.attachments.length}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      <Sidebar 
        isCollapsed={isCollapsed} 
        toggleSidebar={toggleSidebar} 
        activeItem="complaints" 
      />
      
      <div className="main-content">
        <div className="complaint-container">
          <div className="page-header repositioned">
            <h1>Complaints & Feedback</h1>
            <ProfileButton />
            {/* <p className="header-subtitle">Submit and track your submissions</p> */}
          </div>
          
          {/* Success message */}
          <div id="submission-success" className="success-message">
            <span className="success-icon">✓</span>
            <span>Your submission has been received successfully!</span>
          </div>

          {!formType && (
            <>
              <div className="complaint-tabs">
                <button 
                  className={`tab-btn ${activeTab === 'complaints' ? 'active' : ''}`}
                  onClick={() => setActiveTab('complaints')}
                >
                  <span className="tab-icon">📩</span>My Complaints
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
                  onClick={() => setActiveTab('feedback')}
                >
                  <span className="tab-icon">💬</span>My Feedback
                </button>
                <button 
                  className="tab-btn complaint-btn"
                  onClick={() => setFormType("complaint")}
                >
                  <span className="tab-icon">➕</span>File a Complaint
                </button>
                <button 
                  className="tab-btn feedback-btn"
                  onClick={() => setFormType("feedback")}
                >
                  <span className="tab-icon">➕</span>Share Feedback
                </button>
              </div>

              {activeTab === 'complaints' && 
                renderComplaintsList(myComplaints.filter(c => c.category !== 'Feedback'), true)
              }
              {activeTab === 'feedback' && 
                renderComplaintsList(myComplaints.filter(c => c.category === 'Feedback'), true)
              }
            </>
          )}

          {/* Complaint Form Card */}
          {formType && (
            <div className="complaint-form-card form-container">
              <div className="card-header">
                <h2>
                  {formType === "complaint" ? "Submit a New Complaint" : "Share Feedback"}
                </h2>
                <button className="back-button" onClick={() => setFormType(null)}>
                  <span>←</span> Back
                </button>
                {/* <span className="form-icon">{formType === "complaint" ? "📝" : "💬"}</span> */}
              </div>
              
              {/* Rest of the form remains the same */}
              <div className="complaint-form">
                <div className="form-group">
                  <label htmlFor="title">Title <span className="required">*</span></label>
                  <input
                    id="title"
                    type="text"
                    name="title"
                    placeholder={formType === "complaint" ? "Brief title for your complaint" : "Brief title for your feedback"}
                    value={newComplaint.title}
                    onChange={handleComplaintChange}
                    className={formErrors.title ? "error" : ""}
                  />
                  {formErrors.title && <span className="error-message">{formErrors.title}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">Description <span className="required">*</span></label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Please provide detailed information..."
                    rows="5"
                    value={newComplaint.description}
                    onChange={handleComplaintChange}
                    className={formErrors.description ? "error" : ""}
                  ></textarea>
                  {formErrors.description && <span className="error-message">{formErrors.description}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="attachments">Attachments</label>
                  <div className="file-upload-container">
                    <input
                      id="attachments"
                      type="file"
                      name="attachments"
                      onChange={handleComplaintChange}
                      className="file-input"
                      multiple
                    />
                    <div className="file-upload-text">
                      {newComplaint.attachments.length > 0 ? (
                        <span className="file-name">
                          {newComplaint.attachments.map(file => file.name).join(", ")}
                        </span>
                      ) : (
                        <span className="file-placeholder">Add files (optional)</span>
                      )}
                    </div>
                  </div>
                  <span className="file-instructions">
                    Upload multiple documents, images or other relevant files
                  </span>
                </div>
                
                <button 
                  className={`submit-button ${isSubmitting ? 'submitting' : ''}`} 
                  onClick={submitComplaint}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : `Submit ${formType === "complaint" ? "Complaint" : "Feedback"}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Complaint;
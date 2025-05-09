import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import API from "../api";
import "./Complaints.css";
import ProfileButton from "../components/ProfileButton";
import Alert from "../components/Alert";
import MobileHeader from "../components/MobileHeader"; // Import MobileHeader

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
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth <= 768); // Initial state based on screen size
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formType, setFormType] = useState(null);

  // Alert state
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("success");

  useEffect(() => {
    fetchMyComplaints();
    fetchAllComplaints();
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

  // Display alert function
  const displayAlert = (message, type) => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
  };

  // Dismiss alert function
  const dismissAlert = () => {
    setShowAlert(false);
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await API.get("/students/current-student");
      } catch (error) {
        console.error("Error fetching user profile", error);
        navigate("/");
      }
    };
    fetchUserProfile();
  }, []);

  const fetchMyComplaints = async () => {
    try {
      const res = await API.get("/students/get-my-complaints");
      setMyComplaints(res.data.data);
    } catch (err) {
      console.error("Error fetching my complaints:", err);
      displayAlert("Failed to fetch your grievances. Please try again.", "error");
    }
  };

  const fetchAllComplaints = async () => {
    try {
      const res = await API.get("/students/get-my-complaints");
      setAllComplaints(res.data.data);
    } catch (err) {
      console.error("Error fetching all complaints:", err);
      displayAlert("Failed to fetch grievances. Please try again.", "error");
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

      newComplaint.attachments.forEach((file) => {
        formData.append(`files`, file);
      });

      const res = await API.post("/complaints/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.status === 201) {
        displayAlert(
          `Your ${formType === "complaint" ? "grievance" : "feedback"} has been submitted successfully!`,
          "success"
        );

        fetchMyComplaints();
        fetchAllComplaints();
        setNewComplaint({ title: "", description: "", attachments: [] });
        setFormType(null);
      } else {
        displayAlert(`Failed to submit ${formType === "complaint" ? "grievance" : "feedback"}. Please try again.`, "error");
      }
    } catch (err) {
      console.error("Error submitting:", err);
      displayAlert(`Error submitting ${formType === "complaint" ? "grievance" : "feedback"}. Please try again later.`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    // Dispatch event to sync with MobileHeader
    window.dispatchEvent(new CustomEvent("toggleSidebar", { detail: { isCollapsed: !isCollapsed } }));
  };

  const getStatusBadge = (status) => {
    let badgeClass = "status-badge ";
    switch (status) {
      case "Pending":
      case "pending":
        badgeClass += "status-pending";
        break;
      case "In Progress":
      case "in progress":
        badgeClass += "status-in-progress";
        break;
      case "Resolved":
      case "resolved":
        badgeClass += "status-resolved";
        break;
      case "Closed":
      case "closed":
        badgeClass += "status-closed";
        break;
      default:
        badgeClass += "status-pending";
    }
    return <span className={badgeClass}>{status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending"}</span>;
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    const options = { hour: "2-digit", minute: "2-digit" };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  const formatDateTime = (dateString) => {
    return `${formatDate(dateString)} at ${formatTime(dateString)}`;
  };

  const renderComplaintsList = (complaints, isMyComplaints = false) => {
    if (complaints.length === 0) {
      return (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <p>{isMyComplaints ? "No personal submissions yet" : "No grievances found"}</p>
          <p className="empty-subtitle">Submit your first grievance or feedback!</p>
        </div>
      );
    }

    return (
      <div className="complaints-list-container">
        <div className="complaints-grid">
          {complaints.map((complaint, index) => (
            <div
              key={index}
              className={`complaint-card ${complaint.category === "Feedback" ? "feedback-card" : ""}`}
            >
              <div className="card-top">
                <span className="complaint-category">{complaint.category === "Complaint" ? "Grievance" : "Feedback" || "Grievance"}</span>
                {getStatusBadge(complaint.status)}
              </div>
              <h3 className="complaint-title">{complaint.title}</h3>
              <p className="complaint-description">{complaint.description}</p>

              <div className="complaint-timeline">
                <div className="timeline-item submission">
                  <div className="timeline-icon">📥</div>
                  <div className="timeline-content">
                    <div className="timeline-title">Submitted</div>
                    <div className="timeline-date">{formatDateTime(complaint.createdAt)}</div>
                  </div>
                </div>

                {(complaint.status === "resolved" || complaint.status === "Resolved") && complaint.resolvedAt && (
                  <div className="timeline-item resolution">
                    <div className="timeline-icon">✅</div>
                    <div className="timeline-content">
                      <div className="timeline-title">Resolved</div>
                      <div className="timeline-date">{formatDateTime(complaint.resolvedAt)}</div>
                    </div>
                  </div>
                )}
              </div>

              {complaint.comments && complaint.comments.length > 0 && (
                <div className="comments-section">
                  <h4 className="comments-header">Comments ({complaint.comments.length})</h4>
                  <div className="comments-list">
                    {complaint.comments.map((comment, commentIndex) => (
                      <div key={commentIndex} className="comment-item">
                        <div className="comment-content">{comment.comment}</div>
                        {comment.createdAt && (
                          <div className="comment-date">{formatDateTime(comment.createdAt)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="complaint-footer">
                {complaint.attachments && complaint.attachments.length > 0 && (
                  <div
                    className="attachment-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      complaint.attachments.forEach((attachment) => {
                        window.open(attachment, "_blank");
                      });
                    }}
                  >
                    📎 {complaint.attachments.length}{" "}
                    {complaint.attachments.length === 1 ? "Attachment" : "Attachments"}
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
    <div className="dashboard-container">
      <Alert
        message={alertMessage}
        type={alertType}
        show={showAlert}
        onDismiss={dismissAlert}
        autoDismissTime={5000}
      />

      <MobileHeader /> {/* Add MobileHeader here */}

      <Sidebar
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
        activeItem="complaints"
      />

      <div className={`main-content ${!isCollapsed && window.innerWidth <= 768 ? "blurred" : ""}`}>
        <div className="dashboard-header">
          <div className="heading_color">📩 Grievances & Feedback</div>
          <ProfileButton />
        </div>
        <div className="complaint-container">
          {!formType && (
            <>
              <div className="complaint-tabs">
                <button
                  className={`tab-btn ${activeTab === "complaints" ? "active" : ""}`}
                  onClick={() => setActiveTab("complaints")}
                >
                  <span className="tab-icon">📩</span>My Grievances
                </button>
                <button
                  className={`tab-btn ${activeTab === "feedback" ? "active" : ""}`}
                  onClick={() => setActiveTab("feedback")}
                >
                  <span className="tab-icon">💬</span>My Feedback
                </button>
                <button className="tab-btn complaint-btn" onClick={() => setFormType("complaint")}>
                  <span className="tab-icon">➕</span>Submit Grievance
                </button>
                <button className="tab-btn feedback-btn" onClick={() => setFormType("feedback")}>
                  <span className="tab-icon">➕</span>Submit Feedback
                </button>
              </div>

              {activeTab === "complaints" &&
                renderComplaintsList(myComplaints.filter((c) => c.category !== "Feedback"), true)}
              {activeTab === "feedback" &&
                renderComplaintsList(myComplaints.filter((c) => c.category === "Feedback"), true)}
            </>
          )}

          {formType && (
            <div className="complaint-form-card form-container">
              <div className="card-header">
                <h2>{formType === "complaint" ? "Submit a New Grievance" : "Share Feedback"}</h2>
                <button className="back-button" onClick={() => setFormType(null)}>
                  <span>←</span> Back
                </button>
              </div>

              <div className="complaint-form">
                <div className="form-group">
                  <label htmlFor="title">
                    Title <span className="required">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    name="title"
                    placeholder={formType === "complaint" ? "Brief title for your grievance" : "Brief title for your feedback"}
                    value={newComplaint.title}
                    onChange={handleComplaintChange}
                    className={formErrors.title ? "error" : ""}
                  />
                  {formErrors.title && <span className="error-message">{formErrors.title}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="description">
                    Description <span className="required">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Please provide detailed information..."
                    rows="5"
                    value={newComplaint.description}
                    onChange={handleComplaintChange}
                    className={formErrors.description ? "error" : ""}
                  ></textarea>
                  {formErrors.description && (
                    <span className="error-message">{formErrors.description}</span>
                  )}
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
                          {newComplaint.attachments.map((file) => file.name).join(", ")}
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
                  className={`submit-button ${isSubmitting ? "submitting" : ""}`}
                  onClick={submitComplaint}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Submitting..."
                    : `Submit ${formType === "complaint" ? "Grievance" : "Feedback"}`}
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
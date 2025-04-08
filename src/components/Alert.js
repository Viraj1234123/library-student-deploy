import { useEffect } from "react";
import "./Alert.css";

const Alert = ({ message, type = "error", show, onDismiss, autoDismissTime = 5000 }) => {
  useEffect(() => {
    if (show && autoDismissTime > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoDismissTime);
      
      return () => clearTimeout(timer);
    }
  }, [show, autoDismissTime, onDismiss]);

  if (!show) return null;

  return (
    <div className={`alert alert-${type}`}>
      <div className="alert-content">
        <span className="alert-icon">
          {type === "error" ? "" : 
           type === "warning" ? "" : 
           type === "success" ? "✅" : "ℹ️"}
        </span>
        <span className="alert-message">{message}</span>
      </div>
      <button className="alert-close" onClick={onDismiss}>×</button>
    </div>
  );
};

export default Alert;
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get("token"); // Extract token from URL

  const handleResetPassword = async () => {
    if (!email || !password || !confirmPassword) {
      setMessage("All fields are required!");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("Password reset successful! Redirecting...");
        setTimeout(() => navigate("/login"), 2000); // Redirect to login after 2 sec
      } else {
        setMessage(data.message || "Password reset failed.");
      }
    } catch (error) {
      setMessage("An error occurred. Try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">Reset Password</h2>
        
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />

        <button
          onClick={handleResetPassword}
          className="bg-green-500 text-white w-full py-2 rounded"
        >
          Reset Password
        </button>

        {message && <p className="mt-2 text-red-500 text-center">{message}</p>}

        <a href="/login" className="block text-blue-600 mt-4 text-center">
          Back to Login
        </a>
      </div>
    </div>
  );
};

export default ResetPassword;

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import BookIssueRating from "./pages/BookIssueRating";
import SeatBooking from "./pages/SeatBooking";
import Profile from "./pages/Profile";
import Complaint from "./pages/Complaints"
import ArticleRequestForm from "./pages/Article";
import MyArticles from "./pages/MyArticles";
import ArticleViewer from "./pages/ArticleViewer";
import ResetPassword from "./pages/ResetPassword";

const AppRoutes = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                {/* <Route path="/book-issue-rating" element={<BookIssueRating />} />  ✅ Unified Page */}
                <Route path="/seat-booking" element={<SeatBooking />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/complaints" element={<Complaint />} />
                <Route path="/article-request" element={<ArticleRequestForm />} />
                <Route path="/my-articles" element={<MyArticles />} />
                <Route path="/article/:id" element={<ArticleViewer />} />
                <Route path="/reset-password" element={<ResetPassword />} />
            </Routes>
        </Router>
    );
};

export default AppRoutes;

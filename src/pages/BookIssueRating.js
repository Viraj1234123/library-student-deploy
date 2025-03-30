import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "./BookIssueRating.css";
import Sidebar from "../components/Sidebar";
import Profile from "./Profile";
import ProfileButton from "../components/ProfileButton";

const BookIssueRating = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [newRating, setNewRating] = useState("");
  const [showRatingInput, setShowRatingInput] = useState(false);
  const [issued, setIssued] = useState(false);
  const [filterType, setFilterType] = useState("title");
  const [showRecommendationForm, setShowRecommendationForm] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const searchSectionRef = useRef(null);
  const [recommendationData, setRecommendationData] = useState({
    title: "",
    author: "",
    edition: "",
    subject: "",
    comments: "",
  });

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  useEffect(() => {
    setIsLoading(true);
    API.get("/books/get-all-books")
      .then((res) => {
        setBooks(res.data.data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching books:", err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (search.length > 0) {
      const results = books.filter((book) =>
        book[filterType].toLowerCase().includes(search.toLowerCase())
      );
      setFilteredBooks(results);
      setShowResults(true);
    } else {
      setFilteredBooks([]);
      setShowResults(false);
    }
  }, [search, books, filterType]);

  // Improved click-outside handler using ref
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchSectionRef.current && !searchSectionRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectBook = async (book) => {
    setSelectedBook(book);
    setSearch(book.title);
    setFilteredBooks([]); // Clear search results immediately
    setShowResults(false); // Explicitly hide results
    setShowRatingInput(false);
    setNewRating("");
    
    try {
      const checkRes = await API.get(`/get-book/${book._id}`);
      setIssued(checkRes.data.issued);

      const ratingRes = await API.get(`/ratings/${book._id}`);
      book.rating = ratingRes.data.rating;
      setSelectedBook({ ...book });
    } catch (error) {
      console.error("Error fetching book details:", error);
      setIssued(false);
    }
  };

  const handleIssue = async () => {
    try {
      await API.post("/issue-books/book-booking", { bookId: selectedBook._id });
      alert("Book issued successfully!");
      setIssued(true);
    } catch (error) {
      alert(error);
    }
  };

  const toggleRatingInput = () => {
    setShowRatingInput(!showRatingInput);
  };

  const handleRateBook = async () => {
    if (!newRating || newRating < 1 || newRating > 5) {
      alert("Please enter a rating between 1 and 5");
      return;
    }
    try {
      await API.post("/ratings", { bookId: selectedBook._id, rating: Number(newRating) });
      alert("Rating submitted successfully!");
      setNewRating("");
      setShowRatingInput(false);
      
      // Update the displayed rating
      const ratingRes = await API.get(`/ratings/${selectedBook._id}`);
      setSelectedBook({ ...selectedBook, rating: ratingRes.data.data.rating });
    } catch (error) {
      alert(error);
    }
  };

  const handleRecommendationChange = (e) => {
    const { name, value } = e.target;
    setRecommendationData({ ...recommendationData, [name]: value });
  };

  const handleRecommendationSubmit = async () => {
    if (!recommendationData.title || !recommendationData.author || !recommendationData.edition || !recommendationData.subject) {
      alert("Please fill all required fields");
      return;
    }
    try {
      await API.post("/book-recommendation/create", recommendationData);
      alert("Book recommendation submitted successfully!");
      setShowRecommendationForm(false);
      setRecommendationData({
        title: "",
        author: "",
        edition: "",
        subject: "",
        comments: "",
      });
    } catch (error) {
      alert("Error submitting recommendation");
      console.error(error);
    }
  };

  const focusSearch = () => {
    setShowResults(true);
  };

  return (
    <div className="app-container">
      <Sidebar 
        isCollapsed={isCollapsed} 
        toggleSidebar={toggleSidebar} 
        activeItem="books" 
      />
      
      <div className="book-container">
        <div className="page-header">
          <div className="header-left">
            <h1>📚 Library Catalog</h1>
            <p>Search, borrow, and rate books from our collection</p>

            <div className="search-section" ref={searchSectionRef}>
              <div className="search-container">
                <select onChange={(e) => setFilterType(e.target.value)} className="filter-dropdown">
                  <option value="title">Title</option>
                  <option value="author">Author</option>
                  <option value="subject">Subject</option>
                  <option value="cosubject">Co-subject</option>
                </select>

                <input
                  type="text"
                  placeholder={`Search by ${filterType}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={focusSearch}
                  className="search-input"
                />
              </div>

              {filteredBooks.length > 0 && showResults && (
                <ul className="search-results">
                  {filteredBooks.map((book) => (
                    <li key={book._id} onClick={() => handleSelectBook(book)}>
                      {book.title} - {book.author}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          <div className="header-right">
            
            <button className="recommend-btn" onClick={() => setShowRecommendationForm(true)}>
              Recommend a Book
            </button>
            <ProfileButton />
          </div>
        </div>

        {isLoading ? (
          <div className="loading-indicator">Loading library catalog...</div>
        ) : selectedBook ? (
          <div className="book-details-card">
            <div className="book-image-container">
              <img
                src={selectedBook.coverImage || "default-book.jpg"}
                alt="Book Cover"
                className="book-image"
              />
            </div>

            <div className="book-info">
              <h2 className="book-title">{selectedBook.title}</h2>
              <div className="book-metadata">
                <div className="metadata-item">
                  <span className="metadata-label">Author</span>
                  <span className="metadata-value">{selectedBook.author}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Available Copies</span>
                  <span className="metadata-value">{selectedBook.available_copies}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Rating</span>
                  <span className="metadata-value">
                    {selectedBook.rating ? (
                      <div className="star-rating">
                        <span className="rating-value">{selectedBook.rating.toFixed(1)}</span>
                        <div className="stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span 
                              key={star} 
                              className={`star ${star <= Math.round(selectedBook.rating) ? 'filled' : ''}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      "Not Rated Yet"
                    )}
                  </span>
                </div>
              </div>
              
              <div className="book-actions">
                <button 
                  className={`action-btn issue-btn ${issued ? 'disabled' : ''}`}
                  onClick={handleIssue} 
                  disabled={issued}
                >
                  {issued ? "Already Issued" : "Issue Book"}
                </button>
                <button 
                  className={`action-btn rate-btn ${showRatingInput ? 'active' : ''}`}
                  onClick={toggleRatingInput}
                >
                  {showRatingInput ? "Cancel Rating" : "Rate Book"}
                </button>
              </div>

              {showRatingInput && (
                <div className="rate-book-section">
                  <div className="rating-selector">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <span
                        key={rating}
                        className={`rating-star ${Number(newRating) >= rating ? 'selected' : ''}`}
                        onClick={() => setNewRating(rating)}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <button className="submit-rating-btn" onClick={handleRateBook}>
                    Submit Rating
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-illustration">📚</div>
            <h2>Find Your Next Great Read</h2>
            <p>Search for books by title, author, or subject using the search bar above.</p>
          </div>
        )}

        {showRecommendationForm && (
          <div className="recommendation-modal">
            <div className="recommendation-form">
              <h2>Recommend a Book</h2>
              <div className="form-group">
                <input
                  type="text"
                  name="title"
                  placeholder="Title"
                  value={recommendationData.title}
                  onChange={handleRecommendationChange}
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  name="author"
                  placeholder="Author"
                  value={recommendationData.author}
                  onChange={handleRecommendationChange}
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  name="edition"
                  placeholder="Edition"
                  value={recommendationData.edition}
                  onChange={handleRecommendationChange}
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  name="subject"
                  placeholder="Subject"
                  value={recommendationData.subject}
                  onChange={handleRecommendationChange}
                />
              </div>
              <div className="form-group">
                <textarea
                  name="comments"
                  placeholder="Comments (optional)"
                  value={recommendationData.comments}
                  onChange={handleRecommendationChange}
                />
              </div>
              <div className="form-actions">
                <button className="submit-btn" onClick={handleRecommendationSubmit}>Submit</button>
                <button className="cancel-btn" onClick={() => setShowRecommendationForm(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookIssueRating;
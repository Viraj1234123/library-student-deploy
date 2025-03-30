import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import Sidebar from "../components/Sidebar";
import "./Profile.css";
import ProfileButton from "../components/ProfileButton";

const Profile = () => {
  const navigate = useNavigate();
  const [issuedBooks, setIssuedBooks] = useState({
    booked: [],
    issued: [],
    returned: []
  });
  const [seatBookings, setSeatBookings] = useState({
    past: [],
    today: [],
    tomorrow: [],
  });
  const [activeTab, setActiveTab] = useState("issuedBooks");
  const [bookingView, setBookingView] = useState("today");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const categorizeBookings = (bookings) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      past: bookings.filter(booking => new Date(booking.endTime) < today),
      today: bookings.filter(booking => {
        const bookingStart = new Date(booking.startTime);
        return bookingStart >= today && bookingStart < tomorrow;
      }),
      tomorrow: bookings.filter(booking => {
        const bookingStart = new Date(booking.startTime);
        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
        return bookingStart >= tomorrow && bookingStart < dayAfterTomorrow;
      }),
    };
  };

  const categorizeBooks = (books) => {
    return {
      booked: books.filter(book => book.status === 'booked'),
      issued: books.filter(book => book.status === 'issued'),
      returned: books.filter(book => book.status === 'returned')
    };
  };

  useEffect(() => {
    // Fetch issued books for the logged-in student
    API.get("/students/get-issued-books")
      .then((res) => {
        let issuedData = res.data.data;
        if (issuedData && !Array.isArray(issuedData)) {
          issuedData = [issuedData];
        }

        Promise.all(
          issuedData.map(async (book) => {
            if (!book.title && book.bookId) {
              try {
                const bookRes = await API.get(`/books/get-book/${book.bookId}`);
                const bookDetails = bookRes.data.data;
                return { 
                  ...book, 
                  title: bookDetails.title,
                  author: bookDetails.author,
                  returnDate: book.returnDate || new Date(new Date(book.issueDate).setDate(new Date(book.issueDate).getDate() + 14))
                };
              } catch (err) {
                console.error("Error fetching title for book:", book.bookId, err);
                return book;
              }
            }
            return book;
          })
        ).then((updatedBooks) => {
          setIssuedBooks(categorizeBooks(updatedBooks));
        });
      })
      .catch((err) => console.error("Error fetching issued books:", err));

    // Fetch all seat bookings for the student
    API.get("/seat-bookings/get-all-of-student-with-seat-details")
      .then((res) => {
        const seatData = res.data.data || [];
        setSeatBookings(categorizeBookings(seatData));
      })
      .catch((err) => console.error("Error fetching seat bookings:", err));
  }, []);

  const handleCancelBooking = (bookingId) => {
    API.delete(`/seat-bookings/cancel-booking/${bookingId}`)
      .then(() => {
        alert("Booking cancelled successfully");
        setSeatBookings(prev => {
          const updatedBookings = { ...prev };
          Object.keys(updatedBookings).forEach(key => {
            updatedBookings[key] = updatedBookings[key].filter(booking => booking._id !== bookingId);
          });
          return updatedBookings;
        });
      })
      .catch((err) =>
        alert(err.response?.data?.message || "Error cancelling booking")
      );
  };

  const handleCancelIssuedBook = (bookingId) => {
    API.delete(`/issue-books/cancel/${bookingId}`)
      .then(() => {
        alert("Booked book cancelled successfully");
        setIssuedBooks(prev => {
          const updatedBooks = { ...prev };
          updatedBooks.booked = updatedBooks.booked.filter(book => book._id !== bookingId);
          return updatedBooks;
        });
      })
      .catch((err) =>
        alert(err.response?.data?.message || "Error cancelling booked book")
      );
  };

  const formatDateTime = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - 
            ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  };

  const renderSeatBookingsSection = () => {
    let displayBookings = [];
    
    switch(bookingView) {
      case "past":
        displayBookings = seatBookings.past;
        break;
      case "today":
        displayBookings = seatBookings.today;
        break;
      case "tomorrow":
        displayBookings = seatBookings.tomorrow;
        break;
      default:
        displayBookings = [
          ...seatBookings.today, 
          ...seatBookings.tomorrow, 
        ];
    }

    return (
      <div className="bookings-section">
        {/* Booking View Selector */}
        <div className="booking-view-selector">
          <button
            className={`tab-btn ${bookingView === "today" ? "active" : ""}`}
            onClick={() => setBookingView("today")}
          >
            Today
          </button>
          <button
            className={`tab-btn ${bookingView === "tomorrow" ? "active" : ""}`}
            onClick={() => setBookingView("tomorrow")}
          >
            Tomorrow
          </button>
          <button
            className={`tab-btn ${bookingView === "past" ? "active" : ""}`}
            onClick={() => setBookingView("past")}
          >
            Past
          </button>
        </div>

        {/* Bookings Display */}
        {displayBookings.length > 0 ? (
          <div className="bookings-grid">
            {displayBookings.map((booking) => (
              <div key={booking._id} className="booking-card compact">
                <div className="booking-card-header">
                  <h3>Seat {booking.seatId.seatNumber}</h3>
                </div>
                <div className="booking-card-body">
                  <p><span className="booking-label">Date:</span> {new Date(booking.startTime).toLocaleDateString()}</p>
                  <p><span className="booking-label">Room:</span> {booking.seatId.room}</p>
                  <p><span className="booking-label">Floor:</span> {booking.seatId.floor}</p>
                  <p><span className="booking-label">Time:</span> {formatDateTime(booking.startTime, booking.endTime)}</p>
                </div>
                {new Date(booking.startTime) > new Date() ? (
                  <div className="booking-card-footer">
                    <button
                      className="cancel-btn"
                      onClick={() => handleCancelBooking(booking._id)}
                    >
                      Cancel Booking
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-bookings">
            <p>No {bookingView} bookings found</p>
            <button 
              className="action-btn" 
              onClick={() => navigate("/seat-booking")}
            >
              Book a Seat
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderBooksSection = () => {
    return (
      <div className="bookings-section">
        {/* Booked Books */}
        {issuedBooks.booked.length > 0 && (
          <div>
            <h2 className="section-title">Booked Books</h2>
            <div className="bookings-grid">
              {issuedBooks.booked.map((book) => (
                <div key={book._id} className="booking-card compact">
                  <div className="booking-card-header">
                    <h3>{book.title}</h3>
                  </div>
                  <div className="booking-card-body">
                    <p><span className="booking-label">Author:</span> {book.author}</p>
                    <p><span className="booking-label">Issue Date:</span> {new Date(book.issueDate).toLocaleDateString()}</p>
                    <p><span className="booking-label">Due Date:</span> {new Date(book.returnDate).toLocaleDateString()}</p>
                  </div>
                  <div className="booking-card-footer">
                    <button
                      className="cancel-btn"
                      onClick={() => handleCancelIssuedBook(book._id)}
                    >
                      Cancel Booking
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Issued Books */}
        {issuedBooks.issued.length > 0 && (
          <div>
            <h2 className="section-title">Issued Books</h2>
            <div className="bookings-grid">
              {issuedBooks.issued.map((book) => (
                <div key={book._id} className="booking-card compact">
                  <div className="booking-card-header">
                    <h3>{book.title}</h3>
                  </div>
                  <div className="booking-card-body">
                    <p><span className="booking-label">Author:</span> {book.author}</p>
                    <p><span className="booking-label">Issue Date:</span> {new Date(book.issueDate).toLocaleDateString()}</p>
                    <p><span className="booking-label">Due Date:</span> {new Date(book.returnDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Returned Books */}
        {issuedBooks.returned.length > 0 && (
          <div>
            <h2 className="section-title">Returned Books</h2>
            <div className="bookings-grid">
              {issuedBooks.returned.map((book) => (
                <div key={book._id} className="booking-card compact">
                  <div className="booking-card-header">
                    <h3>{book.title}</h3>
                  </div>
                  <div className="booking-card-body">
                    <p><span className="booking-label">Author:</span> {book.author}</p>
                    <p><span className="booking-label">Issue Date:</span> {new Date(book.issueDate).toLocaleDateString()}</p>
                    <p><span className="booking-label">Return Date:</span> {new Date(book.returnDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Books State */}
        {issuedBooks.booked.length === 0 && 
         issuedBooks.issued.length === 0 && 
         issuedBooks.returned.length === 0 && (
          <div className="no-bookings">
            <p>No books found</p>
            <button 
              className="action-btn" 
              onClick={() => navigate("/book-issue-rating")}
            >
              Browse Books
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app-container">
      <Sidebar 
        isCollapsed={isCollapsed} 
        toggleSidebar={toggleSidebar} 
        activeItem="bookings" 
      />
      
      <div className={`main-content ${isCollapsed ? 'expanded' : ''}`}>
        <div className="bookings-container">
          <div className="page-header">
            <h1 className="page-title">My Bookings</h1>
            <ProfileButton />
          </div>
          
          {/* Tab Navigation */}
          <div className="bookings-tabs">
            <button
              className={`tab-btn ${activeTab === "issuedBooks" ? "active" : ""}`}
              onClick={() => setActiveTab("issuedBooks")}
            >
              📚 Issued Books
            </button>
            <button
              className={`tab-btn ${activeTab === "seatBookings" ? "active" : ""}`}
              onClick={() => setActiveTab("seatBookings")}
            >
              💺 Seat Bookings
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "issuedBooks" 
            ? renderBooksSection()
            : renderSeatBookingsSection()
          }
        </div>
      </div>
    </div>
  );
};

export default Profile;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import Sidebar from "../components/Sidebar";
import "./Profile.css";
import ProfileButton from "../components/ProfileButton";
import Alert from "../components/Alert";
import MobileHeader from "../components/MobileHeader"; // Import MobileHeader

const Profile = () => {
  const navigate = useNavigate();
  const [issuedBooks, setIssuedBooks] = useState({
    booked: [],
    issued: [],
    returned: [],
  });
  const [seatBookings, setSeatBookings] = useState({
    past: [],
    today: [],
    tomorrow: [],
  });
  const [activeTab, setActiveTab] = useState("issuedBooks");
  const [bookingView, setBookingView] = useState("today");
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth <= 768); // Initial state based on screen size
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "error",
  });

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
                  returnDate:
                    book.returnDate ||
                    new Date(new Date(book.issueDate).setDate(new Date(book.issueDate).getDate() + 14)),
                };
              } catch (err) {
                console.error("Error fetching title for book:", book.bookId, err);
                showAlert(`Couldn't load complete details for some books`, "warning");
                return book;
              }
            }
            return book;
          })
        ).then((updatedBooks) => {
          setIssuedBooks(categorizeBooks(updatedBooks));
        });
      })
      .catch((err) => {
        console.error("Error fetching issued books:", err);
        showAlert("Failed to load your issued books. Please try again later.", "error");
      });

    // Fetch all seat bookings for the student
    API.get("/seat-bookings/get-all-of-student-with-seat-details")
      .then((res) => {
        const seatData = res.data.data || [];
        setSeatBookings(categorizeBookings(seatData));
      })
      .catch((err) => {
        console.error("Error fetching seat bookings:", err);
        showAlert("Failed to load your seat bookings. Please try again later.", "error");
      });
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

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    // Dispatch event to sync with MobileHeader
    window.dispatchEvent(new CustomEvent("toggleSidebar", { detail: { isCollapsed: !isCollapsed } }));
  };

  const showAlert = (message, type = "error") => {
    setAlert({
      show: true,
      message,
      type,
    });
  };

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, show: false }));
  };

  const categorizeBookings = (bookings) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      past: bookings.filter((booking) => new Date(booking.endTime) < today),
      today: bookings.filter((booking) => {
        const bookingStart = new Date(booking.startTime);
        return bookingStart >= today && bookingStart < tomorrow;
      }),
      tomorrow: bookings.filter((booking) => {
        const bookingStart = new Date(booking.startTime);
        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
        return bookingStart >= tomorrow && bookingStart < dayAfterTomorrow;
      }),
    };
  };

  const categorizeBooks = (books) => {
    return {
      booked: books.filter((book) => book.status === "booked"),
      issued: books.filter((book) => book.status === "issued"),
      returned: books.filter((book) => book.status === "returned"),
    };
  };

  const handleCancelBooking = (bookingId) => {
    API.delete(`/seat-bookings/cancel-booking/${bookingId}`)
      .then(() => {
        showAlert("Booking cancelled successfully", "success");
        setSeatBookings((prev) => {
          const updatedBookings = { ...prev };
          Object.keys(updatedBookings).forEach((key) => {
            updatedBookings[key] = updatedBookings[key].filter((booking) => booking._id !== bookingId);
          });
          return updatedBookings;
        });
      })
      .catch((err) =>
        showAlert(err.response?.data?.message || "Error cancelling booking", "error")
      );
  };

  const handleCancelIssuedBook = (bookingId) => {
    API.delete(`/issue-books/cancel/${bookingId}`)
      .then(() => {
        showAlert("Booked book cancelled successfully", "success");
        setIssuedBooks((prev) => {
          const updatedBooks = { ...prev };
          updatedBooks.booked = updatedBooks.booked.filter((book) => book._id !== bookingId);
          return updatedBooks;
        });
      })
      .catch((err) =>
        showAlert(err.response?.data?.message || "Error cancelling booked book", "error")
      );
  };

  const formatDateTime = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })} - 
            ${end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
  };

  const renderSeatBookingsSection = () => {
    let displayBookings = [];

    switch (bookingView) {
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
        displayBookings = [...seatBookings.today, ...seatBookings.tomorrow];
    }

    return (
      <div className="bookings-section">
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

        {displayBookings.length > 0 ? (
          <div className="bookings-grid">
            {displayBookings.map((booking) => (
              <div key={booking._id} className="booking-card compact">
                <div className="booking-card-header">
                  <h3>Seat {booking.seatId.seatNumber}</h3>
                </div>
                <div className="booking-card-body">
                  <p>
                    <span className="booking-label">Date:</span>{" "}
                    {new Date(booking.startTime).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="booking-label">Room:</span> {booking.seatId.room}
                  </p>
                  <p>
                    <span className="booking-label">Floor:</span> {booking.seatId.floor}
                  </p>
                  <p>
                    <span className="booking-label">Time:</span>{" "}
                    {formatDateTime(booking.startTime, booking.endTime)}
                  </p>
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
            <button className="action-btn book-a-seat-btn" onClick={() => navigate("/seat-booking")}>
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
                    <p>
                      <span className="booking-label">Author:</span> {book.author}
                    </p>
                    <p>
                      <span className="booking-label">Issue Date:</span>{" "}
                      {new Date(book.issueDate).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="booking-label">Due Date:</span>{" "}
                      {new Date(book.returnDate).toLocaleDateString()}
                    </p>
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
                    <p>
                      <span className="booking-label">Author:</span> {book.author}
                    </p>
                    <p>
                      <span className="booking-label">Issue Date:</span>{" "}
                      {new Date(book.issueDate).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="booking-label">Due Date:</span>{" "}
                      {new Date(book.returnDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                    <p>
                      <span className="booking-label">Author:</span> {book.author}
                    </p>
                    <p>
                      <span className="booking-label">Issue Date:</span>{" "}
                      {new Date(book.issueDate).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="booking-label">Return Date:</span>{" "}
                      {new Date(book.returnDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {issuedBooks.booked.length === 0 &&
          issuedBooks.issued.length === 0 &&
          issuedBooks.returned.length === 0 && (
            <div className="no-bookings">
              <p>No books found</p>
              <button
                className="action-btn browse-books-btn"
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
    <div className="dashboard-container">
      <Alert
        show={alert.show}
        type={alert.type}
        message={alert.message}
        onDismiss={hideAlert}
        autoDismissTime={5000}
      />

      <MobileHeader /> {/* Add MobileHeader here */}

      <Sidebar
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
        activeItem="bookings"
      />

      <div className={`main-content ${!isCollapsed && window.innerWidth <= 768 ? "blurred" : ""}`}>
        <div className="dashboard-header">
          <div className="heading_color">🗓️ My Seat Bookings</div>
          <ProfileButton />
        </div>
        <div className="bookings-container">
          {/* <div className="bookings-tabs">
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
          </div> */}

          {/* {activeTab === "issuedBooks" ? renderBooksSection() : renderSeatBookingsSection()} */}
          {renderSeatBookingsSection()}
        </div>
      </div>
    </div>
  );
};

export default Profile;
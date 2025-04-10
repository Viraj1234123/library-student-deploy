import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import io from "socket.io-client";
import "./SeatBooking.css";
import Sidebar from "../components/Sidebar";
import ProfileButton from "../components/ProfileButton";
import Alert from "../components/Alert";
import MobileHeader from "../components/MobileHeader"; // Import MobileHeader

// Initialize WebSocket connection
const socket = io(process.env.REACT_APP_BACKEND_URL); // Replace with your server URL

const SeatBooking = () => {
  const navigate = useNavigate();
  const [seats, setSeats] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [seatBookings, setSeatBookings] = useState([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [viewMode, setViewMode] = useState("room-first");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookedSeatsForTime, setBookedSeatsForTime] = useState([]);
  const [userExistingBookings, setUserExistingBookings] = useState({
    today: [],
    tomorrow: [],
  });
  const [todayTimeSlots, setTodayTimeSlots] = useState([]);
  const [tomorrowTimeSlots, setTomorrowTimeSlots] = useState([]);
  const [selectedDay, setSelectedDay] = useState("today");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth <= 768); // Initial state based on screen size
  const [pendingSelections, setPendingSelections] = useState([]);
  const [alert, setAlert] = useState({ show: false, message: "", type: "error" }); // Alert state
  const timeoutRefs = useRef({});
  const [timeSlots, setTimeSlots] = useState([]);

  const maxBookingHours = 5; // Maximum booking hours allowed per day

  // Listen for sidebar toggle event from MobileHeader
  useEffect(() => {
    const handleSidebarToggle = (event) => {
      setIsSidebarCollapsed(event.detail.isCollapsed);
    };

    window.addEventListener("toggleSidebar", handleSidebarToggle);

    // Cleanup the event listener on unmount
    return () => {
      window.removeEventListener("toggleSidebar", handleSidebarToggle);
    };
  }, []);

  // Toggle sidebar function
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
    // Dispatch event to sync with MobileHeader
    window.dispatchEvent(
      new CustomEvent("toggleSidebar", { detail: { isCollapsed: !isSidebarCollapsed } })
    );
  };

  // Show alert function
  const showAlert = (message, type = "error") => {
    setAlert({ show: true, message, type });
  };

  // Dismiss alert function
  const dismissAlert = () => {
    setAlert({ ...alert, show: false });
  };

  // WebSocket event listeners
  useEffect(() => {
    socket.on("seatSelected", ({ seatId, timeSlot, day }) => {
      setPendingSelections((prev) => {
        const newPending = [...prev, { seatId, timeSlot, day }];
        timeoutRefs.current[`${seatId}-${timeSlot}-${day}`] = setTimeout(() => {
          setPendingSelections((current) =>
            current.filter(
              (p) => !(p.seatId === seatId && p.timeSlot === timeSlot && p.day === day)
            )
          );
          delete timeoutRefs.current[`${seatId}-${timeSlot}-${day}`];
        }, 10000); // 10 seconds
        return newPending;
      });
    });

    socket.on("seatBooked", ({ seatId, timeSlot, day }) => {
      if (timeoutRefs.current[`${seatId}-${timeSlot}-${day}`]) {
        clearTimeout(timeoutRefs.current[`${seatId}-${timeSlot}-${day}`]);
        delete timeoutRefs.current[`${seatId}-${timeSlot}-${day}`];
      }
      setPendingSelections((prev) =>
        prev.filter((p) => !(p.seatId === seatId && p.timeSlot === timeSlot && p.day === day))
      );

      if (
        viewMode === "time-first" &&
        selectedTimeSlot?.startTime === timeSlot &&
        selectedTimeSlot?.day === day
      ) {
        setBookedSeatsForTime((prev) => [...prev, { _id: seatId }]);
      }
      if (viewMode === "room-first" && selectedSeat?._id === seatId) {
        setSeatBookings((prev) => [...prev, { startTime: new Date().setHours(timeSlot) }]);
      }
    });

    socket.on("seatDeselected", ({ seatId, timeSlot, day }) => {
      if (timeoutRefs.current[`${seatId}-${timeSlot}-${day}`]) {
        clearTimeout(timeoutRefs.current[`${seatId}-${timeSlot}-${day}`]);
        delete timeoutRefs.current[`${seatId}-${timeSlot}-${day}`];
      }
      setPendingSelections((prev) =>
        prev.filter((p) => !(p.seatId === seatId && p.timeSlot === timeSlot && p.day === day))
      );
    });

    return () => {
      socket.off("seatSelected");
      socket.off("seatBooked");
      socket.off("seatDeselected");
      Object.values(timeoutRefs.current).forEach(clearTimeout);
    };
  }, [viewMode, selectedTimeSlot, selectedSeat]);

  // Fetch all seats on component mount
  useEffect(() => {
    setLoading(true);

    API.get("/seats/get-available-seats")
      .then((res) => {
        const seatsData = res.data.data;
        setSeats(seatsData);

        const uniqueRooms = [...new Set(seatsData.map((seat) => seat.room))];
        const roomsWithFloors = uniqueRooms.map((roomName) => {
          const roomSeats = seatsData.filter((seat) => seat.room === roomName);
          const floor = roomSeats.length > 0 ? roomSeats[0].floor : 1;
          return { name: roomName, floor, seatType: roomSeats[0].seatType };
        });

        roomsWithFloors.sort((a, b) => {
          if (a.floor !== b.floor) return a.floor - b.floor;
          return a.name.localeCompare(b.name);
        });

        setRooms(roomsWithFloors);

        return API.get("/seat-bookings/get-all-of-student-with-seat-details");
      })
      .then((res) => {
        const allBookings = res.data.data || [];
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const todayBookings = allBookings.filter((booking) => {
          const bookingDate = new Date(booking.startTime);
          return (
            bookingDate.getDate() === today.getDate() &&
            bookingDate.getMonth() === today.getMonth() &&
            bookingDate.getFullYear() === today.getFullYear()
          );
        });

        const tomorrowBookings = allBookings.filter((booking) => {
          const bookingDate = new Date(booking.startTime);
          return (
            bookingDate.getDate() === tomorrow.getDate() &&
            bookingDate.getMonth() === tomorrow.getMonth() &&
            bookingDate.getFullYear() === tomorrow.getFullYear()
          );
        });

        setUserExistingBookings({
          today: todayBookings,
          tomorrow: tomorrowBookings,
        });

        generateTimeSlots();
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        showAlert("Failed to load seat booking data. Please try again later.", "error");
        setLoading(false);
      });
  }, []);

  const generateTimeSlots = () => {
    const indianNow = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    const currentHour = indianNow.getHours();

    const todaySlots = [];
    for (let hour = currentHour; hour < 24; hour++) {
      todaySlots.push({
        hour,
        day: "today",
        display: `${hour}:00 - ${hour + 1}:00`,
        isBooked: false,
        startTime: hour,
      });
    }

    const tomorrowSlots = [];
    for (let hour = 0; hour < currentHour; hour++) {
      tomorrowSlots.push({
        hour,
        day: "tomorrow",
        display: `${hour}:00 - ${hour + 1}:00`,
        isBooked: false,
        startTime: hour,
      });
    }

    setTodayTimeSlots(todaySlots);
    setTomorrowTimeSlots(tomorrowSlots);
  };

  const organizeRoomSeats = (roomName) => {
    const roomSeats = seats.filter((seat) => seat.room === roomName);
    const minX = 0;
    const maxX = 20;
    const minY = 0;
    const maxY = 20;

    const normalizeCoordinate = (coord, min, max) => {
      return ((coord - min) / (max - min)) * 100;
    };

    const seatTypes = [...new Set(roomSeats.map((seat) => seat.seatType))];
    const sections = seatTypes.map((type) => {
      const typeSeats = roomSeats.filter((seat) => seat.seatType === type);
      const mappedSeats = typeSeats.map((seat) => ({
        ...seat,
        normalizedX: normalizeCoordinate(seat.coordinates.x, minX, maxX),
        normalizedY: normalizeCoordinate(seat.coordinates.y, minY, maxY),
      }));
      return {
        name: type.charAt(0).toUpperCase() + type.slice(1),
        seats: mappedSeats,
      };
    });

    return sections;
  };

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    setSelectedSeat(null);
    setSelectedTimeSlots([]);

    if (viewMode === "time-first" && selectedTimeSlot !== null) {
      fetchAvailableSeatsForRoomAndTime(room, selectedTimeSlot);
    }
  };

  const fetchAvailableSeatsForRoomAndTime = (room, timeSlotObj) => {
    setLoading(true);
    API.get(
      `/seat-bookings/get-available-seats-by-slot?startTime=${timeSlotObj.startTime}&room=${room.name}&floor=${room.floor}&seatType=${room.seatType}`
    )
      .then((res) => {
        const availableSeats = res.data.data;
        const allRoomSeats = seats.filter((seat) => seat.room === room.name);
        const bookedSeats = allRoomSeats.filter((roomSeat) =>
          !availableSeats.some((availableSeat) => availableSeat._id === roomSeat._id)
        );
        setBookedSeatsForTime(bookedSeats);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching available seats:", err);
        showAlert("Failed to fetch available seats. Please try again.", "error");
        setLoading(false);
      });
  };

  const handleSelectSeat = (seat) => {
    if (viewMode === "room-first") {
      setSelectedSeat(seat);
      setSelectedTimeSlots([]);
      API.get(`/seat-bookings/get-by-seat-id-for-today/${seat._id}`)
        .then((res) => {
          setSeatBookings(res.data.data);
        })
        .catch((err) => console.error("Error fetching seat bookings:", err));
    } else if (viewMode === "time-first") {
      const isBooked = bookedSeatsForTime.some((bookedSeat) => bookedSeat._id === seat._id);
      if (!isBooked) {
        if (selectedSeat && selectedSeat._id !== seat._id) {
          socket.emit("seatDeselected", {
            seatId: selectedSeat._id,
            timeSlot: selectedTimeSlot.startTime,
            day: selectedTimeSlot.day,
          });
        }

        setSelectedSeat(seat);
        setSelectedTimeSlots([selectedTimeSlot]);
        socket.emit("seatSelected", {
          seatId: seat._id,
          timeSlot: selectedTimeSlot.startTime,
          day: selectedTimeSlot.day,
        });
      }
    }
  };

  useEffect(() => {
    const fetchTimeSlots = async () => {
      const slots = selectedDay === "today" ? todayTimeSlots : tomorrowTimeSlots;

      if (viewMode === "room-first" && selectedSeat) {
        let pausedSlots = [];
        const room = selectedRoom.name;
        await API.get(`/seat-bookings/get-pause-slots-by-room/?room=${room}`).then((res) => {
          pausedSlots = res.data.data;
        });
        const bookedSlots = seatBookings.map((booking) => {
          const bookingTime = new Date(booking.startTime);
          return bookingTime.getHours();
        });

        const userBookedSlots = userExistingBookings[selectedDay].map((booking) => {
          const bookingTime = new Date(booking.startTime);
          return bookingTime.getHours();
        });

        setTimeSlots(
          slots.map((slot) => ({
            ...slot,
            isBooked: bookedSlots.includes(slot.hour) || pausedSlots.includes(slot.hour),
            isUserBooked: userBookedSlots.includes(slot.hour),
          }))
        );
      } else {
        const userBookedSlots = userExistingBookings[selectedDay].map((booking) => {
          const bookingTime = new Date(booking.startTime);
          return bookingTime.getHours();
        });

        setTimeSlots(
          slots.map((slot) => ({
            ...slot,
            isBooked: userBookedSlots.includes(slot.hour),
            isUserBooked: userBookedSlots.includes(slot.hour),
          }))
        );
      }
    };

    fetchTimeSlots();
  }, [selectedDay, viewMode, selectedSeat, selectedRoom, seatBookings, userExistingBookings]);

  const handleTimeSlotSelection = (slot) => {
    if (viewMode === "room-first") {
      const isSelected = selectedTimeSlots.some(
        (ts) => ts.startTime === slot.startTime && ts.day === slot.day
      );
      if (isSelected) {
        setSelectedTimeSlots(
          selectedTimeSlots.filter(
            (ts) => !(ts.startTime === slot.startTime && ts.day === slot.day)
          )
        );
        if (selectedSeat) {
          socket.emit("seatDeselected", {
            seatId: selectedSeat._id,
            timeSlot: slot.startTime,
            day: slot.day,
          });
        }
      } else if (!slot.isBooked) {
        const existingBookingHours = userExistingBookings[slot.day].length;
        const selectedSlotsForSameDay = selectedTimeSlots.filter(
          (ts) => ts.day === slot.day
        ).length;

        if (existingBookingHours + selectedSlotsForSameDay + 1 > maxBookingHours) {
          showAlert(`You can only book a maximum of ${maxBookingHours} hours for ${slot.day}.`);
          return;
        }

        const newSelectedTimeSlots = [...selectedTimeSlots, slot];
        setSelectedTimeSlots(newSelectedTimeSlots);

        if (selectedSeat) {
          newSelectedTimeSlots.forEach((ts) => {
            socket.emit("seatSelected", {
              seatId: selectedSeat._id,
              timeSlot: ts.startTime,
              day: ts.day,
            });
          });
        }
      }
    } else if (viewMode === "time-first") {
      const existingBookingHours = userExistingBookings[slot.day].length;
      if (existingBookingHours + 1 > maxBookingHours) {
        showAlert(
          `You have already booked the maximum of ${maxBookingHours} hours for ${slot.day}.`
        );
        return;
      }

      setSelectedTimeSlot(slot);
      setSelectedSeat(null);
      setSelectedRoom(null);
      setBookedSeatsForTime([]);
    }
  };

  const toggleViewMode = () => {
    setSelectedRoom(null);
    setSelectedSeat(null);
    setSelectedTimeSlots([]);
    setSelectedTimeSlot(null);
    setBookedSeatsForTime([]);
    setSeatBookings([]);
    setViewMode(viewMode === "room-first" ? "time-first" : "room-first");
  };

  const handleDayChange = (day) => {
    setSelectedDay(day);
    setSelectedTimeSlots([]);
  };

  const handleBookingSubmission = async () => {
    if (viewMode === "room-first" && (!selectedTimeSlots.length || !selectedSeat)) {
      showAlert("Please select a seat and at least one time slot.");
      return;
    }

    if (viewMode === "time-first" && (!selectedTimeSlot || !selectedSeat)) {
      showAlert("Please select a time slot and a seat.");
      return;
    }

    const timeSlotsToBook = viewMode === "room-first" ? selectedTimeSlots : [selectedTimeSlot];

    const todaySlots = timeSlotsToBook.filter((slot) => slot.day === "today");
    const tomorrowSlots = timeSlotsToBook.filter((slot) => slot.day === "tomorrow");

    if (
      todaySlots.length > 0 &&
      userExistingBookings.today.length + todaySlots.length > maxBookingHours
    ) {
      showAlert(`This booking would exceed your daily limit of ${maxBookingHours} hours for today.`);
      return;
    }

    if (
      tomorrowSlots.length > 0 &&
      userExistingBookings.tomorrow.length + tomorrowSlots.length > maxBookingHours
    ) {
      showAlert(
        `This booking would exceed your daily limit of ${maxBookingHours} hours for tomorrow.`
      );
      return;
    }

    try {
      const bookingResponses = [];
      for (const slot of timeSlotsToBook) {
        const response = await API.post("/seat-bookings/book-seat", {
          seatId: selectedSeat._id,
          startTime: slot.startTime,
        });
        bookingResponses.push(response);

        socket.emit("seatBooked", {
          seatId: selectedSeat._id,
          timeSlot: slot.startTime,
          day: slot.day,
        });
      }

      const slotText =
        timeSlotsToBook.length > 1
          ? `slots ${timeSlotsToBook
            .map((slot) => `${slot.day} ${slot.display}`)
            .join(", ")}`
          : `slot ${timeSlotsToBook[0].day} ${timeSlotsToBook[0].display}`;

      showAlert(`Seat ${selectedSeat.seatNumber} booked for ${slotText}`, "success");

      const newBookings = bookingResponses.map((res) => res.data.data);
      const newTodayBookings = newBookings.filter((booking) => {
        const bookingDate = new Date(booking.startTime);
        const today = new Date();
        return bookingDate.getDate() === today.getDate();
      });
      const newTomorrowBookings = newBookings.filter((booking) => {
        const bookingDate = new Date(booking.startTime);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return bookingDate.getDate() === tomorrow.getDate();
      });

      setUserExistingBookings({
        today: [...userExistingBookings.today, ...newTodayBookings],
        tomorrow: [...userExistingBookings.tomorrow, ...newTomorrowBookings],
      });

      if (viewMode === "room-first") {
        const res = await API.get(`/seat-bookings/get-by-seat-id-for-today/${selectedSeat._id}`);
        setSeatBookings(res.data.data);
        setSelectedTimeSlots([]);
      } else {
        fetchAvailableSeatsForRoomAndTime(selectedRoom, selectedTimeSlot);
        setSelectedSeat(null);
      }
    } catch (err) {
      showAlert(err.response?.data?.message || "Failed to book seat!", "error");
    }
  };

  const handleCancelSelection = () => {
    if (viewMode === "room-first") {
      if (selectedSeat && selectedTimeSlots.length > 0) {
        selectedTimeSlots.forEach((slot) => {
          socket.emit("seatDeselected", {
            seatId: selectedSeat._id,
            timeSlot: slot.startTime,
            day: slot.day,
          });
        });
      }
      setSelectedSeat(null);
      setSelectedTimeSlots([]);
    } else {
      if (selectedSeat && selectedTimeSlot) {
        socket.emit("seatDeselected", {
          seatId: selectedSeat._id,
          timeSlot: selectedTimeSlot.startTime,
          day: selectedTimeSlot.day,
        });
      }
      setSelectedSeat(null);
    }
  };

  const renderTheaterLayout = () => {
    if (!selectedRoom) return null;

    const sections = organizeRoomSeats(selectedRoom.name);
    const minY = Math.min(
      ...sections.map((section) => Math.min(...section.seats.map((seat) => seat.normalizedY)))
    );
    const maxY = Math.max(
      ...sections.map((section) => Math.max(...section.seats.map((seat) => seat.normalizedY)))
    );

    return (
      <div
        className="theater-layout"
        style={{
          position: "relative",
          width: "100%",
          height: "700px",
          border: "1px solid #ccc",
          backgroundColor: "#f0f0f0",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            fontWeight: "bold",
            zIndex: 10,
          }}
        >
          {selectedRoom.name} - Floor {selectedRoom.floor}
        </div>

        {sections.map((section, sectionIdx) => (
          <div
            key={sectionIdx}
            className="section-container"
            style={{
              position: "relative",
              marginTop: "100px",
              width: "90%",
              height: "90%",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: `${maxY}%`,
                marginTop: "100px",
                left: "40px",
                width: "60px",
                height: "20px",
                backgroundColor: "#4a4a4a",
                borderRadius: "0 0 10px 10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "10px",
                transform: "rotate(90deg)",
                transformOrigin: "top left",
                zIndex: 15,
                marginLeft: "-5%",
              }}
            >
              Gate A
            </div>
            <div
              style={{
                position: "absolute",
                bottom: `${minY}%`,
                left: "40px",
                width: "60px",
                height: "20px",
                backgroundColor: "#4a4a4a",
                borderRadius: "0 0 10px 10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "10px",
                transform: "rotate(90deg)",
                transformOrigin: "top left",
                zIndex: 15,
                marginLeft: "-5%",
              }}
            >
              Gate B
            </div>
            {section.seats.map((seat, seatIdx) => {
              const isBooked =
                viewMode === "time-first"
                  ? bookedSeatsForTime.some((bookedSeat) => bookedSeat._id === seat._id)
                  : false;
              const isPending = pendingSelections.some(
                (p) =>
                  p.seatId === seat._id &&
                  (viewMode === "time-first"
                    ? p.timeSlot === selectedTimeSlot?.startTime && p.day === selectedTimeSlot?.day
                    : selectedTimeSlots.some(
                      (ts) => ts.startTime === p.timeSlot && ts.day === p.day
                    ))
              );
              const isClickable = !isBooked && !isPending;

              return (
                <div
                  key={seatIdx}
                  className={`absolute-seat ${
                    isBooked ? "booked" : isPending ? "pending" : "available"
                  } ${selectedSeat && selectedSeat._id === seat._id ? "selected" : ""}`}
                  style={
                    isBooked || isPending
                      ? {
                          position: "absolute",
                          left: `${seat.normalizedX}%`,
                          bottom: `${seat.normalizedY}%`,
                          transform: "translate(-50%, 50%)",
                          width: "25px",
                          height: "25px",
                          borderRadius: "5px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "not-allowed",
                          fontSize: "12px",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                          zIndex: 5,
                        }
                      : {
                          position: "absolute",
                          left: `${seat.normalizedX}%`,
                          bottom: `${seat.normalizedY}%`,
                          transform: "translate(-50%, 50%)",
                          width: "25px",
                          height: "25px",
                          borderRadius: "5px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          fontSize: "12px",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                          zIndex: 5,
                        }
                  }
                  onClick={isClickable ? () => handleSelectSeat(seat) : undefined}
                >
                  {seat.seatNumber}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <Alert
        message={alert.message}
        type={alert.type}
        show={alert.show}
        onDismiss={dismissAlert}
        autoDismissTime={5000}
      />

      <MobileHeader /> {/* Add MobileHeader here */}

      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
        activeItem="seat-booking"
      />

      <div
        className={`main-content ${
          !isSidebarCollapsed && window.innerWidth <= 768 ? "blurred" : ""
        }`}
      >
        <div className="dashboard-header">
          <div className="heading_color">💺 Book a Seat</div>
          <div className="header-right">
            <div>
              <a
                href="https://www.iitrpr.ac.in/library/floor_plan.php"
                className="button-library-floor-plan"
                target="_blank"
                rel="noopener noreferrer"
              >
                Library Floor Plan
              </a>
            </div>
            <ProfileButton />
          </div>
        </div>
        <div className="seat-booking-container">
          <div className="view-mode-toggle">
            <button
              className={`view-mode-btn ${viewMode === "room-first" ? "active" : ""}`}
              onClick={() => toggleViewMode()}
            >
              Select Room First
            </button>
            <button
              className={`view-mode-btn ${viewMode === "time-first" ? "active" : ""}`}
              onClick={() => toggleViewMode()}
            >
              Select Time First
            </button>
          </div>

          <div className="booking-limit-info">
            <p>
              Daily booking limit: {userExistingBookings[selectedDay].length} of {maxBookingHours}{" "}
              hours used for {selectedDay}
              {viewMode === "room-first" && selectedTimeSlots.length > 0
                ? ` (${selectedTimeSlots.filter((slot) => slot.day === selectedDay).length} additional hours selected)`
                : ""}
            </p>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading seats...</p>
            </div>
          ) : (
            <>
              {viewMode === "room-first" ? (
                <div className="booking-container">
                  {!selectedRoom ? (
                    <div className="rooms-container">
                      <h3>Select a Room:</h3>
                      <div className="rooms-grid">
                        {rooms.map((room, idx) => (
                          <div
                            key={idx}
                            className="room-card"
                            onClick={() => handleSelectRoom(room)}
                          >
                            <h4>{room.name}</h4>
                            <p>Floor {room.floor}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : !selectedSeat ? (
                    <div className="theater-container">
                      <div className="selected-room">
                        <h3>
                          Room: {selectedRoom.name} (Floor {selectedRoom.floor})
                        </h3>
                        <button className="back-btn" onClick={() => setSelectedRoom(null)}>
                          ← Back to Rooms
                        </button>
                      </div>

                      <div className="seat-legend">
                        <div className="legend-item">
                          <div className="legend-box available"></div>
                          <span>Available</span>
                        </div>
                        <div className="legend-item">
                          <div className="legend-box pending"></div>
                          <span>Pending (Selected by someone)</span>
                        </div>
                        <div className="legend-item">
                          <div className="legend-box selected"></div>
                          <span>Your Selection</span>
                        </div>
                      </div>

                      {renderTheaterLayout()}
                    </div>
                  ) : (
                    <div className="time-slot-container">
                      <div className="selected-seat-info">
                        <h3>
                          Selected Seat: {selectedSeat.seatNumber} ({selectedSeat.seatType}) in{" "}
                          {selectedRoom.name}
                        </h3>
                        <button className="back-btn" onClick={() => setSelectedSeat(null)}>
                          ← Back to Seats
                        </button>
                      </div>

                      <div className="day-selector">
                        <button
                          className={`day-btn ${selectedDay === "today" ? "active" : ""}`}
                          onClick={() => handleDayChange("today")}
                        >
                          Today
                        </button>
                        <button
                          className={`day-btn ${selectedDay === "tomorrow" ? "active" : ""}`}
                          onClick={() => handleDayChange("tomorrow")}
                        >
                          Tomorrow
                        </button>
                      </div>

                      <div className="time-slot-selection">
                        <h3>
                          Select Time Slot(s) for{" "}
                          {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}:
                        </h3>
                        <p className="note">
                          You can select multiple time slots (max {maxBookingHours} hours per day
                          including existing bookings)
                        </p>

                        <div className="time-slots-grid">
                          {timeSlots.map((slot, idx) => {
                            const isPending = pendingSelections.some(
                              (p) =>
                                p.seatId === selectedSeat._id &&
                                p.timeSlot === slot.startTime &&
                                p.day === slot.day
                            );
                            const isClickable = !slot.isBooked && !slot.isUserBooked && !isPending;

                            return (
                              <div
                                key={idx}
                                className={`time-slot ${
                                  slot.isBooked || slot.isUserBooked
                                    ? "booked"
                                    : isPending
                                    ? "pending"
                                    : "available"
                                } ${selectedTimeSlots.some(
                                  (ts) => ts.startTime === slot.startTime && ts.day === slot.day
                                )
                                  ? "selected"
                                  : ""
                                }`}
                                onClick={isClickable ? () => handleTimeSlotSelection(slot) : undefined}
                              >
                                {slot.display}
                                {slot.isUserBooked && <span> (Your booking)</span>}
                              </div>
                            );
                          })}
                        </div>

                        <div className="booking-actions">
                          <button
                            className="book-btn"
                            onClick={handleBookingSubmission}
                            disabled={selectedTimeSlots.length === 0}
                          >
                            Book Selected Slots
                          </button>
                          <button className="cancel-btn" onClick={handleCancelSelection}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="booking-container">
                  {!selectedTimeSlot ? (
                    <div className="time-slot-container">
                      <div className="day-selector">
                        <button
                          className={`day-btn ${selectedDay === "today" ? "active" : ""}`}
                          onClick={() => handleDayChange("today")}
                        >
                          Today
                        </button>
                        <button
                          className={`day-btn ${selectedDay === "tomorrow" ? "active" : ""}`}
                          onClick={() => handleDayChange("tomorrow")}
                        >
                          Tomorrow
                        </button>
                      </div>

                      <h3>
                        Select a Time Slot for{" "}
                        {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}:
                      </h3>
                      <p className="note">You can book up to {maxBookingHours} hours per day</p>

                      <div className="time-slots-grid">
                        {timeSlots.map((slot, idx) => (
                          <div
                            key={idx}
                            className={`time-slot ${
                              slot.isBooked || slot.isUserBooked ? "booked" : "available"
                            }`}
                            onClick={() => !slot.isBooked && handleTimeSlotSelection(slot)}
                          >
                            {slot.display}
                            {slot.isUserBooked && <span> (Your booking)</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : !selectedRoom ? (
                    <div className="rooms-container">
                      <div className="selected-time-info">
                        <h3>
                          Selected Time:{" "}
                          {selectedTimeSlot.day.charAt(0).toUpperCase() +
                            selectedTimeSlot.day.slice(1)}
                          , {selectedTimeSlot.display}
                        </h3>
                        <button className="back-btn" onClick={() => setSelectedTimeSlot(null)}>
                          ← Back to Time Slots
                        </button>
                      </div>

                      <h3>Select a Room:</h3>
                      <div className="rooms-grid">
                        {rooms.map((room, idx) => (
                          <div
                            key={idx}
                            className="room-card"
                            onClick={() => handleSelectRoom(room)}
                          >
                            <h4>{room.name}</h4>
                            <p>Floor {room.floor}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="theater-container">
                      <div className="selected-room-time-info">
                        <h3>
                          Selected Time:{" "}
                          {selectedTimeSlot.day.charAt(0).toUpperCase() +
                            selectedTimeSlot.day.slice(1)}
                          , {selectedTimeSlot.display} | Room: {selectedRoom.name} (Floor{" "}
                          {selectedRoom.floor})
                        </h3>
                        <div className="back-buttons">
                          <button className="back-btn" onClick={() => setSelectedRoom(null)}>
                            ← Back to Rooms
                          </button>
                        </div>
                      </div>

                      <div className="seat-legend">
                        <div className="legend-item">
                          <div className="legend-box available"></div>
                          <span>Available</span>
                        </div>
                        <div className="legend-item">
                          <div className="legend-box booked"></div>
                          <span>Booked</span>
                        </div>
                        <div className="legend-item">
                          <div className="legend-box pending"></div>
                          <span>Pending (Selected by someone)</span>
                        </div>
                        <div className="legend-item">
                          <div className="legend-box selected"></div>
                          <span>Your Selection</span>
                        </div>
                      </div>

                      <div>{renderTheaterLayout()}</div>

                      {selectedSeat && (
                        <div className="booking-actions">
                          <button className="book-btn" onClick={handleBookingSubmission}>
                            Book Seat {selectedSeat.seatNumber} for{" "}
                            {selectedTimeSlot.day.charAt(0).toUpperCase() +
                              selectedTimeSlot.day.slice(1)}
                            , {selectedTimeSlot.display}
                          </button>
                          <button className="cancel-btn" onClick={handleCancelSelection}>
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeatBooking;
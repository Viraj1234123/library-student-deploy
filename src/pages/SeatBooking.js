import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "./SeatBooking.css";
import Sidebar from "../components/Sidebar";
import ProfileButton from "../components/ProfileButton";

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
    tomorrow: []
  });
  const [todayTimeSlots, setTodayTimeSlots] = useState([]);
  const [tomorrowTimeSlots, setTomorrowTimeSlots] = useState([]);
  const [selectedDay, setSelectedDay] = useState("today");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isBookingDisabled, setIsBookingDisabled] = useState(false);

  // Toggle sidebar function
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Check if current time is in the restricted period (11:55 PM to midnight)
  const checkBookingTimeRestriction = () => {
    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Check if time is between 11:55 PM (23:55) and midnight (00:00)
    const isRestricted = hours === 23 && minutes >= 55;
    
    setIsBookingDisabled(isRestricted);
    
    return isRestricted;
  };

  // Set up a timer to check booking restriction periodically
  useEffect(() => {
    // Initial check
    checkBookingTimeRestriction();
    
    // Set up interval to check every minute
    const intervalId = setInterval(() => {
      checkBookingTimeRestriction();
    }, 60000); // Check every minute
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Fetch all seats on component mount
  useEffect(() => {
    setLoading(true);

    // Fetch all seats
    API.get("/seats/get-available-seats")
      .then((res) => {
        const seatsData = res.data.data;
        setSeats(seatsData);

        // Extract unique rooms from the seats data
        const uniqueRooms = [...new Set(seatsData.map(seat => seat.room))];

        // Create room objects with floor information
        const roomsWithFloors = uniqueRooms.map(roomName => {
          const roomSeats = seatsData.filter(seat => seat.room === roomName);
          const floor = roomSeats.length > 0 ? roomSeats[0].floor : 1;
          return { name: roomName, floor, seatType: roomSeats[0].seatType };
        });

        // Sort rooms by floor and name
        roomsWithFloors.sort((a, b) => {
          if (a.floor !== b.floor) return a.floor - b.floor;
          return a.name.localeCompare(b.name);
        });

        setRooms(roomsWithFloors);

        // Fetch user's existing bookings
        return API.get("/seat-bookings/get-all-of-student-with-seat-details");
      })
      .then((res) => {
        const allBookings = res.data.data || [];

        // Current date values
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        // Separate bookings by day
        const todayBookings = allBookings.filter(booking => {
          const bookingDate = new Date(booking.startTime);
          return bookingDate.getDate() === today.getDate() &&
            bookingDate.getMonth() === today.getMonth() &&
            bookingDate.getFullYear() === today.getFullYear();
        });

        const tomorrowBookings = allBookings.filter(booking => {
          const bookingDate = new Date(booking.startTime);
          return bookingDate.getDate() === tomorrow.getDate() &&
            bookingDate.getMonth() === tomorrow.getMonth() &&
            bookingDate.getFullYear() === tomorrow.getFullYear();
        });

        setUserExistingBookings({
          today: todayBookings,
          tomorrow: tomorrowBookings
        });

        // Generate time slots
        generateTimeSlots();

        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setLoading(false);
      });
  }, []);

  // Function to generate time slots for today and tomorrow
  const generateTimeSlots = () => {
    // Get current time in IST
    const indianNow = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );

    const currentHour = indianNow.getHours();

    // Generate slots for today (from current hour until midnight)
    const todaySlots = [];
    for (let hour = currentHour; hour < 24; hour++) {
      todaySlots.push({
        hour,
        day: "today",
        display: `${hour}:00 - ${hour + 1}:00`,
        isBooked: false,
        startTime: hour // Just pass the hour as is
      });
    }

    // Generate slots for tomorrow (from midnight until current hour)
    const tomorrowSlots = [];
    for (let hour = 0; hour < currentHour; hour++) {
      tomorrowSlots.push({
        hour,
        day: "tomorrow",
        display: `${hour}:00 - ${hour + 1}:00`,
        isBooked: false,
        startTime: hour // Just pass the hour as is
      });
    }

    setTodayTimeSlots(todaySlots);
    setTomorrowTimeSlots(tomorrowSlots);
  };

  const organizeRoomSeats = (roomName) => {
    const roomSeats = seats.filter(seat => seat.room === roomName);

    // Find min and max coordinates
    const minX = 0;
    const maxX = 20;
    const minY = 0;
    const maxY = 20;

    // Normalize coordinates to a percentage-based layout
    const normalizeCoordinate = (coord, min, max) => {
      return ((coord - min) / (max - min)) * 100;
    };

    // Group seats by type
    const seatTypes = [...new Set(roomSeats.map(seat => seat.seatType))];

    const sections = seatTypes.map(type => {
      const typeSeats = roomSeats.filter(seat => seat.seatType === type);

      // Map seats with their normalized coordinates
      const mappedSeats = typeSeats.map(seat => ({
        ...seat,
        normalizedX: normalizeCoordinate(seat.coordinates.x, minX, maxX),
        normalizedY: normalizeCoordinate(seat.coordinates.y, minY, maxY)
      }));

      return {
        name: type.charAt(0).toUpperCase() + type.slice(1),
        seats: mappedSeats
      };
    });

    return sections;
  };

  // Handle room selection
  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    setSelectedSeat(null);
    setSelectedTimeSlots([]);

    // If in time-first mode and we already have a time slot selected,
    // fetch available seats for this room and time slot
    if (viewMode === "time-first" && selectedTimeSlot !== null) {
      fetchAvailableSeatsForRoomAndTime(room, selectedTimeSlot);
    }
  };

  // Fetch available seats for a specific room and time slot
  const fetchAvailableSeatsForRoomAndTime = (room, timeSlotObj) => {
    setLoading(true);

    API.get(`/seat-bookings/get-available-seats-by-slot?startTime=${timeSlotObj.startTime}&room=${room.name}&floor=${room.floor}&seatType=${room.seatType}`)
      .then((res) => {
        // This endpoint returns AVAILABLE seats
        const availableSeats = res.data.data;

        // Get all seats for this room
        const allRoomSeats = seats.filter(seat => seat.room === room.name);

        // Determine which seats are booked by finding the ones NOT in the available seats list
        const bookedSeats = allRoomSeats.filter(roomSeat =>
          !availableSeats.some(availableSeat => availableSeat._id === roomSeat._id)
        );

        setBookedSeatsForTime(bookedSeats);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching available seats:", err);
        setLoading(false);
      });
  };

  // When a seat is selected, fetch its bookings for today and tomorrow
  const handleSelectSeat = (seat) => {
    if (viewMode === "room-first") {
      setSelectedSeat(seat);
      setSelectedTimeSlots([]);

      // Fetch bookings for the selected day
      API.get(`/seat-bookings/get-by-seat-id-for-today/${seat._id}`)
        .then((res) => {
          setSeatBookings(res.data.data);
        })
        .catch((err) => console.error("Error fetching seat bookings:", err));
    } else if (viewMode === "time-first") {
      // In time-first mode, we're selecting seats after a time and room are chosen
      // Check if the seat is already booked for the selected time
      const isBooked = bookedSeatsForTime.some(
        bookedSeat => bookedSeat._id === seat._id
      );

      if (!isBooked) {
        setSelectedSeat(seat);
        // In time-first mode, we already have a time slot selected
        setSelectedTimeSlots([selectedTimeSlot]);
      }
    }
  };

  const [timeSlots, setTimeSlots] = useState([]);

useEffect(() => {
  const fetchTimeSlots = async () => {
    const slots = selectedDay === "today" ? todayTimeSlots : tomorrowTimeSlots;

    if (viewMode === "room-first" && selectedSeat) {
      let pausedSlots = [];
      const room = selectedRoom.name;
      await API.get(`/seat-bookings/get-pause-slots-by-room/?room=${room}`).then((res) => { 
        pausedSlots = res.data.data;
      });
      const bookedSlots = seatBookings.map(booking => {
        const bookingTime = new Date(booking.startTime);
        return bookingTime.getHours();
      });

      const userBookedSlots = userExistingBookings[selectedDay].map(booking => {
        const bookingTime = new Date(booking.startTime);
        return bookingTime.getHours();
      });

      setTimeSlots( slots.map(slot => ({
        ...slot,
        isBooked: bookedSlots.includes(slot.hour) || pausedSlots.includes(slot.hour),
        isUserBooked: userBookedSlots.includes(slot.hour)
      })));
    } else {
      const userBookedSlots = userExistingBookings[selectedDay].map(booking => {
        const bookingTime = new Date(booking.startTime);
        return bookingTime.getHours();
      });

      setTimeSlots( slots.map(slot => ({
        ...slot,
        isBooked: userBookedSlots.includes(slot.hour),
        isUserBooked: userBookedSlots.includes(slot.hour)
      })));
    }
  };
  
  fetchTimeSlots();
}, [selectedDay, viewMode, selectedSeat, selectedRoom, seatBookings, userExistingBookings]);


  // Handle time slot selection
  const handleTimeSlotSelection = (slot) => {
    // Check if booking is currently disabled (11:55 PM - midnight)
    if (isBookingDisabled) {
      alert("Bookings are not available between 11:55 PM and midnight. Please try again after midnight.");
      return;
    }
    
    if (viewMode === "room-first") {
      // In room-first mode, we can select multiple time slots
      if (selectedTimeSlots.some(ts => ts.startTime === slot.startTime && ts.day === slot.day)) {
        // If already selected, remove it
        setSelectedTimeSlots(selectedTimeSlots.filter(ts =>
          !(ts.startTime === slot.startTime && ts.day === slot.day)
        ));
      } else {
        // If not booked, check if adding this slot would exceed 5 hours for the selected day
        if (!slot.isBooked) {
          // Get existing bookings for the selected day
          const existingBookingHours = userExistingBookings[slot.day].length;

          // Count selected slots for the same day
          const selectedSlotsForSameDay = selectedTimeSlots.filter(ts => ts.day === slot.day).length;

          // If adding this slot would exceed 5 hours, show an alert
          if (existingBookingHours + selectedSlotsForSameDay + 1 > 5) {
            alert(`You can only book a maximum of 5 hours per day for ${slot.day}.`);
            return;
          }

          // Otherwise, add the slot
          setSelectedTimeSlots([...selectedTimeSlots, slot]);
        }
      }
    } else if (viewMode === "time-first") {
      // In time-first mode, we only select one time slot
      // Check if selecting this slot would exceed the limit for the selected day
      const existingBookingHours = userExistingBookings[slot.day].length;

      if (existingBookingHours + 1 > 5) {
        alert(`You have already booked the maximum of 5 hours for ${slot.day}.`);
        return;
      }

      setSelectedTimeSlot(slot);
      setSelectedSeat(null);

      // Reset room selection but don't fetch available seats yet
      // We'll fetch after a room is selected
      setSelectedRoom(null);
      setBookedSeatsForTime([]);
    }
  };

  // Switch between view modes
  const toggleViewMode = () => {
    // Reset selections when switching modes
    setSelectedRoom(null);
    setSelectedSeat(null);
    setSelectedTimeSlots([]);
    setSelectedTimeSlot(null);
    setBookedSeatsForTime([]);
    setSeatBookings([]);

    setViewMode(viewMode === "room-first" ? "time-first" : "room-first");
  };

  // Switch between today and tomorrow
  const handleDayChange = (day) => {
    setSelectedDay(day);
    setSelectedTimeSlots([]);
  };

  // Submit booking for the selected seat and time slots
  const handleBookingSubmission = async () => {
    // Check if booking is currently disabled (11:55 PM - midnight)
    if (isBookingDisabled) {
      alert("Bookings are not available between 11:55 PM and midnight. Please try again after midnight.");
      return;
    }
    
    if (viewMode === "room-first" && (!selectedTimeSlots.length || !selectedSeat)) {
      alert("Please select a seat and at least one time slot.");
      return;
    }

    if (viewMode === "time-first" && (!selectedTimeSlot || !selectedSeat)) {
      alert("Please select a time slot and a seat.");
      return;
    }

    const timeSlots = viewMode === "room-first" ? selectedTimeSlots : [selectedTimeSlot];

    // Group time slots by day for limit checking
    const todaySlots = timeSlots.filter(slot => slot.day === "today");
    const tomorrowSlots = timeSlots.filter(slot => slot.day === "tomorrow");

    // Check limits for each day
    if (todaySlots.length > 0 && (userExistingBookings.today.length + todaySlots.length > 5)) {
      alert("This booking would exceed your daily limit of 5 hours for today.");
      return;
    }

    if (tomorrowSlots.length > 0 && (userExistingBookings.tomorrow.length + tomorrowSlots.length > 5)) {
      alert("This booking would exceed your daily limit of 5 hours for tomorrow.");
      return;
    }

    try {
      // Create a booking for each selected time slot
      const bookingResponses = [];
      for (const slot of timeSlots) {
        const response = await API.post("/seat-bookings/book-seat", {
          seatId: selectedSeat._id,
          startTime: slot.startTime // Just send the hour, backend will handle the date
        });
        bookingResponses.push(response);
      }

      const slotText = timeSlots.length > 1
        ? `slots ${timeSlots.map(slot => `${slot.day} ${slot.display}`).join(", ")}`
        : `slot ${timeSlots[0].day} ${timeSlots[0].display}`;

      alert(`Seat ${selectedSeat.seatNumber} booked for ${slotText}`);

      // Update userExistingBookings with the new bookings
      const newBookings = bookingResponses.map(res => res.data.data);

      // Separate new bookings by day
      const newTodayBookings = newBookings.filter(booking => {
        const bookingDate = new Date(booking.startTime);
        const today = new Date();
        return bookingDate.getDate() === today.getDate();
      });

      const newTomorrowBookings = newBookings.filter(booking => {
        const bookingDate = new Date(booking.startTime);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return bookingDate.getDate() === tomorrow.getDate();
      });

      setUserExistingBookings({
        today: [...userExistingBookings.today, ...newTodayBookings],
        tomorrow: [...userExistingBookings.tomorrow, ...newTomorrowBookings]
      });

      // Reset selections
      if (viewMode === "room-first") {
        // Refresh bookings for the seat after a successful booking
        const res = await API.get(`/seat-bookings/get-by-seat-id-for-today/${selectedSeat._id}`);
        setSeatBookings(res.data.data);
        setSelectedTimeSlots([]);
      } else {
        // In time-first mode, refresh available seats for the selected time and room
        fetchAvailableSeatsForRoomAndTime(selectedRoom, selectedTimeSlot);
        setSelectedSeat(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to book seat!");
    }
  };

  const handleCancelSelection = () => {
    if (viewMode === "room-first") {
      setSelectedSeat(null);
      setSelectedTimeSlots([]);
    } else {
      setSelectedSeat(null);
    }
  };

  // Render method update for dynamic gate positioning
  const renderTheaterLayout = () => {
    if (!selectedRoom) return null;

    const sections = organizeRoomSeats(selectedRoom.name);

    // Calculate overall min and max Y for gate positioning
    const minY = Math.min(...sections.map(section => Math.min(...section.seats.map(seat => seat.normalizedY))));
    const maxY = Math.max(...sections.map(section => Math.max(...section.seats.map(seat => seat.normalizedY))));

    return (
      <div
        className="theater-layout"
        style={{
          position: 'relative',
          width: '100%',
          height: '700px',
          border: '1px solid #ccc',
          backgroundColor: '#f0f0f0',
          overflow: 'hidden'
        }}
      >
        {/* Room Label */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            fontWeight: 'bold',
            zIndex: 10
          }}
        >
          {selectedRoom.name} - Floor {selectedRoom.floor}
        </div>

        {sections.map((section, sectionIdx) => (
          <div
            key={sectionIdx}
            className="section-container"
            style={{
              position: 'relative',
              marginTop: '100px',
              width: '90%',
              height: '90%'
            }}
          >
            {/* Top Left Gate - Dynamically Positioned */}
            <div
              style={{
                position: 'absolute',
                bottom: `${maxY}%`, // Dynamically positioned based on first seat
                marginTop: '100px',
                left: '40px',
                width: '60px',
                height: '20px',
                backgroundColor: '#4a4a4a',
                borderRadius: '0 0 10px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '10px',
                transform: 'rotate(90deg)',
                transformOrigin: 'top left',
                zIndex: 15,
                marginLeft: '-5%'
              }}
            >
              Gate A
            </div>
            {/* Bottom Left Gate - Dynamically Positioned */}
            <div
              style={{
                position: 'absolute',
                bottom: `${minY}%`, // Dynamically positioned based on last seat
                left: '40px',
                width: '60px',
                height: '20px',
                backgroundColor: '#4a4a4a',
                borderRadius: '0 0 10px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '10px',
                transform: 'rotate(90deg)',
                transformOrigin: 'top left',
                zIndex: 15,
                marginLeft: '-5%'
              }}
            >
              Gate B
            </div>
            {section.seats.map((seat, seatIdx) => {
              const isBooked = viewMode === "time-first"
                ? bookedSeatsForTime.some(bookedSeat => bookedSeat._id === seat._id)
                : false;
              return (
                <div
                  key={seatIdx}
                  className={`absolute-seat ${isBooked ? 'booked' : 'available'} ${selectedSeat && selectedSeat._id === seat._id ? 'selected' : ''}`}
                  style={{
                    position: 'absolute',
                    left: `${seat.normalizedX}%`,
                    bottom: `${seat.normalizedY}%`, // Use bottom to shift origin
                    transform: 'translate(-50%, 50%)', // Adjust transform
                    width: '25px',
                    height: '25px',
                    borderRadius: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '12px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    zIndex: 5
                  }}
                  onClick={() => !isBooked && handleSelectSeat(seat)}
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
    <div className="app-container">
      {/* Sidebar component */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
        activeItem="seat-booking"
      />

      {/* Main content */}
      <div className="main-content">
        <div className="seat-booking-container">
          <div className="header">
            <h2 className="heading_color">💺 Book a Seat</h2>
            <ProfileButton />
          </div>

          {isBookingDisabled && (
            <div className="booking-restriction-warning" style={{
              backgroundColor: "#ffebee",
              color: "#c62828",
              padding: "10px 15px",
              borderRadius: "4px",
              marginBottom: "15px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              ⚠️ Bookings are temporarily unavailable between 11:55 PM and midnight. Please try again after midnight.
            </div>
          )}

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
              Daily booking limit: {userExistingBookings[selectedDay].length} of 5 hours used for {selectedDay}
              {viewMode === "room-first" && selectedTimeSlots.length > 0 ?
                ` (${selectedTimeSlots.filter(slot => slot.day === selectedDay).length} additional hours selected)` :
                ""}
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
                // Room-first view mode
                <div className="booking-container">
                  {!selectedRoom ? (
                    // Step 1: Room selection
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
                    // Step 2: Seat selection within the room
                    <div className="theater-container">
                      <div className="selected-room">
                        <h3>Room: {selectedRoom.name} (Floor {selectedRoom.floor})</h3>
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
                          <div className="legend-box selected"></div>
                          <span>Selected</span>
                        </div>
                      </div>

                      {renderTheaterLayout()}
                    </div>
                  ) : (
                    // Step 3: Time slot selection for selected seat
                    // Render time slot selection as before
                    <div className="time-slot-container">
                      <div className="selected-seat-info">
                        <h3>Selected Seat: {selectedSeat.seatNumber} ({selectedSeat.seatType}) in {selectedRoom.name}</h3>
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
                        <h3>Select Time Slot(s) for {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}:</h3>
                        <p className="note">You can select multiple time slots (max 5 hours per day including existing bookings)</p>

                        <div className="time-slots-grid">
                          {timeSlots.map((slot, idx) => (
                            <div
                              key={idx}
                              className={`time-slot ${(slot.isBooked || slot.isUserBooked) ? 'booked' : 'available'} ${selectedTimeSlots.some(ts => ts.startTime === slot.startTime && ts.day === slot.day) ? 'selected' : ''}`}
                              onClick={() => !slot.isBooked && handleTimeSlotSelection(slot)}
                            >
                              {slot.display}
                              {slot.isUserBooked && <span> (Your booking)</span>}
                            </div>
                          ))}
                        </div>

                        <div className="booking-actions">
                          <button
                            className="book-btn"
                            onClick={handleBookingSubmission}
                            disabled={selectedTimeSlots.length === 0 || isBookingDisabled}
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
                // Time-first view mode
                // Render time-first view mode as before - no changes
                <div className="booking-container">
                  {/* Existing time-first view mode rendering */}
                  {!selectedTimeSlot ? (
                    // Step 1: Time slot selection
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

                      <h3>Select a Time Slot for {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}:</h3>
                      <p className="note">You can book up to 5 hours per day</p>

                      <div className="time-slots-grid">
                        {timeSlots.map((slot, idx) => {
                          return (
                            <div
                              key={idx}
                              className={`time-slot ${(slot.isBooked || slot.isUserBooked) ? 'booked' : 'available'}`}
                              onClick={() => !slot.isBooked && handleTimeSlotSelection(slot)}
                            >
                              {slot.display}
                              {slot.isUserBooked && <span> (Your booking)</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : !selectedRoom ? (
                    // Step 2: Room selection after time selection
                    <div className="rooms-container">
                      <div className="selected-time-info">
                        <h3>Selected Time: {selectedTimeSlot.day.charAt(0).toUpperCase() + selectedTimeSlot.day.slice(1)}, {selectedTimeSlot.display}</h3>
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
                    // Step 3: Seat selection after both time and room are selected
                    <div className="theater-container">
                      <div className="selected-room-time-info">
                        <h3>Selected Time: {selectedTimeSlot.day.charAt(0).toUpperCase() + selectedTimeSlot.day.slice(1)}, {selectedTimeSlot.display} | Room: {selectedRoom.name} (Floor {selectedRoom.floor})</h3>
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
                          <div className="legend-box selected"></div>
                          <span>Selected</span>
                        </div>
                      </div>

                      <div >
                        {renderTheaterLayout()}
                      </div>

                      {selectedSeat && (
                        <div className="booking-actions">
                          <button
                            className="book-btn"
                            onClick={handleBookingSubmission}
                          >
                            Book Seat {selectedSeat.seatNumber} for {selectedTimeSlot.day.charAt(0).toUpperCase() + selectedTimeSlot.day.slice(1)}, {selectedTimeSlot.display}
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
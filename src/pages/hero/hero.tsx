import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './hero.css';

interface Seat {
  id: number;
  seatbit: string;
  seatrow: number;
}

export default function Train() {
  const navigate = useNavigate();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [resetError, setResetError] = useState<string>('');
  const [bookingError, setBookingError] = useState<string>('');
  const [seatsToBook, setSeatsToBook] = useState<number>(0);
  const [bookedSeats, setBookedSeats] = useState<number[]>([]);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [unbookedSeats, setUnbookedSeats] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const calculateUnbookedSeats = (seatsData: Seat[]) => {
    return seatsData.reduce((total, row) => {
      return total + row.seatbit.split('').filter(bit => bit === '0').length;
    }, 0);
  };

  const fetchSeats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://booking-backend-9om1.onrender.com/seats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setSeats(data);
      setUnbookedSeats(calculateUnbookedSeats(data));
    } catch (err) {
      console.error('Error fetching seats:', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/signin');
      return;
    }

    // Initial fetch
    fetchSeats();
 
    const intervalId = setInterval(fetchSeats, 1500);
 
    return () => clearInterval(intervalId);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/signin');
  };

  const handleReset = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://booking-backend-9om1.onrender.com/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Reset failed');
      }

      // Refresh seats after reset
      fetchSeats();
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Failed to reset seats');
      console.error('Error resetting seats:', err);
    }
  };

  const handleBookSeats = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');
    setBookedSeats([]);
    setBookingSuccess(false);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://booking-backend-9om1.onrender.com/book_seats', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bookSeats: seatsToBook })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to book seats');
      }

      setBookedSeats(data.bookedSeats);
      setBookingSuccess(true);
      
      // Immediately fetch updated seats
      await fetchSeats();
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Failed to book seats');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSeats = () => {
    return seats.map((row) => {
      const seatBits = row.seatbit.split('');
      return (
        <div key={row.seatrow} className="seat-row">
          <div className="row-number">{row.seatrow}</div>
          <div className="seats">
            {seatBits.map((bit, index) => {
              const seatNumber = ((row.seatrow - 1) * 7) + (index + 1);
              return (
                <div
                  key={index}
                  className={`seat ${bit === '0' ? 'available' : 'booked'}`}
                >
                  {seatNumber}
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="train-container">
      <div className="header">
        <h2>Train Seating</h2>
        <div className="button-group">
          <button className="reset-button" onClick={handleReset}>
            Reset Seats
          </button>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="seating-layout">
          <div className="seats-info">
            <p>Available Seats: {unbookedSeats}</p>
          </div>
          {renderSeats()}
        </div>

        <div className="booking-section">
          <form onSubmit={handleBookSeats}>
            <div className="form-group">
              <label htmlFor="seatsToBook">Number of Seats to Book (max 7):</label>
              <input
                type="number"
                id="seatsToBook"
                min="1"
                max="7"
                value={seatsToBook}
                onChange={(e) => setSeatsToBook(Number(e.target.value))}
                required
                disabled={isLoading}
              />
              <button 
                type="submit" 
                className="book-button" 
                disabled={isLoading}
              >
                {isLoading ? 'Booking...' : 'Book Seats'}
              </button>
            </div>
          </form>

          {bookingError && <div className="error">{bookingError}</div>}
          {bookingSuccess && bookedSeats.length > 0 && (
            <div className="success">
              Successfully booked seats: {bookedSeats.join(', ')}
            </div>
          )}
        </div>
      </div>

      {resetError && <div className="error">{resetError}</div>}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

function BookingPage({ user }) {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API_BASE}/services`);
      setServices(response.data);
    } catch (error) {
      console.error('Failed to fetch services');
    }
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setBooking(null);
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/appointments`, {
        serviceId: selectedService.id,
        userId: user.id,
        date: selectedDate,
        time: selectedTime,
        notes
      });

      setBooking(response.data.appointment);
      setSelectedService(null);
      setSelectedDate('');
      setSelectedTime('');
      setNotes('');
    } catch (error) {
      alert('Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 16; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (booking) {
    return (
      <div className="booking-success">
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h2>Appointment Booked Successfully!</h2>
          
          <div className="appointment-details">
            <h3>Appointment Details</h3>
            <div className="detail-row">
              <strong>Service:</strong> {booking.serviceName}
            </div>
            <div className="detail-row">
              <strong>Department:</strong> {booking.department}
            </div>
            <div className="detail-row">
              <strong>Date:</strong> {booking.date}
            </div>
            <div className="detail-row">
              <strong>Time:</strong> {booking.time}
            </div>
            <div className="detail-row">
              <strong>Reference:</strong> {booking.id}
            </div>
          </div>

          <div className="qr-code">
            <h4>Your QR Code:</h4>
            <img src={booking.qrCode} alt="Appointment QR Code" />
            <p>Show this QR code at your appointment</p>
          </div>

          <div className="action-buttons">
            <button 
              onClick={() => setBooking(null)} 
              className="btn-primary"
            >
              Book Another Appointment
            </button>
            <a href="/dashboard" className="btn-secondary">
              View Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-container">
      <div className="main-content">
        <h2>Book Government Service Appointment</h2>
        
        {!selectedService ? (
          <div className="services-grid">
            <h3>Select a Service</h3>
            <div className="services-list">
              {services.map(service => (
                <div 
                  key={service.id} 
                  className="service-card"
                  onClick={() => handleServiceSelect(service)}
                >
                  <h4>{service.name}</h4>
                  <p className="service-dept">{service.department}</p>
                  <p className="service-desc">{service.description}</p>
                  <p className="service-duration">Duration: {service.duration} minutes</p>
                  <div className="required-docs">
                    <strong>Required Documents:</strong>
                    <ul>
                      {service.requiredDocs.map((doc, index) => (
                        <li key={index}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                  <button className="btn-select">Select This Service</button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="booking-form-container">
            <div className="selected-service">
              <h3>Selected Service: {selectedService.name}</h3>
              <p>Department: {selectedService.department}</p>
              <button 
                onClick={() => setSelectedService(null)}
                className="btn-back"
              >
                ← Choose Different Service
              </button>
            </div>

            <form onSubmit={handleBooking} className="booking-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Preferred Date</label>
                  <input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={getMinDate()}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="time">Preferred Time</label>
                  <select
                    id="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    required
                  >
                    <option value="">Select Time</option>
                    {generateTimeSlots().map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Additional Notes (Optional)</label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requirements or notes..."
                  rows="3"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary btn-book"
              >
                {loading ? 'Booking...' : 'Book Appointment'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingPage;
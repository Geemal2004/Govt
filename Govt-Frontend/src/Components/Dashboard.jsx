import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

function Dashboard({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [feedback, setFeedback] = useState({ rating: 5, comment: '' });
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [user.id]);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${API_BASE}/appointments/user/${user.id}`);
      setAppointments(response.data);
    } catch (error) {
      console.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (appointmentId, files) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('documents', file);
    });

    try {
      await axios.post(`${API_BASE}/appointments/${appointmentId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchAppointments(); // Refresh appointments
      alert('Documents uploaded successfully!');
    } catch (error) {
      alert('Failed to upload documents');
    }
  };

  const submitFeedback = async (appointmentId) => {
    try {
      await axios.post(`${API_BASE}/feedback`, {
        appointmentId,
        userId: user.id,
        rating: feedback.rating,
        comment: feedback.comment
      });
      setShowFeedback(false);
      setFeedback({ rating: 5, comment: '' });
      alert('Feedback submitted successfully!');
    } catch (error) {
      alert('Failed to submit feedback');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffa500';
      case 'confirmed': return '#007bff';
      case 'completed': return '#28a745';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return <div className="loading">Loading appointments...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>My Appointments Dashboard</h2>
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>{appointments.length}</h3>
            <p>Total Appointments</p>
          </div>
          <div className="stat-card">
            <h3>{appointments.filter(a => a.status === 'pending').length}</h3>
            <p>Pending</p>
          </div>
          <div className="stat-card">
            <h3>{appointments.filter(a => a.status === 'completed').length}</h3>
            <p>Completed</p>
          </div>
        </div>
      </div>

      <div className="appointments-section">
        <div className="section-header">
          <h3>Your Appointments</h3>
          <a href="/" className="btn-primary">Book New Appointment</a>
        </div>

        {appointments.length === 0 ? (
          <div className="no-appointments">
            <p>No appointments found.</p>
            <a href="/" className="btn-primary">Book Your First Appointment</a>
          </div>
        ) : (
          <div className="appointments-grid">
            {appointments.map(appointment => (
              <div key={appointment.id} className="appointment-card">
                <div className="appointment-header">
                  <h4>{appointment.serviceName}</h4>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(appointment.status) }}
                  >
                    {appointment.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="appointment-details">
                  <p><strong>Department:</strong> {appointment.department}</p>
                  <p><strong>Date:</strong> {appointment.date}</p>
                  <p><strong>Time:</strong> {appointment.time}</p>
                  <p><strong>Reference:</strong> {appointment.id.substring(0, 8)}...</p>
                  {appointment.notes && (
                    <p><strong>Notes:</strong> {appointment.notes}</p>
                  )}
                </div>

                <div className="appointment-actions">
                  <button 
                    onClick={() => setSelectedAppointment(appointment)}
                    className="btn-secondary"
                  >
                    View Details
                  </button>
                  
                  {appointment.status === 'completed' && (
                    <button 
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setShowFeedback(true);
                      }}
                      className="btn-feedback"
                    >
                      Give Feedback
                    </button>
                  )}
                </div>

                {appointment.status === 'confirmed' && (
                  <div className="document-upload">
                    <label htmlFor={`docs-${appointment.id}`} className="upload-label">
                      📎 Upload Documents
                    </label>
                    <input
                      id={`docs-${appointment.id}`}
                      type="file"
                      multiple
                      onChange={(e) => handleDocumentUpload(appointment.id, e.target.files)}
                      style={{ display: 'none' }}
                    />
                    {appointment.documents && appointment.documents.length > 0 && (
                      <div className="uploaded-docs">
                        <p>Uploaded: {appointment.documents.length} document(s)</p>
                      </div>
                    )}
                  </div>
                )}

                {appointment.qrCode && (
                  <div className="qr-code-small">
                    <img src={appointment.qrCode} alt="QR Code" width="60" height="60" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Appointment Details Modal */}
      {selectedAppointment && !showFeedback && (
        <div className="modal-overlay" onClick={() => setSelectedAppointment(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Appointment Details</h3>
              <button 
                onClick={() => setSelectedAppointment(null)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-section">
                <h4>{selectedAppointment.serviceName}</h4>
                <p><strong>Department:</strong> {selectedAppointment.department}</p>
                <p><strong>Date & Time:</strong> {selectedAppointment.date} at {selectedAppointment.time}</p>
                <p><strong>Status:</strong> {selectedAppointment.status}</p>
                <p><strong>Reference ID:</strong> {selectedAppointment.id}</p>
                {selectedAppointment.notes && (
                  <p><strong>Notes:</strong> {selectedAppointment.notes}</p>
                )}
              </div>

              {selectedAppointment.qrCode && (
                <div className="qr-section">
                  <h4>QR Code</h4>
                  <img src={selectedAppointment.qrCode} alt="Appointment QR Code" />
                  <p>Show this QR code at your appointment</p>
                </div>
              )}

              {selectedAppointment.documents && selectedAppointment.documents.length > 0 && (
                <div className="documents-section">
                  <h4>Uploaded Documents</h4>
                  <ul>
                    {selectedAppointment.documents.map((doc, index) => (
                      <li key={index}>{doc.originalName}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedback && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowFeedback(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Provide Feedback</h3>
              <button 
                onClick={() => setShowFeedback(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="feedback-form">
                <h4>Rate your experience with {selectedAppointment.serviceName}</h4>
                
                <div className="rating-section">
                  <label>Rating:</label>
                  <div className="stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span
                        key={star}
                        className={`star ${star <= feedback.rating ? 'filled' : ''}`}
                        onClick={() => setFeedback({...feedback, rating: star})}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                  <p>Selected: {feedback.rating} star(s)</p>
                </div>

                <div className="comment-section">
                  <label htmlFor="comment">Comments (Optional):</label>
                  <textarea
                    id="comment"
                    value={feedback.comment}
                    onChange={(e) => setFeedback({...feedback, comment: e.target.value})}
                    placeholder="Share your experience..."
                    rows="4"
                  />
                </div>

                <div className="feedback-actions">
                  <button 
                    onClick={() => submitFeedback(selectedAppointment.id)}
                    className="btn-primary"
                  >
                    Submit Feedback
                  </button>
                  <button 
                    onClick={() => setShowFeedback(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

function AdminPanel({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [activeTab, setActiveTab] = useState('appointments');

  useEffect(() => {
    fetchAppointments();
    fetchAnalytics();
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${API_BASE}/appointments/department/${user.department}`);
      setAppointments(response.data);
    } catch (error) {
      console.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_BASE}/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics');
    }
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      await axios.put(`${API_BASE}/appointments/${appointmentId}/status`, {
        status: newStatus
      });
      fetchAppointments(); // Refresh appointments
      setSelectedAppointment(null);
      alert('Appointment status updated successfully!');
    } catch (error) {
      alert('Failed to update appointment status');
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Loading admin panel...</div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>{user.department} Department - Admin Panel</h2>
        <p>Officer: {user.name}</p>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          Appointments ({appointments.length})
        </button>
        <button 
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </div>

      {activeTab === 'appointments' && (
        <div className="appointments-section">
          <div className="section-header">
            <h3>Department Appointments</h3>
            <div className="status-filters">
              <span className="filter-label">Quick filters:</span>
              <button className="filter-btn pending">
                Pending ({appointments.filter(a => a.status === 'pending').length})
              </button>
              <button className="filter-btn confirmed">
                Confirmed ({appointments.filter(a => a.status === 'confirmed').length})
              </button>
            </div>
          </div>

          {appointments.length === 0 ? (
            <div className="no-appointments">
              <p>No appointments found for {user.department} department.</p>
            </div>
          ) : (
            <div className="admin-appointments-table">
              <table>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Citizen</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Documents</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(appointment => (
                    <tr key={appointment.id}>
                      <td>
                        <div className="service-info">
                          <strong>{appointment.serviceName}</strong>
                          <br />
                          <small>Ref: {appointment.id.substring(0, 8)}...</small>
                        </div>
                      </td>
                      <td>
                        <div className="citizen-info">
                          <strong>{appointment.userName}</strong>
                          <br />
                          <small>{appointment.userEmail}</small>
                        </div>
                      </td>
                      <td>
                        <div className="datetime-info">
                          <strong>{appointment.date}</strong>
                          <br />
                          <small>{appointment.time}</small>
                        </div>
                      </td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(appointment.status) }}
                        >
                          {appointment.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="documents-info">
                          {appointment.documents && appointment.documents.length > 0 ? (
                            <span className="docs-count">
                              📎 {appointment.documents.length} file(s)
                            </span>
                          ) : (
                            <span className="no-docs">No documents</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            onClick={() => setSelectedAppointment(appointment)}
                            className="btn-view"
                          >
                            View
                          </button>
                          {appointment.status === 'pending' && (
                            <button 
                              onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                              className="btn-confirm"
                            >
                              Confirm
                            </button>
                          )}
                          {appointment.status === 'confirmed' && (
                            <button 
                              onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                              className="btn-complete"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && analytics && (
        <div className="analytics-section">
          <h3>Department Analytics</h3>
          
          <div className="analytics-grid">
            <div className="analytics-card">
              <h4>Total Appointments</h4>
              <div className="stat-number">{analytics.totalAppointments}</div>
            </div>
            
            <div className="analytics-card">
              <h4>Pending Review</h4>
              <div className="stat-number pending">{analytics.pendingAppointments}</div>
            </div>
            
            <div className="analytics-card">
              <h4>Completed</h4>
              <div className="stat-number completed">{analytics.completedAppointments}</div>
            </div>
            
            <div className="analytics-card">
              <h4>Average Rating</h4>
              <div className="stat-number">{analytics.avgRating}/5 ⭐</div>
              <small>{analytics.totalFeedback} reviews</small>
            </div>
          </div>

          <div className="department-stats">
            <h4>Appointments by Department</h4>
            <div className="dept-stats-grid">
              {Object.entries(analytics.departmentStats).map(([dept, count]) => (
                <div key={dept} className="dept-stat">
                  <span className="dept-name">{dept}</span>
                  <span className="dept-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="recommendations">
            <h4>📊 Quick Insights</h4>
            <ul>
              <li>Peak booking time appears to be weekday mornings</li>
              <li>Document pre-submission helps reduce appointment time by 40%</li>
              <li>Average citizen satisfaction: {analytics.avgRating}/5 stars</li>
              {analytics.pendingAppointments > 5 && (
                <li className="warning">⚠️ High number of pending appointments - consider reviewing soon</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="modal-overlay" onClick={() => setSelectedAppointment(null)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Appointment Details - {selectedAppointment.serviceName}</h3>
              <button 
                onClick={() => setSelectedAppointment(null)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="appointment-details-grid">
                <div className="detail-section">
                  <h4>Citizen Information</h4>
                  <p><strong>Name:</strong> {selectedAppointment.userName}</p>
                  <p><strong>Email:</strong> {selectedAppointment.userEmail}</p>
                  <p><strong>Appointment ID:</strong> {selectedAppointment.id}</p>
                </div>

                <div className="detail-section">
                  <h4>Appointment Details</h4>
                  <p><strong>Service:</strong> {selectedAppointment.serviceName}</p>
                  <p><strong>Date:</strong> {selectedAppointment.date}</p>
                  <p><strong>Time:</strong> {selectedAppointment.time}</p>
                  <p><strong>Status:</strong> {selectedAppointment.status}</p>
                  <p><strong>Created:</strong> {formatDate(selectedAppointment.createdAt)}</p>
                </div>
              </div>

              {selectedAppointment.notes && (
                <div className="notes-section">
                  <h4>Citizen Notes</h4>
                  <p>{selectedAppointment.notes}</p>
                </div>
              )}

              {selectedAppointment.documents && selectedAppointment.documents.length > 0 && (
                <div className="documents-section">
                  <h4>Pre-submitted Documents</h4>
                  <div className="documents-list">
                    {selectedAppointment.documents.map((doc, index) => (
                      <div key={index} className="document-item">
                        <span>📎 {doc.originalName}</span>
                        <small>Uploaded: {formatDate(doc.uploadedAt)}</small>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="status-actions">
                <h4>Update Appointment Status</h4>
                <div className="status-buttons">
                  {selectedAppointment.status === 'pending' && (
                    <button 
                      onClick={() => updateAppointmentStatus(selectedAppointment.id, 'confirmed')}
                      className="btn-confirm"
                    >
                      ✅ Confirm Appointment
                    </button>
                  )}
                  {selectedAppointment.status === 'confirmed' && (
                    <button 
                      onClick={() => updateAppointmentStatus(selectedAppointment.id, 'completed')}
                      className="btn-complete"
                    >
                      ✅ Mark as Completed
                    </button>
                  )}
                  {selectedAppointment.status !== 'cancelled' && (
                    <button 
                      onClick={() => updateAppointmentStatus(selectedAppointment.id, 'cancelled')}
                      className="btn-cancel"
                    >
                      ❌ Cancel Appointment
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE}/login`, { email });
      onLogin(response.data.user);
    } catch (error) {
      setError('Login failed. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login to Government Services</h2>
        <p className="login-subtitle">Access your government services appointments</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="demo-accounts">
          <h4>Demo Accounts:</h4>
          <div className="demo-buttons">
            <button 
              onClick={() => setEmail('john@email.com')}
              className="btn-demo"
            >
              Citizen (john@email.com)
            </button>
            <button 
              onClick={() => setEmail('officer@gov.lk')}
              className="btn-demo"
            >
              Officer (officer@gov.lk)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
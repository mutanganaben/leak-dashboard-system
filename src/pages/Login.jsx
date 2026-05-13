import React, { useState } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import { Droplets, Lock, Mail } from 'lucide-react';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (localStorage.getItem('authToken')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      //  FIX 1: uses api service (env-aware base URL, no more localhost)
      //  FIX 2: api.js unwraps { success, data } so data.token works correctly
      const data = await api.post('/auth/login', { email, password });
      localStorage.setItem('authToken', data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-header">
        <div className="login-logo-wrap">
          <div className="login-logo-box">
            <Droplets size={40} strokeWidth={2} />
          </div>
          <h2 className="login-title">IoT Water Monitor</h2>
          <p className="login-subtitle">Sign in to your dashboard account</p>
        </div>
      </div>

      <div className="login-form-wrapper">
        <div className="login-form-card">
          {error && <div style={{ color: '#ef4444', backgroundColor: '#fee2e2', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
          <form className="login-form" onSubmit={handleLogin}>
            <div>
              <label className="login-label">Email address</label>
              <div className="login-input-wrap">
                <div className="login-input-icon">
                  <Mail style={{height: '20px', width: '20px', color: '#9ca3af'}} />
                </div>
                <input
                  type="email" required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input"
                  placeholder="admin@iot-water.com"
                />
              </div>
            </div>

            <div>
              <label className="login-label">Password</label>
              <div className="login-input-wrap">
                <div className="login-input-icon">
                  <Lock style={{height: '20px', width: '20px', color: '#9ca3af'}} />
                </div>
                <input
                  type="password" required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="login-options-row">
              <div className="login-checkbox-wrap">
                <input
                  id="remember-me" name="remember-me" type="checkbox"
                  className="login-checkbox"
                />
                <label htmlFor="remember-me" className="login-checkbox-label">
                  Remember me
                </label>
              </div>

              <div className="login-link-wrap">
                <a href="#" className="login-link">Forgot your password?</a>
              </div>
            </div>

            <div>
              <button type="submit" className="login-submit-btn">
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

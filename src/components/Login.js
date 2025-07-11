import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import company from '../imgs/company.png';
import '../styles/auth.css';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8090/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password
        }),
      });
      
      // Check for response status first
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid username or password');
        } else if (response.status === 404) {
          throw new Error('Account not found');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later');
        }
      }
      
      // Try to parse JSON
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError);
          throw new Error('Invalid response from server');
        }
      } else {
        const textResponse = await response.text();
        console.error('Unexpected response format:', textResponse);
        throw new Error('Invalid response format from server');
      }
      
      // Check for error message in response data
      if (data && data.error) {
        throw new Error(data.error);
      }
      
      // Store user info in local storage or context
      if (data && data.user) {
        // Store both user data and role with password for API authentication
        const userWithAuth = {
          ...data.user,
          password: password // Store password for API authentication
        };
        localStorage.setItem('user', JSON.stringify(userWithAuth));
        
        // For development testing with static test account
        if (username === 'admin' && password === 'admin') {
          localStorage.setItem('userRole', 'ADMIN');
        } else if (username === 'test' && password === 'test') {
          localStorage.setItem('userRole', 'USER');
        } else {
          // In production, this would come from the backend
          localStorage.setItem('userRole', data.user.role || 'USER');
        }
        
        // Login successful
        onLogin(true);
      } else {
        throw new Error('Invalid response data from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-card">
          <div className="login-header">
            <img src={company} alt="Company Logo" className="login-logo" />
            <h1 className="login-title">Notification Manager</h1>
            <p className="login-subtitle">Sign in to manage your TV notifications</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username" className="form-label">Username</label>
              <input
                type="text"
                id="username"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className={`login-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>Don't have an account? <Link to="/signup" className="auth-link">Sign Up</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

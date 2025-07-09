import React, { useState } from 'react';
import company from '../imgs/company.png';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Static test account
  const TEST_CREDENTIALS = {
    username: 'test',
    password: 'test'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (username === TEST_CREDENTIALS.username && password === TEST_CREDENTIALS.password) {
      onLogin(true);
    } else {
      setError('Invalid username or password. Try username: "test", password: "test"');
    }
    
    setIsLoading(false);
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
            <div className="test-credentials">
              <h4>Test Credentials:</h4>
              <p><strong>Username:</strong> test</p>
              <p><strong>Password:</strong> test</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

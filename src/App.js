import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import company from './imgs/company.png';
import './styles/base.css';
import './styles/navbar.css';
import './styles/sidebar.css';
import './styles/welcome.css';
import './styles/tvpage.css';
import './styles/auth.css';
import './styles/admin.css';
import TV1 from './tvpages/tv1';
import TV2 from './tvpages/tv2';
import TV3 from './tvpages/tv3';
import TV4 from './tvpages/tv4';
import Login from './components/Login';
import Signup from './components/Signup';
import AdminPanel from './components/AdminPanel';

// Component to handle navigation and layout
function NavigationLayoutWithLogout({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Add sidebar state class to body
  useEffect(() => {
    document.body.classList.toggle('sidebar-closed', !sidebarOpen);
    // Force a layout recalculation to ensure proper sizing
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
  }, [sidebarOpen]);

  // Get current TV number from the path
  const getCurrentTV = () => {
    const path = location.pathname;
    if (path === '/tv1') return 1;
    if (path === '/tv2') return 2;
    if (path === '/tv3') return 3;
    if (path === '/tv4') return 4;
    return null;
  };

  const selectedTV = getCurrentTV();

  const handleTVSelection = (tvNumber) => {
    navigate(`/tv${tvNumber}`);
  };

  return (
    <div className={`App ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <img src={company} alt="Company Logo" className="company-logo" />
          <h1 className="navbar-title">Notification Manager</h1>
          <div className="navbar-actions">
            <button className="logout-button" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar Menu */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <h3 className="sidebar-title">Select TV</h3>
        <nav className="tv-menu">
          {[1, 2, 3, 4].map((tvNumber) => (
            <button
              key={tvNumber}
              className={`tv-menu-item ${selectedTV === tvNumber ? 'active' : ''}`}
              onClick={() => handleTVSelection(tvNumber)}
            >
              <div className="tv-menu-icon">📺</div>
              <span>TV {tvNumber}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-area">
          <Routes>
            <Route path="/tv1" element={<TV1 />} />
            <Route path="/tv2" element={<TV2 />} />
            <Route path="/tv3" element={<TV3 />} />
            <Route path="/tv4" element={<TV4 />} />
            <Route path="/" element={
              <div className="welcome-section">
                <h1>Welcome to Notification Manager</h1>
                <p>Select a TV from the sidebar to manage notifications</p>
                <div className="tv-grid">
                  {[1, 2, 3, 4].map((tvNumber) => (
                    <div 
                      key={tvNumber}
                      className="tv-card-preview"
                      onClick={() => handleTVSelection(tvNumber)}
                    >
                      <div className="tv-icon">📺</div>
                      <h3>Television {tvNumber}</h3>
                      <p>Click to manage</p>
                    </div>
                  ))}
                </div>
              </div>
            } />
          </Routes>
        </div>
      </main>
    </div>
  );
}

// Admin Panel Layout with navigation and logout
function AdminPanelLayout({ onLogout }) {
  // Force layout recalculation to ensure admin panel displays correctly
  useEffect(() => {
    // Add small delay to let DOM update
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="admin-layout">
      <nav className="navbar">
        <div className="navbar-content">
          <img src={company} alt="Company Logo" className="company-logo" />
          <h1 className="navbar-title">Admin Panel</h1>
          <div className="navbar-actions">
            <button className="logout-button" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="admin-main-content">
        <AdminPanel />
      </main>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const user = localStorage.getItem('user');
    const storedRole = localStorage.getItem('userRole');
    
    if (user) {
      setIsAuthenticated(true);
      setUserRole(storedRole || 'USER');
    }
  }, []);

  const handleLogin = (success) => {
    setIsAuthenticated(success);
    if (success) {
      // Get user role after login
      const storedRole = localStorage.getItem('userRole');
      setUserRole(storedRole || 'USER');
    }
  };

  const handleSignupSuccess = () => {
    // Redirect to login after successful signup
    window.location.href = '/login';
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    setIsAuthenticated(false);
    setUserRole(null);
  };

  // Render the appropriate layout based on user role
  const renderAuthenticatedContent = () => {
    if (userRole === 'ADMIN') {
      // Add admin-view class to body for admin-specific styles
      document.body.classList.add('admin-view');
      document.body.classList.remove('sidebar-closed');
      document.documentElement.classList.add('admin-mode');
      return <AdminPanelLayout onLogout={handleLogout} />;
    } else {
      // Remove admin-view class when not in admin mode
      document.body.classList.remove('admin-view');
      document.documentElement.classList.remove('admin-mode');
      return <NavigationLayoutWithLogout onLogout={handleLogout} />;
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
        } />
        <Route path="/signup" element={
          isAuthenticated ? <Navigate to="/" /> : <Signup onSignupSuccess={handleSignupSuccess} />
        } />
        <Route path="*" element={
          isAuthenticated ? renderAuthenticatedContent() : <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  );
}

export default App;

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import company from './imgs/company.png';
import './App.css';
import TV1 from './tvpages/tv1';
import TV2 from './tvpages/tv2';
import TV3 from './tvpages/tv3';
import TV4 from './tvpages/tv4';
import Login from './components/Login';

// Component to handle navigation and layout
function NavigationLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = (success) => {
    setIsAuthenticated(success);
  };

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Show main app if authenticated
  return (
    <Router>
      <NavigationLayout />
    </Router>
  );
}

export default App;

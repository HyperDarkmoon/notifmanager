import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import company from "./imgs/company.png";
import "./styles/base.css";
import "./styles/navbar.css";
import "./styles/sidebar.css";
import "./styles/welcome.css";
import "./styles/tvpage.css";
import "./styles/auth.css";
import "./styles/admin.css";
import DynamicTVPage from "./components/DynamicTVPage";
import Login from "./components/Login";
import Signup from "./components/Signup";
import AdminPanel from "./components/AdminPanel";
import DeviceData from "./components/DeviceData";
import { useTVData } from "./utils/useTVData";

// Component to handle navigation and layout
function NavigationLayoutWithLogout({ onLogout, isAuthenticated }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarPage, setSidebarPage] = useState(1);
  const [welcomePage, setWelcomePage] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();
  const { tvs, isLoading: isLoadingTVs } = useTVData();

  // Pagination settings for sidebar
  const SIDEBAR_TVS_PER_PAGE = 8;
  const totalSidebarPages = Math.ceil(tvs.length / SIDEBAR_TVS_PER_PAGE);
  const sidebarStartIndex = (sidebarPage - 1) * SIDEBAR_TVS_PER_PAGE;
  const sidebarEndIndex = sidebarStartIndex + SIDEBAR_TVS_PER_PAGE;
  const paginatedSidebarTVs = tvs.slice(sidebarStartIndex, sidebarEndIndex);

  // Pagination settings for welcome page
  const WELCOME_TVS_PER_PAGE = 6; // Show 4 TVs per page for better layout
  const totalWelcomePages = Math.ceil(tvs.length / WELCOME_TVS_PER_PAGE);
  const welcomeStartIndex = (welcomePage - 1) * WELCOME_TVS_PER_PAGE;
  const welcomeEndIndex = welcomeStartIndex + WELCOME_TVS_PER_PAGE;
  const paginatedWelcomeTVs = tvs.slice(welcomeStartIndex, welcomeEndIndex);

  // Add sidebar state class to body
  useEffect(() => {
    document.body.classList.toggle("sidebar-closed", !sidebarOpen);
    // Force a layout recalculation to ensure proper sizing
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 300);
  }, [sidebarOpen]);

  // Get current TV name from the path
  const getCurrentTVName = () => {
    const path = location.pathname;
    const tvMatch = path.match(/^\/tv\/(.+)$/);
    return tvMatch ? tvMatch[1] : null;
  };

  const selectedTVName = getCurrentTVName();

  const handleTVSelection = (tvName) => {
    navigate(`/tv/${tvName}`);
  };

  const handleSidebarPageChange = (page) => {
    setSidebarPage(page);
  };

  const handleWelcomePageChange = (page) => {
    setWelcomePage(page);
  };

  return (
    <div className={`App ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
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
          <h1 className="navbar-title">TVManager</h1>
          <div className="navbar-actions">
            {isAuthenticated ? (
              <button className="logout-button" onClick={onLogout}>
                Logout
              </button>
            ) : (
              <button 
                className="login-button" 
                onClick={() => navigate('/login')}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Sidebar Menu */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <h3 className="sidebar-title">Select TV</h3>
        <nav className="tv-menu">
          {isLoadingTVs ? (
            <div className="loading-message">Loading TVs...</div>
          ) : tvs.length === 0 ? (
            <div className="no-content">
              <span>No TVs available</span>
            </div>
          ) : (
            <>
              {paginatedSidebarTVs.map((tv) => (
                <button
                  key={tv.value}
                  className={`tv-menu-item ${
                    selectedTVName === tv.value ? "active" : ""
                  }`}
                  onClick={() => handleTVSelection(tv.value)}
                >
                  <div className="tv-menu-icon">📺</div>
                  <span>{tv.label}</span>
                </button>
              ))}
              
              {/* Sidebar Pagination */}
              {totalSidebarPages > 1 && (
                <div className="sidebar-pagination">
                  <div className="sidebar-page-info">
                    <small>
                      {sidebarStartIndex + 1}-{Math.min(sidebarEndIndex, tvs.length)} of {tvs.length}
                    </small>
                  </div>
                  <div className="sidebar-page-controls">
                    <button
                      className="sidebar-page-btn"
                      onClick={() => handleSidebarPageChange(sidebarPage - 1)}
                      disabled={sidebarPage === 1}
                      title="Previous TVs"
                    >
                      ←
                    </button>
                    <span className="sidebar-page-current">
                      {sidebarPage}/{totalSidebarPages}
                    </span>
                    <button
                      className="sidebar-page-btn"
                      onClick={() => handleSidebarPageChange(sidebarPage + 1)}
                      disabled={sidebarPage === totalSidebarPages}
                      title="Next TVs"
                    >
                      →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-area">
          <Routes>
            <Route path="/tv/:tvName" element={<DynamicTVPage />} />
            <Route
              path="/"
              element={
                <div className="welcome-section">
                  <h1>Welcome to TVManager</h1>
                  <p>Select a TV from the sidebar to manage notifications</p>
                  
                  {/* TV Count Info */}
                  {!isLoadingTVs && tvs.length > 0 && (
                    <div className="tv-count-info">
                      <span>
                        Showing {welcomeStartIndex + 1}-{Math.min(welcomeEndIndex, tvs.length)} of {tvs.length} TV{tvs.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  
                  <div className="tv-grid">
                    {isLoadingTVs ? (
                      <div className="loading-message">Loading TVs...</div>
                    ) : tvs.length === 0 ? (
                      <div className="no-content">
                        <div className="empty-icon">📺</div>
                        <span>No TVs available. Contact admin to add TVs.</span>
                      </div>
                    ) : (
                      paginatedWelcomeTVs.map((tv) => (
                        <div
                          key={tv.value}
                          className="tv-card-preview"
                          onClick={() => handleTVSelection(tv.value)}
                        >
                          <div className="tv-icon">📺</div>
                          <h3>{tv.label}</h3>
                          <p>Click to manage</p>
                          {tv.location && <small>{tv.location}</small>}
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Welcome Page Pagination */}
                  {!isLoadingTVs && totalWelcomePages > 1 && (
                    <div className="welcome-pagination">
                      <button
                        className="pagination-btn"
                        onClick={() => handleWelcomePageChange(welcomePage - 1)}
                        disabled={welcomePage === 1}
                      >
                        ← Previous
                      </button>
                      
                      <div className="page-numbers">
                        {(() => {
                          const pages = [];
                          const maxVisible = 5;
                          const start = Math.max(1, welcomePage - Math.floor(maxVisible / 2));
                          const end = Math.min(totalWelcomePages, start + maxVisible - 1);
                          
                          if (start > 1) {
                            pages.push(1);
                            if (start > 2) pages.push('...');
                          }
                          
                          for (let i = start; i <= end; i++) {
                            pages.push(i);
                          }
                          
                          if (end < totalWelcomePages) {
                            if (end < totalWelcomePages - 1) pages.push('...');
                            pages.push(totalWelcomePages);
                          }
                          
                          return pages.map((page, index) => (
                            page === '...' ? (
                              <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                            ) : (
                              <button
                                key={page}
                                className={`page-number ${welcomePage === page ? 'active' : ''}`}
                                onClick={() => handleWelcomePageChange(page)}
                              >
                                {page}
                              </button>
                            )
                          ));
                        })()}
                      </div>
                      
                      <button
                        className="pagination-btn"
                        onClick={() => handleWelcomePageChange(welcomePage + 1)}
                        disabled={welcomePage === totalWelcomePages}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              }
            />
          </Routes>
        </div>
      </main>
    </div>
  );
}

// Login Layout with navbar
function LoginLayout({ onLogin }) {
  const navigate = useNavigate();

  return (
    <div className="login-layout">
      <nav className="navbar">
        <div className="navbar-content">
          <img src={company} alt="Company Logo" className="company-logo" />
          <h1 className="navbar-title">TVManager</h1>
          <div className="navbar-actions">
            <button 
              className="login-button" 
              onClick={() => navigate('/')}
            >
              Back to TVs
            </button>
          </div>
        </div>
      </nav>
      <div className="login-content">
        <Login onLogin={onLogin} />
      </div>
    </div>
  );
}

// Signup Layout with navbar
function SignupLayout({ onSignupSuccess }) {
  const navigate = useNavigate();

  return (
    <div className="login-layout">
      <nav className="navbar">
        <div className="navbar-content">
          <img src={company} alt="Company Logo" className="company-logo" />
          <h1 className="navbar-title">TVManager</h1>
          <div className="navbar-actions">
            <button 
              className="login-button" 
              onClick={() => navigate('/')}
            >
              Back to TVs
            </button>
          </div>
        </div>
      </nav>
      <div className="login-content">
        <Signup onSignupSuccess={onSignupSuccess} />
      </div>
    </div>
  );
}

// Admin Panel Layout with navigation and logout
function AdminPanelLayout({ onLogout }) {
  // Force layout recalculation to ensure admin panel displays correctly
  useEffect(() => {
    // Add small delay to let DOM update
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
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
    const user = localStorage.getItem("user");
    const storedRole = localStorage.getItem("userRole");

    if (user) {
      setIsAuthenticated(true);
      setUserRole(storedRole || "USER");
    }
  }, []);

  const handleLogin = (success) => {
    setIsAuthenticated(success);
    if (success) {
      // Get user role after login
      const storedRole = localStorage.getItem("userRole");
      setUserRole(storedRole || "USER");
      
      // Redirect admin users to admin panel
      if (storedRole === "ADMIN") {
        window.location.href = "/admin";
      }
    }
  };

  const handleSignupSuccess = () => {
    // Redirect to login after successful signup
    window.location.href = "/login";
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    setIsAuthenticated(false);
    setUserRole(null);
  };

  // Render the appropriate layout based on authentication and user role
  const renderContent = () => {
    // Remove admin-view class when not in admin mode
    document.body.classList.remove("admin-view");
    document.documentElement.classList.remove("admin-mode");
    return <NavigationLayoutWithLogout onLogout={handleLogout} isAuthenticated={isAuthenticated} />;
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated && userRole === "ADMIN" ? (
              <Navigate to="/admin" />
            ) : (
              <LoginLayout onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            isAuthenticated && userRole === "ADMIN" ? (
              <Navigate to="/admin" />
            ) : (
              <SignupLayout onSignupSuccess={handleSignupSuccess} />
            )
          }
        />
        <Route
          path="/admin/*"
          element={
            isAuthenticated && userRole === "ADMIN" ? (
              (() => {
                // Add admin-view class to body for admin-specific styles
                document.body.classList.add("admin-view");
                document.body.classList.remove("sidebar-closed");
                document.documentElement.classList.add("admin-mode");
                return <AdminPanelLayout onLogout={handleLogout} />;
              })()
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/device-data"
          element={<DeviceData />}
        />
        <Route
          path="*"
          element={renderContent()}
        />
      </Routes>
    </Router>
  );
}

export default App;

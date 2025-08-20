import React, { useState, useEffect, useCallback } from "react";
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
import { naturalSortTVs } from "./utils/sortingUtils";

// Component to handle navigation and layout
function NavigationLayoutWithLogout({ onLogout, isAuthenticated }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarPage, setSidebarPage] = useState(1);
  const [welcomePage, setWelcomePage] = useState(1);
  const [selectedSidebarIndex, setSelectedSidebarIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { tvs, isLoading: isLoadingTVs } = useTVData();

  // Natural sort function to handle TV1, TV2, ..., TV10 correctly
  const naturalSort = naturalSortTVs;

  // Filter and sort TVs
  const filteredAndSortedTVs = React.useMemo(() => {
    let filtered = tvs;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = tvs.filter(tv => 
        tv.label.toLowerCase().includes(query) ||
        tv.value.toLowerCase().includes(query) ||
        (tv.location && tv.location.toLowerCase().includes(query))
      );
    }
    
    // Sort naturally
    return filtered.sort(naturalSort);
  }, [tvs, searchQuery, naturalSort]);

  // Pagination settings for sidebar
  const SIDEBAR_TVS_PER_PAGE = 4;
  const totalSidebarPages = Math.ceil(filteredAndSortedTVs.length / SIDEBAR_TVS_PER_PAGE);
  const sidebarStartIndex = (sidebarPage - 1) * SIDEBAR_TVS_PER_PAGE;
  const sidebarEndIndex = sidebarStartIndex + SIDEBAR_TVS_PER_PAGE;
  const paginatedSidebarTVs = filteredAndSortedTVs.slice(sidebarStartIndex, sidebarEndIndex);

  // Pagination settings for welcome page
  const WELCOME_TVS_PER_PAGE = 2; // Show 6 TVs per page for better layout
  const totalWelcomePages = Math.ceil(filteredAndSortedTVs.length / WELCOME_TVS_PER_PAGE);
  const welcomeStartIndex = (welcomePage - 1) * WELCOME_TVS_PER_PAGE;
  const welcomeEndIndex = welcomeStartIndex + WELCOME_TVS_PER_PAGE;
  const paginatedWelcomeTVs = filteredAndSortedTVs.slice(welcomeStartIndex, welcomeEndIndex);

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

  const handleTVSelection = useCallback((tvName) => {
    navigate(`/tv/${tvName}`);
  }, [navigate]);

  const handleSidebarPageChange = (page) => {
    setSidebarPage(page);
  };

  const handleWelcomePageChange = (page) => {
    setWelcomePage(page);
  };

  // Keyboard navigation for smart TVs
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle arrow keys when sidebar is open and not in an input field
      if (!sidebarOpen || event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedSidebarIndex(prev => {
            const newIndex = Math.min(prev + 1, paginatedSidebarTVs.length - 1);
            // Auto-scroll to keep selected item visible
            setTimeout(() => {
              const selectedElement = document.querySelector(`.tv-menu-item:nth-child(${newIndex + 1})`);
              if (selectedElement) {
                selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }, 0);
            return newIndex;
          });
          break;

        case 'ArrowUp':
          event.preventDefault();
          setSelectedSidebarIndex(prev => {
            const newIndex = Math.max(prev - 1, 0);
            // Auto-scroll to keep selected item visible
            setTimeout(() => {
              const selectedElement = document.querySelector(`.tv-menu-item:nth-child(${newIndex + 1})`);
              if (selectedElement) {
                selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }, 0);
            return newIndex;
          });
          break;

        case 'ArrowRight':
          event.preventDefault();
          if (sidebarPage < totalSidebarPages) {
            handleSidebarPageChange(sidebarPage + 1);
            setSelectedSidebarIndex(0);
          }
          break;

        case 'ArrowLeft':
          event.preventDefault();
          if (sidebarPage > 1) {
            handleSidebarPageChange(sidebarPage - 1);
            setSelectedSidebarIndex(0);
          }
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          if (paginatedSidebarTVs[selectedSidebarIndex]) {
            handleTVSelection(paginatedSidebarTVs[selectedSidebarIndex].value);
          }
          break;

        case '/':
          event.preventDefault();
          // Focus search input
          const searchInput = document.querySelector('.tv-search-input');
          if (searchInput) {
            searchInput.focus();
          }
          break;

        case 'Escape':
          event.preventDefault();
          // Clear search if there's a query, otherwise blur any focused element
          if (searchQuery) {
            setSearchQuery("");
          } else {
            document.activeElement?.blur();
          }
          break;

        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, selectedSidebarIndex, paginatedSidebarTVs, sidebarPage, totalSidebarPages, handleTVSelection, searchQuery]);

  // Reset selected index when page changes or TVs change
  useEffect(() => {
    setSelectedSidebarIndex(0);
  }, [sidebarPage, filteredAndSortedTVs.length]);

  // Reset pagination when search query changes
  useEffect(() => {
    setSidebarPage(1);
    setWelcomePage(1);
    setSelectedSidebarIndex(0);
  }, [searchQuery]);

  // Add wheel scrolling support for sidebar
  useEffect(() => {
    const handleWheel = (event) => {
      const sidebar = document.querySelector('.tv-menu');
      if (sidebar && sidebar.contains(event.target)) {
        // Allow natural scrolling behavior for the sidebar
        event.stopPropagation();
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: true });
    return () => document.removeEventListener('wheel', handleWheel);
  }, []);

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
        
        {/* Search Input */}
        <div className="tv-search-container">
          <input
            type="text"
            className="tv-search-input"
            placeholder="Search TVs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchQuery("");
                e.target.blur();
              }
            }}
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={() => setSearchQuery("")}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Search Results Info */}
        {searchQuery && (
          <div className="search-results-info">
            <small>
              {filteredAndSortedTVs.length} of {tvs.length} TVs match "{searchQuery}"
            </small>
          </div>
        )}

        <nav className="tv-menu">
          {isLoadingTVs ? (
            <div className="loading-message">Loading TVs...</div>
          ) : filteredAndSortedTVs.length === 0 ? (
            <div className="no-content">
              {searchQuery ? (
                <span>No TVs found matching "{searchQuery}"</span>
              ) : (
                <span>No TVs available</span>
              )}
            </div>
          ) : (
            <>
              {paginatedSidebarTVs.map((tv, index) => (
                <button
                  key={tv.value}
                  className={`tv-menu-item ${
                    selectedTVName === tv.value ? "active" : ""
                  } ${index === selectedSidebarIndex ? "keyboard-focused" : ""}`}
                  onClick={() => handleTVSelection(tv.value)}
                  tabIndex={index === selectedSidebarIndex ? 0 : -1}
                  data-tv-index={index}
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
                      {sidebarStartIndex + 1}-{Math.min(sidebarEndIndex, filteredAndSortedTVs.length)} of {filteredAndSortedTVs.length}
                      {searchQuery && ` (filtered)`}
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
                  {!isLoadingTVs && filteredAndSortedTVs.length > 0 && (
                    <div className="tv-count-info">
                      <span>
                        Showing {welcomeStartIndex + 1}-{Math.min(welcomeEndIndex, filteredAndSortedTVs.length)} of {filteredAndSortedTVs.length} TV{filteredAndSortedTVs.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  
                  <div className="tv-grid">
                    {isLoadingTVs ? (
                      <div className="loading-message">Loading TVs...</div>
                    ) : filteredAndSortedTVs.length === 0 ? (
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

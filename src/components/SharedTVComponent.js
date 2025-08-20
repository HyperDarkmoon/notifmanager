import React, { useState, useEffect, useRef } from "react";
import { useTVLogic } from "../utils/useTVLogic";
import {
  renderInfoDisplay,
  renderCustomDisplay,
  renderProfileSlide,
  renderContentIndicators,
} from "../utils/tvUtils";
import "../styles/tvpage.css";

const SharedTVComponent = ({ tvId, initialTemperature, initialPressure }) => {
  const {
    contentIndex,
    imageSetIndex,
    videoSetIndex,
    temperature,
    pressure,
    humidity,
    customContent,
    currentTime,
    isVideoPlaying,
    handleVideoStart,
    handleVideoEnd,
  } = useTVLogic(tvId, initialTemperature, initialPressure);

  // Cursor auto-hide functionality
  const [isCursorVisible, setIsCursorVisible] = useState(true);
  const [sidebarNavigationEnabled, setSidebarNavigationEnabled] = useState(false);
  const cursorTimeoutRef = useRef(null);
  const navigationTimeoutRef = useRef(null);
  const tvContentRef = useRef(null);

  // Function to show cursor and reset timer
  const handleMouseMove = () => {
    setIsCursorVisible(true);
    
    // Clear existing timeout
    if (cursorTimeoutRef.current) {
      clearTimeout(cursorTimeoutRef.current);
    }
    
    // Set new timeout to hide cursor after 5 seconds
    cursorTimeoutRef.current = setTimeout(() => {
      setIsCursorVisible(false);
    }, 5000);
  };

  // Function to show navigation help and auto-hide
  const showNavigationHelp = () => {
    setSidebarNavigationEnabled(true);
    
    // Add visual indicator to sidebar
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.add('smart-tv-mode');
    }
    
    // Clear existing navigation timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }
    
    // Auto-hide navigation help after 5 seconds
    navigationTimeoutRef.current = setTimeout(() => {
      setSidebarNavigationEnabled(false);
      if (sidebar) {
        sidebar.classList.remove('smart-tv-mode');
      }
    }, 5000);
  };

  // Set up event listeners
  useEffect(() => {
    const tvElement = tvContentRef.current;
    
    const handleKeyDown = (event) => {
      // Handle TV remote navigation
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          // Trigger sidebar navigation mode for smart TVs
          showNavigationHelp();
          // Simulate sidebar scroll down
          const sidebar = document.querySelector('.sidebar');
          if (sidebar) {
            const tvMenu = sidebar.querySelector('.tv-menu');
            if (tvMenu) {
              tvMenu.scrollBy({ top: 60, behavior: 'smooth' });
            }
          }
          break;
          
        case 'ArrowUp':
          event.preventDefault();
          // Trigger sidebar navigation mode for smart TVs
          showNavigationHelp();
          // Simulate sidebar scroll up
          const sidebarUp = document.querySelector('.sidebar');
          if (sidebarUp) {
            const tvMenuUp = sidebarUp.querySelector('.tv-menu');
            if (tvMenuUp) {
              tvMenuUp.scrollBy({ top: -60, behavior: 'smooth' });
            }
          }
          break;
          
        case 'ArrowLeft':
          event.preventDefault();
          showNavigationHelp();
          // Navigate to previous page in sidebar
          const prevPageBtn = document.querySelector('.sidebar-page-btn[title="Previous TVs"]');
          if (prevPageBtn && !prevPageBtn.disabled) {
            prevPageBtn.click();
          }
          break;
          
        case 'ArrowRight':
          event.preventDefault();
          showNavigationHelp();
          // Navigate to next page in sidebar
          const nextPageBtn = document.querySelector('.sidebar-page-btn[title="Next TVs"]');
          if (nextPageBtn && !nextPageBtn.disabled) {
            nextPageBtn.click();
          }
          break;
          
        case 'Enter':
        case ' ':
          event.preventDefault();
          // Activate focused TV item
          const focusedItem = document.querySelector('.tv-menu-item.keyboard-focused');
          if (focusedItem) {
            focusedItem.click();
          } else {
            // If no item is focused, focus the first one
            const firstItem = document.querySelector('.tv-menu-item');
            if (firstItem) {
              firstItem.focus();
            }
          }
          break;
          
        case 'Escape':
          event.preventDefault();
          setSidebarNavigationEnabled(false);
          const sidebarEsc = document.querySelector('.sidebar');
          if (sidebarEsc) {
            sidebarEsc.classList.remove('smart-tv-mode');
          }
          break;
          
        default:
          break;
      }
      
      // Show cursor on any key press
      handleMouseMove();
    };
    
    if (tvElement) {
      tvElement.addEventListener('mousemove', handleMouseMove);
      tvElement.addEventListener('mouseenter', handleMouseMove);
      tvElement.addEventListener('keydown', handleKeyDown);
      
      // Make TV content focusable for keyboard events
      tvElement.setAttribute('tabindex', '0');
      
      // Start the initial timer
      handleMouseMove();
      
      return () => {
        tvElement.removeEventListener('mousemove', handleMouseMove);
        tvElement.removeEventListener('mouseenter', handleMouseMove);
        tvElement.removeEventListener('keydown', handleKeyDown);
        if (cursorTimeoutRef.current) {
          clearTimeout(cursorTimeoutRef.current);
        }
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
        }
      };
    }
  }, []);

  const renderContent = () => {
    console.log(
      `${tvId} - Rendering content index: ${contentIndex}, Has custom content: ${Boolean(
        customContent
      )}, Video playing: ${isVideoPlaying}`
    );

    // Check if we're in profile mode
    if (customContent && customContent.type === "profile" && customContent.slides) {
      const currentSlide = customContent.slides[contentIndex];
      if (currentSlide) {
        console.log(`${tvId} - Rendering profile slide ${contentIndex + 1}: ${currentSlide.title} (${currentSlide.contentType})`);
        return renderProfileSlide(
          currentSlide,
          imageSetIndex,
          handleVideoStart,
          handleVideoEnd,
          videoSetIndex
        );
      }
      // Fallback if slide doesn't exist
      return renderInfoDisplay(temperature, pressure, humidity, currentTime);
    }

    // Regular mode: use modified 2-slide system (removed message display)
    // If we don't have custom content and index would be 1, show index 0 instead
    const effectiveIndex =
      !customContent && contentIndex === 1 ? 0 : contentIndex;

    switch (effectiveIndex) {
      case 0:
        return renderInfoDisplay(temperature, pressure, humidity, currentTime);
      case 1:
        return renderCustomDisplay(
          customContent,
          imageSetIndex,
          handleVideoStart,
          handleVideoEnd,
          videoSetIndex
        );
      default:
        return null;
    }
  };

  return (
    <div className="tv-page">
      <div 
        className="tv-content-display"
        ref={tvContentRef}
        style={{ cursor: isCursorVisible ? 'default' : 'none' }}
      >
        {renderContent()}
        {renderContentIndicators(contentIndex, customContent)}
        
        {/* Smart TV Navigation Help Overlay */}
        {sidebarNavigationEnabled && (
          <div className="smart-tv-nav-overlay">
            <div className="nav-help-content">
              <h3>📺 Smart TV Navigation</h3>
              <div className="nav-instructions">
                <div className="nav-item">
                  <span className="nav-key">↑↓</span>
                  <span className="nav-desc">Scroll TV list</span>
                </div>
                <div className="nav-item">
                  <span className="nav-key">←→</span>
                  <span className="nav-desc">Change page</span>
                </div>
                <div className="nav-item">
                  <span className="nav-key">Enter</span>
                  <span className="nav-desc">Select TV</span>
                </div>
                <div className="nav-item">
                  <span className="nav-key">/</span>
                  <span className="nav-desc">Search TVs</span>
                </div>
                <div className="nav-item">
                  <span className="nav-key">ESC</span>
                  <span className="nav-desc">Clear search / Hide</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedTVComponent;

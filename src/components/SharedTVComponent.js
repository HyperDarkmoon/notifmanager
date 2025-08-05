import React, { useState, useEffect, useRef } from "react";
import { useTVLogic } from "../utils/useTVLogic";
import {
  renderInfoDisplay,
  renderMessageDisplay,
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
    randomText,
    customContent,
    currentTime,
    isVideoPlaying,
    handleVideoStart,
    handleVideoEnd,
  } = useTVLogic(tvId, initialTemperature, initialPressure);

  // Cursor auto-hide functionality
  const [isCursorVisible, setIsCursorVisible] = useState(true);
  const cursorTimeoutRef = useRef(null);
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

  // Set up event listeners
  useEffect(() => {
    const tvElement = tvContentRef.current;
    if (tvElement) {
      tvElement.addEventListener('mousemove', handleMouseMove);
      tvElement.addEventListener('mouseenter', handleMouseMove);
      
      // Start the initial timer
      handleMouseMove();
      
      return () => {
        tvElement.removeEventListener('mousemove', handleMouseMove);
        tvElement.removeEventListener('mouseenter', handleMouseMove);
        if (cursorTimeoutRef.current) {
          clearTimeout(cursorTimeoutRef.current);
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
      return renderInfoDisplay(temperature, pressure, currentTime);
    }

    // Regular mode: use original 3-slide system
    // If we don't have custom content and index would be 2, show index 0 instead
    const effectiveIndex =
      !customContent && contentIndex === 2 ? 0 : contentIndex;

    switch (effectiveIndex) {
      case 0:
        return renderInfoDisplay(temperature, pressure, currentTime);
      case 1:
        return renderMessageDisplay(randomText);
      case 2:
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
      </div>
    </div>
  );
};

export default SharedTVComponent;

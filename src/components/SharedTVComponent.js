import React from "react";
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
    temperature,
    pressure,
    randomText,
    customContent,
    currentTime,
    isVideoPlaying,
    handleVideoStart,
    handleVideoEnd,
  } = useTVLogic(tvId, initialTemperature, initialPressure);

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
          handleVideoEnd
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
          handleVideoEnd
        );
      default:
        return null;
    }
  };

  return (
    <div className="tv-page">
      <div className="tv-content-display">
        {renderContent()}
        {renderContentIndicators(contentIndex, customContent)}
      </div>
    </div>
  );
};

export default SharedTVComponent;

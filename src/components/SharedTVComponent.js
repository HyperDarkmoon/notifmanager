import React from "react";
import { useTVLogic } from "../utils/useTVLogic";
import {
  renderInfoDisplay,
  renderMessageDisplay,
  renderCustomDisplay,
  renderContentIndicators,
} from "../utils/tvUtils";
import "../styles/tvpage.css";

const SharedTVComponent = ({ tvId, initialTemperature, initialPressure }) => {
  const {
    contentIndex,
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

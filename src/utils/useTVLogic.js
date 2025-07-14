import { useState, useEffect, useRef } from "react";
import {
  getRandomText,
  simulateEnvironmentalData,
  fetchCustomContent,
  ROTATION_PERIOD,
  CONTENT_FETCH_INTERVAL,
  RANDOM_TEXT_INTERVAL,
  TIME_UPDATE_INTERVAL,
} from "./tvUtils";

export const useTVLogic = (tvId, initialTemperature, initialPressure) => {
  const [contentIndex, setContentIndex] = useState(0);
  const [temperature, setTemperature] = useState(initialTemperature);
  const [pressure, setPressure] = useState(initialPressure);
  const [randomText, setRandomText] = useState("");
  const [customContent, setCustomContent] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const prevContentRef = useRef(null);
  const rotationIntervalRef = useRef(null);
  const isVideoPlayingRef = useRef(false);
  const videoEndTimeoutRef = useRef(null);

  // Environmental data simulation and time updates
  useEffect(() => {
    const interval = setInterval(() => {
      const { temperature: newTemp, pressure: newPressure } =
        simulateEnvironmentalData(temperature, pressure);
      setTemperature(newTemp);
      setPressure(newPressure);
      setCurrentTime(new Date());
    }, TIME_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [temperature, pressure]);

  // Fetch custom content for this TV
  useEffect(() => {
    const fetchContent = () =>
      fetchCustomContent(tvId, prevContentRef, setCustomContent);

    fetchContent();
    const interval = setInterval(fetchContent, CONTENT_FETCH_INTERVAL);

    return () => clearInterval(interval);
  }, [tvId]);

  // Set new random text periodically
  useEffect(() => {
    setRandomText(getRandomText());
    const interval = setInterval(() => {
      setRandomText(getRandomText());
    }, RANDOM_TEXT_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Content rotation logic
  useEffect(() => {
    const contentCount = customContent ? 3 : 2;

    console.log(
      `${tvId} - Content count: ${contentCount}, Custom content present: ${Boolean(
        customContent
      )}`
    );

    // Clear any existing interval and timeout
    if (rotationIntervalRef.current) {
      clearInterval(rotationIntervalRef.current);
    }
    if (videoEndTimeoutRef.current) {
      clearTimeout(videoEndTimeoutRef.current);
    }

    // Reset to first slide when content changes, but preserve current index if still valid
    setContentIndex((prevIndex) => {
      if (prevIndex >= contentCount) {
        return 0; // Reset to first slide if current index is invalid
      }
      return prevIndex; // Keep current index if still valid
    });

    const startRotation = () => {
      rotationIntervalRef.current = setInterval(() => {
        if (!isVideoPlayingRef.current) {
          setContentIndex((prevIndex) => {
            const nextIndex = (prevIndex + 1) % contentCount;
            console.log(
              `${tvId} - Rotating content: ${prevIndex} -> ${nextIndex}, Content types: ${contentCount}`
            );
            return nextIndex;
          });
        } else {
          console.log(`${tvId} - Video is playing, skipping rotation`);
        }
      }, ROTATION_PERIOD);
    };

    // Always start rotation
    startRotation();

    return () => {
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
      }
      if (videoEndTimeoutRef.current) {
        clearTimeout(videoEndTimeoutRef.current);
      }
    };
  }, [customContent, tvId]);

  // Handle video playing state changes
  useEffect(() => {
    if (isVideoPlaying) {
      // Video started, stop rotation
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
        console.log(`${tvId} - Stopped rotation because video is playing`);
      }
    }
  }, [isVideoPlaying, tvId]);

  // Helper functions for video control
  const handleVideoStart = () => {
    console.log(`${tvId} - Video started playing, pausing rotation`);
    setIsVideoPlaying(true);
    isVideoPlayingRef.current = true;

    // Clear any pending video end timeout
    if (videoEndTimeoutRef.current) {
      clearTimeout(videoEndTimeoutRef.current);
    }
  };

  const handleVideoEnd = () => {
    console.log(`${tvId} - Video ended, will resume rotation in 1 second`);
    setIsVideoPlaying(false);
    isVideoPlayingRef.current = false;

    // Add a 1-second delay before allowing rotation to continue
    videoEndTimeoutRef.current = setTimeout(() => {
      console.log(`${tvId} - Video end delay completed, rotation can continue`);
      // Force a rotation to the next slide
      setContentIndex((prevIndex) => {
        const contentCount = customContent ? 3 : 2;
        const nextIndex = (prevIndex + 1) % contentCount;
        console.log(
          `${tvId} - Moving to next slide after video: ${prevIndex} -> ${nextIndex}`
        );
        return nextIndex;
      });
    }, 1000);
  };

  return {
    contentIndex,
    temperature,
    pressure,
    randomText,
    customContent,
    currentTime,
    isVideoPlaying,
    handleVideoStart,
    handleVideoEnd,
  };
};

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
import { getImageSetsFromUrls } from "./contentScheduleUtils";

export const useTVLogic = (tvId, initialTemperature, initialPressure) => {
  const [contentIndex, setContentIndex] = useState(0);
  const [imageSetIndex, setImageSetIndex] = useState(0);
  const [temperature, setTemperature] = useState(initialTemperature);
  const [pressure, setPressure] = useState(initialPressure);
  const [randomText, setRandomText] = useState("");
  const [customContent, setCustomContent] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const prevContentRef = useRef(null);
  const rotationIntervalRef = useRef(null);
  const imageSetRotationIntervalRef = useRef(null);
  const isVideoPlayingRef = useRef(false);
  const videoEndTimeoutRef = useRef(null);
  const imageSetIndexRef = useRef(0);

  // Keep imageSetIndexRef in sync with imageSetIndex state
  useEffect(() => {
    imageSetIndexRef.current = imageSetIndex;
  }, [imageSetIndex]);

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

  // Reset image set index when custom content changes
  useEffect(() => {
    setImageSetIndex(0);
  }, [customContent]);

  // Image set rotation for custom content (separate from main content rotation)
  useEffect(() => {
    // Clear any existing image set rotation
    if (imageSetRotationIntervalRef.current) {
      clearInterval(imageSetRotationIntervalRef.current);
    }

    // Only setup image set rotation if we're on custom content and it has multiple image sets
    if (customContent && contentIndex === 2 && customContent.imageUrls) {
      const imageSets = getImageSetsFromUrls(customContent.imageUrls, customContent.contentType);
      
      console.log(`${tvId} - Image sets for ${customContent.contentType}:`, imageSets.length, 'sets');
      
      if (imageSets.length > 1) {
        // Start image set rotation
        imageSetRotationIntervalRef.current = setInterval(() => {
          if (!isVideoPlayingRef.current) {
            setImageSetIndex((prevIndex) => {
              const nextIndex = (prevIndex + 1) % imageSets.length;
              console.log(`${tvId} - Rotating image set: ${prevIndex} -> ${nextIndex} (of ${imageSets.length} total)`);
              return nextIndex;
            });
          }
        }, ROTATION_PERIOD); // Use same rotation period as main content
      }
    }

    return () => {
      if (imageSetRotationIntervalRef.current) {
        clearInterval(imageSetRotationIntervalRef.current);
      }
    };
  }, [customContent, contentIndex, tvId]);

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
    // Determine content count based on whether we have a profile or regular content
    let contentCount;
    let isProfile = false;
    
    if (customContent && customContent.type === "profile" && customContent.slides) {
      // Profile mode: use profile slides
      contentCount = customContent.slides.length;
      isProfile = true;
      console.log(`${tvId} - Profile mode: ${contentCount} slides from profile "${customContent.title}"`);
    } else if (customContent) {
      // Regular custom content mode: info + message + custom content
      contentCount = 3;
      console.log(`${tvId} - Regular mode with custom content: ${contentCount} slides`);
    } else {
      // Default mode: info + message only
      contentCount = 2;
      console.log(`${tvId} - Default mode: ${contentCount} slides`);
    }

    // Clear any existing interval and timeout
    if (rotationIntervalRef.current) {
      clearInterval(rotationIntervalRef.current);
    }
    if (imageSetRotationIntervalRef.current) {
      clearInterval(imageSetRotationIntervalRef.current);
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
            if (isProfile) {
              // Profile mode: simple rotation through profile slides
              const nextIndex = (prevIndex + 1) % contentCount;
              console.log(`${tvId} - Profile slide rotation: ${prevIndex} -> ${nextIndex} (${contentCount} total slides)`);
              return nextIndex;
            } else {
              // Regular mode: handle image set rotation for custom content
              if (prevIndex === 2 && customContent && customContent.imageUrls) {
                const imageSets = getImageSetsFromUrls(customContent.imageUrls, customContent.contentType);
                
                if (imageSets.length > 1) {
                  // Use the ref to get current image set index
                  const currentImageSetIndex = imageSetIndexRef.current;
                  
                  // If we haven't rotated through all image sets yet, stay on this content
                  if (currentImageSetIndex < imageSets.length - 1) {
                    console.log(`${tvId} - Staying on custom content, more image sets to show (${currentImageSetIndex + 1}/${imageSets.length})`);
                    return prevIndex; // Stay on custom content
                  }
                  // If we've shown all image sets, reset image set index and move to next content
                  console.log(`${tvId} - All image sets shown, moving to next content type`);
                  setImageSetIndex(0);
                }
              }
              
              const nextIndex = (prevIndex + 1) % contentCount;
              console.log(`${tvId} - Regular content rotation: ${prevIndex} -> ${nextIndex} (${contentCount} total)`);
              return nextIndex;
            }
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
    imageSetIndex,
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

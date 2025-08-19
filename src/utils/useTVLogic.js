import { useState, useEffect, useRef } from "react";
import {
  getRandomText,
  fetchCustomContent,
  ROTATION_PERIOD,
  CONTENT_FETCH_INTERVAL,
  RANDOM_TEXT_INTERVAL,
  TIME_UPDATE_INTERVAL,
} from "./tvUtils";
import { getImageSetsFromUrls, getVideoSetsFromUrls } from "./contentScheduleUtils";

export const useTVLogic = (tvId, initialTemperature, initialPressure) => {
  const [contentIndex, setContentIndex] = useState(0);
  const [imageSetIndex, setImageSetIndex] = useState(0);
  const [videoSetIndex, setVideoSetIndex] = useState(0);
  const [temperature, setTemperature] = useState(initialTemperature);
  const [pressure, setPressure] = useState(initialPressure);
  const [humidity, setHumidity] = useState(50.0); // Initial humidity value
  const [randomText, setRandomText] = useState("");
  const [customContent, setCustomContent] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const prevContentRef = useRef(null);
  const rotationIntervalRef = useRef(null);
  const imageSetRotationIntervalRef = useRef(null);
  const videoSetRotationIntervalRef = useRef(null);
  const isVideoPlayingRef = useRef(false);
  const videoEndTimeoutRef = useRef(null);
  const imageSetIndexRef = useRef(0);
  const videoSetIndexRef = useRef(0);

  // Keep imageSetIndexRef in sync with imageSetIndex state
  useEffect(() => {
    imageSetIndexRef.current = imageSetIndex;
  }, [imageSetIndex]);

  // Keep videoSetIndexRef in sync with videoSetIndex state
  useEffect(() => {
    videoSetIndexRef.current = videoSetIndex;
  }, [videoSetIndex]);

  // Initialize TV state when component mounts
  useEffect(() => {
    console.log(`${tvId} - Initializing TV with content index 0`);
    setContentIndex(0);
    setImageSetIndex(0);
    setVideoSetIndex(0);
  }, [tvId]);

  // Real-time time updates (every second)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, TIME_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Device data fetching (every 20 seconds)
  useEffect(() => {
    const fetchDeviceData = async () => {
      try {
        const response = await fetch("http://localhost:8090/api/device-data");
        const result = await response.json();
        
        if (result.success) {
          if (result.temperature !== undefined) {
            setTemperature(parseFloat(result.temperature));
          }
          if (result.pressure !== undefined) {
            setPressure(parseFloat(result.pressure));
          }
          if (result.humidity !== undefined) {
            setHumidity(parseFloat(result.humidity));
          }
        }
      } catch (error) {
        console.error(`${tvId} - Error fetching device data:`, error);
        // Keep using current values on error
      }
    };

    // Fetch immediately
    fetchDeviceData();
    
    // Set up interval to fetch every 20 seconds (same as DeviceData component)
    const interval = setInterval(fetchDeviceData, 20000);

    return () => clearInterval(interval);
  }, [tvId]);

  // Fetch custom content for this TV
  useEffect(() => {
    const fetchContent = () =>
      fetchCustomContent(tvId, prevContentRef, setCustomContent);

    fetchContent();
    const interval = setInterval(fetchContent, CONTENT_FETCH_INTERVAL);

    return () => clearInterval(interval);
  }, [tvId]);

  // Reset image and video set indexes when custom content changes
  useEffect(() => {
    setImageSetIndex(0);
    setVideoSetIndex(0);
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

  // Video set rotation for custom content (separate from main content rotation)
  useEffect(() => {
    // Capture the current ref value
    const currentInterval = videoSetRotationIntervalRef.current;
    
    // Clear any existing video set rotation
    if (currentInterval) {
      clearInterval(currentInterval);
    }

    // Only setup video set rotation if we're on custom content and it has multiple videos
    // AND we're not currently in the middle of playing videos
    if (customContent && contentIndex === 2 && customContent.videoUrls && customContent.contentType === "VIDEO" && !isVideoPlayingRef.current) {
      const videoSets = getVideoSetsFromUrls(customContent.videoUrls);
      
      console.log(`${tvId} - Video sets for VIDEO content:`, videoSets.length, 'videos');
      
      // Only reset video index when starting fresh (not when resuming)
      if (videoSetIndexRef.current >= videoSets.length) {
        console.log(`${tvId} - Resetting video index from ${videoSetIndexRef.current} to 0`);
        setVideoSetIndex(0);
      }
      
      // Note: Video rotation is handled by the handleVideoEnd function when each video finishes
      // We don't use setInterval for videos since they should advance when the current video ends
    }

    return () => {
      // Use the captured interval value for cleanup
      if (currentInterval) {
        clearInterval(currentInterval);
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
    console.log(`${tvId} - Video ended`);
    setIsVideoPlaying(false);
    isVideoPlayingRef.current = false;

    // Check if we're in video content with multiple videos
    if (customContent && customContent.contentType === "VIDEO" && customContent.videoUrls && customContent.videoUrls.length > 1) {
      const videoSets = getVideoSetsFromUrls(customContent.videoUrls);
      const currentVideoIndex = videoSetIndexRef.current;
      
      console.log(`${tvId} - Video ${currentVideoIndex + 1} of ${videoSets.length} ended`);
      
      if (currentVideoIndex < videoSets.length - 1) {
        // Move to next video in sequence
        const nextVideoIndex = currentVideoIndex + 1;
        console.log(`${tvId} - Moving to next video: ${currentVideoIndex} -> ${nextVideoIndex}`);
        
        // Short delay before next video starts
        videoEndTimeoutRef.current = setTimeout(() => {
          setVideoSetIndex(nextVideoIndex);
        }, 500);
        return; // Don't proceed to slide rotation yet
      } else {
        // All videos played, move to slide 1 FIRST, then reset video index
        console.log(`${tvId} - All videos played, moving to slide 1`);
        
        // Immediately change content index to slide 1 (index 0)
        setContentIndex(0);
        
        // Wait a moment, then reset video index for next time
        videoEndTimeoutRef.current = setTimeout(() => {
          console.log(`${tvId} - Resetting video index to 0 for next video sequence`);
          setVideoSetIndex(0);
          
          // Restart normal rotation after another delay
          setTimeout(() => {
            if (rotationIntervalRef.current) {
              clearInterval(rotationIntervalRef.current);
            }
            
            // Determine content count for proper rotation
            let contentCount;
            if (customContent && customContent.type === "profile" && customContent.slides) {
              contentCount = customContent.slides.length;
            } else if (customContent) {
              contentCount = 3;
            } else {
              contentCount = 2;
            }
            
            rotationIntervalRef.current = setInterval(() => {
              if (!isVideoPlayingRef.current) {
                setContentIndex((prevIndex) => {
                  const nextIndex = (prevIndex + 1) % contentCount;
                  console.log(`${tvId} - Normal rotation resumed: ${prevIndex} -> ${nextIndex}`);
                  return nextIndex;
                });
              }
            }, ROTATION_PERIOD);
            
            console.log(`${tvId} - Normal rotation restarted after video sequence completed`);
          }, 1000);
        }, 500);
        return; // Exit early, we've handled everything
      }
    }

    // For single videos or profile videos, add a normal delay before rotation continues
    videoEndTimeoutRef.current = setTimeout(() => {
      console.log(`${tvId} - Single video end delay completed, rotation can continue`);
      
      // Determine content count properly
      let contentCount;
      if (customContent && customContent.type === "profile" && customContent.slides) {
        contentCount = customContent.slides.length;
      } else if (customContent) {
        contentCount = 3;
      } else {
        contentCount = 2;
      }
      
      // Force a rotation to the next slide
      setContentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % contentCount;
        console.log(
          `${tvId} - Moving to next slide after single video: ${prevIndex} -> ${nextIndex} (${contentCount} total)`
        );
        return nextIndex;
      });
      
      // Restart the rotation interval
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
      }
      
      rotationIntervalRef.current = setInterval(() => {
        if (!isVideoPlayingRef.current) {
          setContentIndex((prevIndex) => {
            const nextIndex = (prevIndex + 1) % contentCount;
            console.log(`${tvId} - Normal rotation: ${prevIndex} -> ${nextIndex}`);
            return nextIndex;
          });
        }
      }, ROTATION_PERIOD);
      
      console.log(`${tvId} - Rotation interval restarted after single video end`);
    }, 1000);
  };

  return {
    contentIndex,
    imageSetIndex,
    videoSetIndex,
    temperature,
    pressure,
    humidity,
    randomText,
    customContent,
    currentTime,
    isVideoPlaying,
    handleVideoStart,
    handleVideoEnd,
  };
};

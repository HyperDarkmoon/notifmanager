import React, { useState, useEffect, useRef } from 'react';
import '../styles/tvpage.css';

function TV4() {
  const [contentIndex, setContentIndex] = useState(0);
  const [temperature, setTemperature] = useState(24.5);
  const [pressure, setPressure] = useState(1013.25);
  const [randomText, setRandomText] = useState('');
  const [customContent, setCustomContent] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const prevContentRef = useRef(null);
  
  const getRandomText = () => {
    const texts = [
      "Welcome to our company! We're glad you're here.",
      "Did you know? Taking regular breaks increases productivity.",
      "Today's focus: Quality and customer satisfaction.",
      "Remember to hydrate throughout the day!",
      "Our quarterly goals are on track - great teamwork everyone!",
      "Innovation is the key to our success.",
      "Safety first! Remember our workplace guidelines.",
      "Thank you for your continued dedication to excellence."
    ];
    return texts[Math.floor(Math.random() * texts.length)];
  };
  
  // Simulating temperature and pressure changes, and updating time
  useEffect(() => {
    const interval = setInterval(() => {
      setTemperature(prevTemp => {
        const newTemp = prevTemp + (Math.random() * 2 - 1);
        return parseFloat(newTemp.toFixed(1));
      });
      
      setPressure(prevPressure => {
        const newPressure = prevPressure + (Math.random() * 5 - 2.5);
        return parseFloat(newPressure.toFixed(2));
      });
      
      // Update current time every second
      setCurrentTime(new Date());
    }, 1000); // Update every second to keep time accurate
    
    return () => clearInterval(interval);
  }, []);
  
  // Fetch custom content for this TV
  useEffect(() => {
    // In a real application, you would fetch this from your backend
    // For now, we'll just use localStorage as a simulation
    const fetchCustomContent = async () => {
      try {
        // Simulated API call
        // const response = await fetch(`http://localhost:8090/api/tv/4/content`);
        // const data = await response.json();
        // if (data && data.content) {
        //   setCustomContent(data.content);
        // }
        
        // For now, check localStorage as a simulation
        const currentUploads = JSON.parse(localStorage.getItem('tvUploads') || '{}');
        const tv4Content = currentUploads['4'];
        
        // Log the content we're checking with more details
        console.log(`TV4 - Checking for content:`, tv4Content);
        
        // Compare with previous content to see if it changed
        const prevContentStr = JSON.stringify(prevContentRef.current);
        const newContentStr = JSON.stringify(tv4Content);
        
        if (prevContentStr !== newContentStr) {
          console.log(`TV4 - Content changed, updating state`);
          setCustomContent(tv4Content || null);
          prevContentRef.current = tv4Content;
        }
      } catch (error) {
        console.error('Error fetching custom content:', error);
        setCustomContent(null);
      }
    };
    
    fetchCustomContent();
    
    // Set up an interval to check for updates
    const interval = setInterval(fetchCustomContent, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Set new random text periodically
  useEffect(() => {
    setRandomText(getRandomText());
    const interval = setInterval(() => {
      setRandomText(getRandomText());
    }, 30000); // New text every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Content rotation logic
  useEffect(() => {
    const rotationPeriod = 10000; // 10 seconds per content type
    
    // Calculate how many content types we have (2 or 3 depending on customContent)
    const contentCount = customContent ? 3 : 2;
    
    console.log(`TV4 - Content count: ${contentCount}, Custom content present: ${Boolean(customContent)}`);
    
    // Force reset the content index to ensure we start the rotation properly
    setContentIndex(0);
    
    const interval = setInterval(() => {
      setContentIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % contentCount;
        console.log(`TV4 - Rotating content: ${prevIndex} -> ${nextIndex}, Content types: ${contentCount}`);
        return nextIndex;
      });
    }, rotationPeriod);
    
    return () => clearInterval(interval);
  }, [customContent]);
  
  // Render different content based on current index
  const renderContent = () => {
    console.log(`TV4 - Rendering content index: ${contentIndex}, Has custom content: ${Boolean(customContent)}`);
    
    // If we don't have custom content and index would be 2, show index 0 instead
    const effectiveIndex = !customContent && contentIndex === 2 ? 0 : contentIndex;
    
    switch (effectiveIndex) {
      case 0:
        return (
          <div className="tv-info-display">
            <h2>Current Conditions</h2>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-icon">🌡️</div>
                <div className="info-data">
                  <h3>Temperature</h3>
                  <p className="info-value">{temperature}°C</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">📊</div>
                <div className="info-data">
                  <h3>Pressure</h3>
                  <p className="info-value">{pressure} hPa</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">🕒</div>
                <div className="info-data">
                  <h3>Current Time</h3>
                  <p className="info-value">{currentTime.toLocaleTimeString()}</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">📅</div>
                <div className="info-data">
                  <h3>Date</h3>
                  <p className="info-value">{currentTime.toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="tv-message-display">
            <div className="message-content">
              <div className="message-icon">📢</div>
              <div className="message-text">{randomText}</div>
            </div>
          </div>
        );
      case 2:
        if (customContent) {
          return (
            <div className="tv-custom-display">
              {customContent.type === 'file' ? (
                <div className="custom-file">
                  {/* Check if it's a single image or multiple images */}
                  {Array.isArray(customContent.images) ? (
                    // Multiple images display
                    <div className={`custom-file-image-grid grid-${customContent.images.length}`}>
                      {customContent.images.map((image, index) => (
                        <div key={index} className="custom-file-image-container">
                          <img 
                            src={image.dataUrl} 
                            alt={image.name} 
                            className="custom-content-image" 
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Single image or file display
                    customContent.name && customContent.name.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                      <div className="custom-file-image-grid grid-1">
                        <div className="custom-file-image-container">
                          <img 
                            src={customContent.dataUrl} 
                            alt={customContent.name} 
                            className="custom-content-image" 
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="custom-file-placeholder">
                        <div className="custom-file-icon">📄</div>
                        <div className="custom-file-name">{customContent.name}</div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="custom-embed" 
                  dangerouslySetInnerHTML={{ __html: customContent.content }} 
                />
              )}
            </div>
          );
        }
        return null;
      default:
        return null;
    }
  };
  
  return (
    <div className="tv-page">
      <div className="tv-content-display">
        {renderContent()}
        
        <div className="content-indicator">
          <div className={`indicator-dot ${contentIndex === 0 ? 'active' : ''}`}></div>
          <div className={`indicator-dot ${contentIndex === 1 ? 'active' : ''}`}></div>
          {customContent && <div className={`indicator-dot ${contentIndex === 2 ? 'active' : ''}`}></div>}
        </div>
      </div>
    </div>
  );
}

export default TV4;

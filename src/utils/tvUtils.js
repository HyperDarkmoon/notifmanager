import { debugAuthenticatedApiCall } from './authenticatedApi';

// Shared constants
export const ROTATION_PERIOD = 10000; // 10 seconds per content type
export const CONTENT_FETCH_INTERVAL = 5000; // Check every 5 seconds
export const RANDOM_TEXT_INTERVAL = 30000; // New text every 30 seconds
export const TIME_UPDATE_INTERVAL = 1000; // Update every second

// Shared random texts
export const getRandomText = () => {
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

// Shared temperature and pressure simulation
export const simulateEnvironmentalData = (prevTemp, prevPressure) => {
  const newTemp = prevTemp + (Math.random() * 2 - 1);
  const newPressure = prevPressure + (Math.random() * 5 - 2.5);
  
  return {
    temperature: parseFloat(newTemp.toFixed(1)),
    pressure: parseFloat(newPressure.toFixed(2))
  };
};

// Shared content fetching logic
export const fetchCustomContent = async (tvId, prevContentRef, setCustomContent) => {
  try {
    // Fetch active schedules for this TV from the backend
    console.log(`${tvId} - Attempting to fetch content from backend`);
    
    const schedules = await debugAuthenticatedApiCall(`http://localhost:8090/api/content/tv/${tvId}`, {
      method: 'GET'
    });
    
    if (schedules) {
      // Filter active schedules (currently running or no time constraints)
      const now = new Date();
      const activeSchedules = schedules.filter(schedule => {
        if (!schedule.active) return false;
        
        // If no start/end time, it's always active
        if (!schedule.startTime && !schedule.endTime) return true;
        
        // Check if current time is within the schedule window
        const start = schedule.startTime ? new Date(schedule.startTime) : null;
        const end = schedule.endTime ? new Date(schedule.endTime) : null;
        
        if (start && now < start) return false;
        if (end && now > end) return false;
        
        return true;
      });
      
      // Use the first active schedule
      const activeSchedule = activeSchedules.length > 0 ? activeSchedules[0] : null;
      
      console.log(`${tvId} - Active schedules:`, activeSchedules);
      
      // Compare with previous content to see if it changed
      const prevContentStr = JSON.stringify(prevContentRef.current);
      const newContentStr = JSON.stringify(activeSchedule);
      
      if (prevContentStr !== newContentStr) {
        console.log(`${tvId} - Content changed, updating state`);
        setCustomContent(activeSchedule || null);
        prevContentRef.current = activeSchedule;
      }
    } else {
      console.log(`${tvId} - No schedules returned from backend`);
      setCustomContent(null);
    }
    
    // Fallback to localStorage for development
    const currentUploads = JSON.parse(localStorage.getItem('tvUploads') || '{}');
    const tvNumber = tvId.replace('TV', '');
    const tvContent = currentUploads[tvNumber];
    
    if (tvContent && !schedules) {
      console.log(`${tvId} - Using localStorage fallback:`, tvContent);
      
      // Compare with previous content to see if it changed
      const prevContentStr = JSON.stringify(prevContentRef.current);
      const newContentStr = JSON.stringify(tvContent);
      
      if (prevContentStr !== newContentStr) {
        console.log(`${tvId} - LocalStorage content changed, updating state`);
        setCustomContent(tvContent || null);
        prevContentRef.current = tvContent;
      }
    }
  } catch (error) {
    console.error('Error fetching custom content:', error);
    
    // Fallback to localStorage
    const currentUploads = JSON.parse(localStorage.getItem('tvUploads') || '{}');
    const tvNumber = tvId.replace('TV', '');
    const tvContent = currentUploads[tvNumber];
    
    if (tvContent) {
      console.log(`${tvId} - Using localStorage fallback due to error:`, tvContent);
      const prevContentStr = JSON.stringify(prevContentRef.current);
      const newContentStr = JSON.stringify(tvContent);
      
      if (prevContentStr !== newContentStr) {
        setCustomContent(tvContent || null);
        prevContentRef.current = tvContent;
      }
    } else {
      setCustomContent(null);
    }
  }
};

// Shared content rendering components
export const renderInfoDisplay = (temperature, pressure, currentTime) => (
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

export const renderMessageDisplay = (randomText) => (
  <div className="tv-message-display">
    <div className="message-content">
      <div className="message-icon">📢</div>
      <div className="message-text">{randomText}</div>
    </div>
  </div>
);

export const renderCustomDisplay = (customContent) => {
  if (!customContent) return null;

  return (
    <div className="tv-custom-display">
      {/* Handle new backend content schedule format */}
      {customContent.contentType && customContent.contentType.startsWith('IMAGE_') ? (
        <div className="custom-file">
          {/* Handle different image content types */}
          {customContent.imageUrls && customContent.imageUrls.length > 0 ? (
            <div className={`custom-file-image-grid grid-${customContent.imageUrls.length}`}>
              {customContent.imageUrls.map((url, index) => (
                <div key={index} className="custom-file-image-container">
                  <img 
                    src={url} 
                    alt={`Content ${index + 1}`} 
                    className="custom-content-image" 
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : customContent.contentType === 'EMBED' ? (
        <div className="custom-embed" 
          dangerouslySetInnerHTML={{ __html: customContent.content }} 
        />
      ) : customContent.contentType === 'TEXT' ? (
        <div className="custom-text">
          <div className="text-content">
            <h2>{customContent.title}</h2>
            <p>{customContent.content}</p>
          </div>
        </div>
      ) : customContent.type === 'file' ? (
        // Legacy localStorage format support
        <div className="custom-file">
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
              </div>
            )
          )}
        </div>
      ) : customContent.type === 'embed' ? (
        // Legacy localStorage format support
        <div className="custom-embed" 
          dangerouslySetInnerHTML={{ __html: customContent.content }} 
        />
      ) : null}
    </div>
  );
};

// Shared content indicators component
export const renderContentIndicators = (contentIndex, customContent) => (
  <div className="content-indicator">
    <div className={`indicator-dot ${contentIndex === 0 ? 'active' : ''}`}></div>
    <div className={`indicator-dot ${contentIndex === 1 ? 'active' : ''}`}></div>
    {customContent && <div className={`indicator-dot ${contentIndex === 2 ? 'active' : ''}`}></div>}
  </div>
);

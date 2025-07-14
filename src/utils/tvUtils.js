import { debugAuthenticatedApiCall } from './authenticatedApi';

// Shared constants
export const ROTATION_PERIOD = 5000; // 5 seconds per content type
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
    // Fetch prioritized active content for this TV from the backend
    console.log(`${tvId} - Attempting to fetch content from backend`);
    
    const schedules = await debugAuthenticatedApiCall(`http://localhost:8090/api/content/tv/${tvId}`, {
      method: 'GET'
    });
    
    if (schedules && schedules.length > 0) {
      // Backend returns schedules in priority order, so just take the first one
      // The backend handles all scheduling logic, temporary disabling, and priority
      const activeSchedule = schedules[0];
      
      console.log(`${tvId} - Received ${schedules.length} schedule(s) from backend, using highest priority: ${activeSchedule ? activeSchedule.title : 'none'}`);
      
      // Compare with previous content to see if it changed
      const prevContentStr = JSON.stringify(prevContentRef.current);
      const newContentStr = JSON.stringify(activeSchedule);
      
      if (prevContentStr !== newContentStr) {
        console.log(`${tvId} - Content changed, updating state from "${prevContentRef.current?.title || 'none'}" to "${activeSchedule?.title || 'none'}"`);
        setCustomContent(activeSchedule || null);
        prevContentRef.current = activeSchedule;
      }
    } else {
      console.log(`${tvId} - No schedules returned from backend`);
      // Only clear content if we previously had content
      if (prevContentRef.current !== null) {
        console.log(`${tvId} - Clearing previous content`);
        setCustomContent(null);
        prevContentRef.current = null;
      }
    }
    
    // Fallback to localStorage for development (only if backend returned no schedules)
    if (!schedules || schedules.length === 0) {
      const currentUploads = JSON.parse(localStorage.getItem('tvUploads') || '{}');
      const tvNumber = tvId.replace('TV', '');
      const tvContent = currentUploads[tvNumber];
      
      if (tvContent) {
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

export const renderCustomDisplay = (customContent, onVideoStart, onVideoEnd) => {
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
      ) : customContent.contentType === 'VIDEO' ? (
        <div className="custom-video">
          {customContent.videoUrls && customContent.videoUrls.length > 0 ? (
            <div className="custom-video-container">
              <video 
                src={customContent.videoUrls[0]} 
                className="custom-content-video"
                autoPlay
                playsInline
                onPlay={onVideoStart}
                onEnded={onVideoEnd}
                onError={(e) => {
                  console.error('Video playback error:', e);
                  if (onVideoEnd) onVideoEnd();
                }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
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
          ) : customContent.videos && Array.isArray(customContent.videos) ? (
            // Multiple videos display (show first one)
            <div className="custom-video-container">
              <video 
                src={customContent.videos[0].dataUrl} 
                className="custom-content-video"
                autoPlay
                playsInline
                onPlay={onVideoStart}
                onEnded={onVideoEnd}
                onError={(e) => {
                  console.error('Video playback error:', e);
                  if (onVideoEnd) onVideoEnd();
                }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
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
            ) : customContent.name && customContent.name.match(/\.(mp4|webm|ogg|avi|mov)$/i) ? (
              <div className="custom-video-container">
                <video 
                  src={customContent.dataUrl} 
                  className="custom-content-video"
                  autoPlay
                  playsInline
                  onPlay={onVideoStart}
                  onEnded={onVideoEnd}
                  onError={(e) => {
                    console.error('Video playback error:', e);
                    if (onVideoEnd) onVideoEnd();
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
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

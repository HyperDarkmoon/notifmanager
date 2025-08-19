import { useEffect, useState } from "react";
import dataFetcher from "../utils/smartTVDataFetcher";
import { getApiBaseUrl } from "../config/apiConfig";

function DeviceData() {
  const [data, setData] = useState({});
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Add CSS for loading spinner
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      const result = await dataFetcher.fetchDeviceData();
      
      console.log('Fetched device data:', result);
      setData(result);
      setLastUpdate(new Date().toLocaleTimeString());
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching device data:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh using smart TV data fetcher with longer intervals
  useEffect(() => {
    if (!autoRefresh) return;

    // Set up data listener
    const handleDataUpdate = (type, data) => {
      if (type === 'deviceData') {
        console.log('DeviceData component received update:', data);
        setData(data);
        setLastUpdate(new Date().toLocaleTimeString());
        setIsLoading(false);
      }
    };

    // Add listener
    dataFetcher.addListener(handleDataUpdate);

    // Start polling if not already started (longer interval for smart TV stability)
    if (!dataFetcher.isPolling) {
      dataFetcher.startPolling(30000); // 30 seconds - longer for smart TV
    }

    // Get cached data immediately if available
    const cachedData = dataFetcher.getCachedData('deviceData');
    if (cachedData) {
      handleDataUpdate('deviceData', cachedData);
    }

    return () => {
      dataFetcher.removeListener(handleDataUpdate);
    };
  }, [autoRefresh]);

  const handleManualRefresh = async () => {
    setIsLoading(true);
    try {
      // Trigger backend refresh first
      await dataFetcher.safeFetch(`${getApiBaseUrl()}/api/device-data/refresh`, {
        method: 'POST'
      });
      // Then fetch fresh data
      await fetchData();
    } catch (error) {
      console.error('Error during manual refresh:', error);
      setError('Failed to refresh data');
      setIsLoading(false);
    }
  };

  if (error) return (
    <div style={{ padding: '20px' }}>
      <p style={{ color: 'red' }}>Error: {error}</p>
      <button onClick={() => window.location.reload()} style={{ 
        padding: '10px 20px', 
        background: '#007bff', 
        color: 'white', 
        border: 'none', 
        borderRadius: '4px',
        cursor: 'pointer'
      }}>
        Retry
      </button>
    </div>
  );

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif', 
      maxWidth: '1200px',
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        padding: '15px',
        background: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h2 style={{ margin: 0 }}>Device Data Dashboard</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {lastUpdate && (
            <span style={{ fontSize: '14px', color: '#666' }}>
              Last updated: {lastUpdate}
            </span>
          )}
          {data.data_source && (
            <span style={{ 
              fontSize: '12px', 
              padding: '4px 8px',
              background: data.data_source === 'cache' ? '#fff3cd' : '#d4edda',
              border: `1px solid ${data.data_source === 'cache' ? '#ffeaa7' : '#c3e6cb'}`,
              borderRadius: '12px'
            }}>
              {data.data_source === 'cache' ? '📦 Cached' : '🔴 Live'}
            </span>
          )}
          {data.data_age_seconds && (
            <span style={{ fontSize: '12px', color: '#666' }}>
              ({data.data_age_seconds}s old)
            </span>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          <button 
            onClick={handleManualRefresh}
            disabled={isLoading}
            style={{ 
              padding: '8px 16px', 
              background: isLoading ? '#6c757d' : '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            {isLoading ? '🔄 Refreshing...' : '🔄 Refresh Now'}
          </button>
        </div>
      </div>
      
      {Object.keys(data).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>
            {isLoading ? '🔄 Loading sensor data...' : '📡 Waiting for data...'}
          </div>
          {isLoading && (
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #007bff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}></div>
          )}
        </div>
      ) : (
        <div>
          {/* Success/Error Status */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              padding: '10px', 
              borderRadius: '4px',
              background: data.success ? '#d4edda' : '#f8d7da',
              border: `1px solid ${data.success ? '#c3e6cb' : '#f5c6cb'}`,
              color: data.success ? '#155724' : '#721c24'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>Status:</strong> {data.success ? '✅ Connected' : '❌ Error'}
                  {data.error && <div>Error: {data.error}</div>}
                  {data.final_url && <div style={{ fontSize: '12px', marginTop: '5px' }}>URL: {data.final_url}</div>}
                </div>
                {autoRefresh && (
                  <div style={{ 
                    fontSize: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '5px'
                  }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: '#28a745',
                      animation: 'pulse 2s infinite'
                    }}></div>
                    Auto-updating every 20s
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Sensor Data Display */}
          {(data.temperature || data.pressure || data.humidity) && (
            <div style={{ marginBottom: '30px' }} className="fade-in">
              <h3>🌡️ Current Sensor Readings</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '15px',
                marginBottom: '20px'
              }} className="grid-container grid-fallback">
                {data.temperature && (
                  <div style={{ 
                    padding: '15px', 
                    background: '#e3f2fd', 
                    borderRadius: '8px',
                    border: '1px solid #2196f3',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                      {data.temperature}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      Temperature {data.temperature_unit || '°C'}
                    </div>
                  </div>
                )}
                
                {data.pressure && (
                  <div style={{ 
                    padding: '15px', 
                    background: '#f3e5f5', 
                    borderRadius: '8px',
                    border: '1px solid #9c27b0',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7b1fa2' }}>
                      {data.pressure}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      Pressure {data.pressure_unit || 'Pa'}
                    </div>
                  </div>
                )}
                
                {data.humidity && (
                  <div style={{ 
                    padding: '15px', 
                    background: '#e8f5e8', 
                    borderRadius: '8px',
                    border: '1px solid #4caf50',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#388e3c' }}>
                      {data.humidity}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      Humidity {data.humidity_unit || '%RH'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Detailed Sensor Data */}
          {data.sensor_data && (
            <div style={{ marginBottom: '30px' }}>
              <h3>📊 Detailed Sensor Data</h3>
              <div style={{ 
                background: '#f8f9fa', 
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '15px'
              }}>
                <pre style={{ margin: 0, fontSize: '14px' }}>
                  {JSON.stringify(data.sensor_data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Iframe Content */}
          {data.iframe_content && (
            <div style={{ marginBottom: '30px' }}>
              <h3>🖼️ Iframe Content</h3>
              <details style={{ marginBottom: '10px' }}>
                <summary style={{ cursor: 'pointer', padding: '10px', background: '#f1f3f4', borderRadius: '4px' }}>
                  View Iframe HTML Content (Click to expand)
                </summary>
                <pre style={{ 
                  background: '#f4f4f4', 
                  padding: '15px', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '400px',
                  fontSize: '12px',
                  scrollbarWidth: 'thin'
                }}>
                  {data.iframe_content}
                </pre>
              </details>
            </div>
          )}

          {/* PX Content */}
          {data.px_content && (
            <div style={{ marginBottom: '30px' }}>
              <h3>📄 PX Page Content</h3>
              <details style={{ marginBottom: '10px' }}>
                <summary style={{ cursor: 'pointer', padding: '10px', background: '#f1f3f4', borderRadius: '4px' }}>
                  View Full PX Content (Click to expand)
                </summary>
                <pre style={{ 
                  background: '#f4f4f4', 
                  padding: '15px', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '500px',
                  fontSize: '12px',
                  scrollbarWidth: 'thin'
                }}>
                  {data.px_content}
                </pre>
              </details>
            </div>
          )}

          {/* Additional Errors */}
          {data.iframe_error && (
            <div style={{ marginBottom: '20px' }}>
              <h3>⚠️ Iframe Error</h3>
              <div style={{ 
                padding: '10px', 
                background: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '4px',
                color: '#856404'
              }}>
                {data.iframe_error}
              </div>
            </div>
          )}

          {/* Raw Data for Debugging */}
          <div style={{ marginTop: '40px' }}>
            <details>
              <summary style={{ cursor: 'pointer', padding: '10px', background: '#e9ecef', borderRadius: '4px' }}>
                🔧 View All Raw Data (Debug)
              </summary>
              <div style={{ 
                background: '#f8f9fa', 
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '15px',
                marginTop: '10px'
              }}>
                <pre style={{ 
                  margin: 0, 
                  fontSize: '12px', 
                  overflow: 'auto',
                  maxHeight: '400px',
                  scrollbarWidth: 'thin'
                }}>
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeviceData;

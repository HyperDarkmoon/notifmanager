// Public API utility for making requests to the backend without authentication
export const makePublicRequest = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response;
};

// Helper function to get JSON data from public API calls
export const fetchPublicJson = async (url, options = {}) => {
  const response = await makePublicRequest(url, options);
  return response.json();
};

// Debug version with extra logging
export const debugPublicApiCall = async (url, options = {}) => {
  try {
    console.log(`Making public API call to: ${url}`);
    const response = await makePublicRequest(url, options);
    const data = await response.json();
    console.log(`Public API Response successful:`, data);
    return data;
  } catch (error) {
    console.error(`Public API Call Failed:`, error);
    throw error;
  }
};

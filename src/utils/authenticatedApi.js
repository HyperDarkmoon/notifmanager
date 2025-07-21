// Authenticated API utility for making requests to the backend
export const makeAuthenticatedRequest = async (url, options = {}) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    throw new Error("No user authentication found");
  }

  // Determine if we're sending FormData (for file uploads)
  const isFormData = options.body instanceof FormData;
  
  const headers = {
    Authorization: `Basic ${btoa(`${user.username}:${user.password}`)}`,
    ...options.headers,
  };

  // Only set Content-Type for non-FormData requests
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

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

// Helper function to get JSON data from authenticated API calls
export const fetchAuthenticatedJson = async (url, options = {}) => {
  const response = await makeAuthenticatedRequest(url, options);
  return response.json();
};

// Debug version with extra logging
export const debugAuthenticatedApiCall = async (url, options = {}) => {
  try {
    console.log(`Making authenticated API call to: ${url}`);
    const response = await makeAuthenticatedRequest(url, options);
    const data = await response.json();
    console.log(`API Response successful:`, data);
    return data;
  } catch (error) {
    console.error(`API Call Failed:`, error);
    throw error;
  }
};

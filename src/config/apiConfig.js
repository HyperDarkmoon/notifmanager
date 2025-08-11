// API Configuration
// For network access: Set REACT_APP_API_URL in .env file to your machine's IP
// For localhost development: Use http://localhost:8090
// To find your IP: run 'ipconfig' on Windows or 'ifconfig' on Mac/Linux
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://10.41.15.227:8090';

// API endpoints
export const API_ENDPOINTS = {
  BASE_URL: API_BASE_URL,
  
  // Authentication
  SIGNIN: `${API_BASE_URL}/api/auth/signin`,
  SIGNUP: `${API_BASE_URL}/api/auth/signup`,
  
  // Content Management
  CONTENT_ALL: `${API_BASE_URL}/api/content/all`,
  CONTENT_UPLOAD: `${API_BASE_URL}/api/content/upload-file`,
  CONTENT_CREATE: `${API_BASE_URL}/api/content/from-request`,
  CONTENT_BY_ID: (id) => `${API_BASE_URL}/api/content/${id}`,
  CONTENT_BY_TV: (tvId) => `${API_BASE_URL}/api/content/tv/${tvId}`,
  
  // TV Profiles
  PROFILES: `${API_BASE_URL}/api/profiles`,
  PROFILE_ASSIGNMENTS: `${API_BASE_URL}/api/profiles/assignments`,
  PROFILE_BY_ID: (id) => `${API_BASE_URL}/api/profiles/${id}`,
  PROFILE_BY_TV: (tvId) => `${API_BASE_URL}/api/profiles/tv/${tvId}`,
  PROFILE_ASSIGN: `${API_BASE_URL}/api/profiles/assign`,
  PROFILE_ASSIGNMENT_BY_ID: (id) => `${API_BASE_URL}/api/profiles/assignments/${id}`,
  
  // TV Management
  TVS_ALL: `${API_BASE_URL}/api/tvs`,
  TVS_ACTIVE: `${API_BASE_URL}/api/tvs/active`,
  TV_BY_ID: (id) => `${API_BASE_URL}/api/tvs/${id}`,
  TV_BY_NAME: (name) => `${API_BASE_URL}/api/tvs/name/${name}`,
  TV_CREATE: `${API_BASE_URL}/api/tvs`,
  TV_UPDATE: (id) => `${API_BASE_URL}/api/tvs/${id}`,
  TV_DELETE: (id) => `${API_BASE_URL}/api/tvs/${id}`,
  TV_TOGGLE_STATUS: (id) => `${API_BASE_URL}/api/tvs/${id}/toggle-status`,
  TV_SEARCH_DISPLAY_NAME: `${API_BASE_URL}/api/tvs/search/display-name`,
  TV_SEARCH_LOCATION: `${API_BASE_URL}/api/tvs/search/location`,
  TV_CHECK_STATUS: (name) => `${API_BASE_URL}/api/tvs/check/${name}`,
  TV_INITIALIZE_DEFAULTS: `${API_BASE_URL}/api/tvs/initialize-defaults`,
};

// Helper function to get the current API base URL
export const getApiBaseUrl = () => API_BASE_URL;

// Helper function to construct API URLs
export const buildApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;

export default API_ENDPOINTS;
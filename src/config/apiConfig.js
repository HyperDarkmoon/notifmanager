// API Configuration
// For network access: Set REACT_APP_API_URL in .env file to your machine's IP
// For localhost development: Use http://localhost:8090
// To find your IP: run 'ipconfig' on Windows or 'ifconfig' on Mac/Linux
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://172.16.1.12:8090';

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
};

// Helper function to get the current API base URL
export const getApiBaseUrl = () => API_BASE_URL;

// Helper function to construct API URLs
export const buildApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;

export default API_ENDPOINTS;
import { makeAuthenticatedRequest } from "./authenticatedApi";
import { API_ENDPOINTS } from "../config/apiConfig";

// Fetch all TVs (for admin)
export const fetchAllTVs = async () => {
  try {
    const response = await makeAuthenticatedRequest(API_ENDPOINTS.TVS_ALL, {
      method: "GET",
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching all TVs:", error);
    throw error;
  }
};

// Fetch active TVs (for regular users)
export const fetchActiveTVs = async () => {
  try {
    const response = await makeAuthenticatedRequest(API_ENDPOINTS.TVS_ACTIVE, {
      method: "GET",
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching active TVs:", error);
    throw error;
  }
};

// Fetch TV by name
export const fetchTVByName = async (name) => {
  try {
    const response = await makeAuthenticatedRequest(API_ENDPOINTS.TV_BY_NAME(name), {
      method: "GET",
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching TV ${name}:`, error);
    throw error;
  }
};

// Create a new TV (admin only)
export const createTV = async (tvData) => {
  try {
    const response = await makeAuthenticatedRequest(API_ENDPOINTS.TV_CREATE, {
      method: "POST",
      body: JSON.stringify(tvData),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error creating TV:", error);
    throw error;
  }
};

// Update TV (admin only)
export const updateTV = async (id, tvData) => {
  try {
    const response = await makeAuthenticatedRequest(API_ENDPOINTS.TV_UPDATE(id), {
      method: "PUT",
      body: JSON.stringify(tvData),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error updating TV:", error);
    throw error;
  }
};

// Delete TV (admin only)
export const deleteTV = async (id) => {
  try {
    const response = await makeAuthenticatedRequest(API_ENDPOINTS.TV_DELETE(id), {
      method: "DELETE",
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
    }
    return true;
  } catch (error) {
    console.error("Error deleting TV:", error);
    throw error;
  }
};

// Toggle TV status (admin only)
export const toggleTVStatus = async (id) => {
  try {
    const response = await makeAuthenticatedRequest(API_ENDPOINTS.TV_TOGGLE_STATUS(id), {
      method: "PUT",
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error toggling TV status:", error);
    throw error;
  }
};

// Initialize default TVs (admin only)
export const initializeDefaultTVs = async () => {
  try {
    const response = await makeAuthenticatedRequest(API_ENDPOINTS.TV_INITIALIZE_DEFAULTS, {
      method: "POST",
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
    }
    return true;
  } catch (error) {
    console.error("Error initializing default TVs:", error);
    throw error;
  }
};

// Convert TV data to the format expected by the frontend
export const formatTVForFrontend = (tv) => {
  return {
    value: tv.name,
    label: tv.displayName,
    icon: "📺",
    id: tv.id,
    description: tv.description,
    location: tv.location,
    active: tv.active,
    createdAt: tv.createdAt,
    updatedAt: tv.updatedAt,
  };
};

// Convert array of TV data to frontend format
export const formatTVsForFrontend = (tvs) => {
  return tvs.map(formatTVForFrontend);
};

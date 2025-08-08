import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchActiveTVs, fetchAllTVs, formatTVsForFrontend } from "./tvManagementUtils";

// Hook for managing TV data across the application
export const useTVData = (includeInactive = false) => {
  const [tvs, setTvs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch TVs function
  const fetchTVs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // For admin functions, we might want all TVs including inactive ones
      const tvsData = includeInactive ? await fetchAllTVs() : await fetchActiveTVs();
      const formattedTVs = formatTVsForFrontend(tvsData);
      setTvs(formattedTVs);
    } catch (err) {
      console.error("Error fetching TVs:", err);
      setError(err.message);
      // Fallback to default TVs if fetch fails
      setTvs([
        { value: "TV1", label: "TV 1", icon: "📺", id: 1 },
        { value: "TV2", label: "TV 2", icon: "📺", id: 2 },
        { value: "TV3", label: "TV 3", icon: "📺", id: 3 },
        { value: "TV4", label: "TV 4", icon: "📺", id: 4 },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [includeInactive]);

  // Fetch TVs on mount
  useEffect(() => {
    fetchTVs();
  }, [fetchTVs]);

  // Refresh function for components that need to update TV data
  const refreshTVs = useCallback(() => {
    fetchTVs();
  }, [fetchTVs]);

  return {
    tvs,
    isLoading,
    error,
    refreshTVs,
  };
};

// Context for sharing TV data across components (optional)
const TVDataContext = createContext();

export const TVDataProvider = ({ children }) => {
  const tvData = useTVData();
  return <TVDataContext.Provider value={tvData}>{children}</TVDataContext.Provider>;
};

export const useTVDataContext = () => {
  const context = useContext(TVDataContext);
  if (!context) {
    throw new Error("useTVDataContext must be used within a TVDataProvider");
  }
  return context;
};

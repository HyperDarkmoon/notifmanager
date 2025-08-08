import React, { useState, useEffect, useCallback } from "react";
import { 
  fetchAllTVs, 
  createTV, 
  updateTV, 
  deleteTV, 
  toggleTVStatus, 
  initializeDefaultTVs 
} from "../utils/tvManagementUtils";

const TVManagementTab = React.memo(() => {
  // State for TV management
  const [tvs, setTVs] = useState([]);
  const [isLoadingTVs, setIsLoadingTVs] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState("");
  
  // Form state
  const [showTVForm, setShowTVForm] = useState(false);
  const [editingTV, setEditingTV] = useState(null);
  const [tvFormData, setTVFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    location: "",
    active: true
  });

  // Fetch TVs function
  const fetchTVs = useCallback(async () => {
    setIsLoadingTVs(true);
    try {
      const tvsData = await fetchAllTVs();
      setTVs(tvsData);
    } catch (error) {
      console.error("Error fetching TVs:", error);
      setSubmissionMessage(`Error fetching TVs: ${error.message}`);
    } finally {
      setIsLoadingTVs(false);
    }
  }, []);

  // Fetch TVs on component mount
  useEffect(() => {
    fetchTVs();
  }, [fetchTVs]);

  // Handle form input changes
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setTVFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

  // Handle form submission (create or update)
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setSubmissionMessage("");

    try {
      // Validate form data
      if (!tvFormData.name.trim()) {
        throw new Error("TV name is required");
      }
      if (!tvFormData.displayName.trim()) {
        throw new Error("Display name is required");
      }

      // Prepare submission data
      const submissionData = {
        name: tvFormData.name.trim().toUpperCase(), // Normalize name to uppercase
        displayName: tvFormData.displayName.trim(),
        description: tvFormData.description.trim(),
        location: tvFormData.location.trim(),
        active: tvFormData.active
      };

      if (editingTV) {
        // Update existing TV
        await updateTV(editingTV.id, submissionData);
        setSubmissionMessage("TV updated successfully!");
      } else {
        // Create new TV
        await createTV(submissionData);
        setSubmissionMessage("TV created successfully!");
      }

      // Reset form and refresh TVs
      setTVFormData({
        name: "",
        displayName: "",
        description: "",
        location: "",
        active: true
      });
      setShowTVForm(false);
      setEditingTV(null);
      await fetchTVs();

    } catch (error) {
      console.error("Error submitting TV:", error);
      setSubmissionMessage(`Error: ${error.message}`);
    }
  }, [tvFormData, editingTV, fetchTVs]);

  // Handle edit TV
  const handleEditTV = useCallback((tv) => {
    setEditingTV(tv);
    setTVFormData({
      name: tv.name,
      displayName: tv.displayName,
      description: tv.description || "",
      location: tv.location || "",
      active: tv.active
    });
    setShowTVForm(true);
  }, []);

  // Handle delete TV
  const handleDeleteTV = useCallback(async (tv) => {
    if (!window.confirm(`Are you sure you want to delete TV "${tv.displayName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteTV(tv.id);
      setSubmissionMessage(`TV "${tv.displayName}" deleted successfully!`);
      await fetchTVs();
    } catch (error) {
      console.error("Error deleting TV:", error);
      setSubmissionMessage(`Error deleting TV: ${error.message}`);
    }
  }, [fetchTVs]);

  // Handle toggle TV status
  const handleToggleStatus = useCallback(async (tv) => {
    try {
      await toggleTVStatus(tv.id);
      setSubmissionMessage(`TV "${tv.displayName}" ${tv.active ? 'deactivated' : 'activated'} successfully!`);
      await fetchTVs();
    } catch (error) {
      console.error("Error toggling TV status:", error);
      setSubmissionMessage(`Error toggling TV status: ${error.message}`);
    }
  }, [fetchTVs]);

  // Handle initialize default TVs
  const handleInitializeDefaults = useCallback(async () => {
    if (!window.confirm("This will create the default TVs (TV1, TV2, TV3, TV4) if they don't exist. Continue?")) {
      return;
    }

    try {
      await initializeDefaultTVs();
      setSubmissionMessage("Default TVs initialized successfully!");
      await fetchTVs();
    } catch (error) {
      console.error("Error initializing default TVs:", error);
      setSubmissionMessage(`Error initializing default TVs: ${error.message}`);
    }
  }, [fetchTVs]);

  // Cancel form
  const handleCancelForm = useCallback(() => {
    setTVFormData({
      name: "",
      displayName: "",
      description: "",
      location: "",
      active: true
    });
    setShowTVForm(false);
    setEditingTV(null);
    setSubmissionMessage("");
  }, []);

  return (
    <div className="tv-management-tab">
      {/* Header */}
      <div className="tab-header">
        <h2>TV Management</h2>
        <p className="tab-description">
          Manage TV displays in the system. Add, edit, or remove TV displays dynamically.
        </p>
        
        {/* Action buttons */}
        <div className="header-actions">
          <button
            className="add-tv-btn"
            onClick={() => setShowTVForm(true)}
          >
            ➕ Add New TV
          </button>
          <button
            className="initialize-btn"
            onClick={handleInitializeDefaults}
            title="Initialize default TVs (TV1-TV4)"
          >
            🔧 Initialize Defaults
          </button>
        </div>
      </div>

      {/* Submission Message */}
      {submissionMessage && (
        <div className={`submission-message ${submissionMessage.includes('Error') ? 'error' : 'success'}`}>
          {submissionMessage}
        </div>
      )}

      {/* TV Form */}
      {showTVForm && (
        <div className="form-section">
          <h3>{editingTV ? 'Edit TV' : 'Add New TV'}</h3>
          <form onSubmit={handleSubmit} className="tv-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">TV Name (ID) *</label>
                <input
                  type="text"
                  name="name"
                  value={tvFormData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g., TV5, LOBBY_TV, MAIN_DISPLAY"
                  required
                  disabled={editingTV} // Disable name editing for existing TVs
                />
                <small className="form-help">
                  Unique identifier for the TV. Will be converted to uppercase. Cannot be changed after creation.
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Display Name *</label>
                <input
                  type="text"
                  name="displayName"
                  value={tvFormData.displayName}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g., TV 5, Lobby Display, Main Conference Room"
                  required
                />
                <small className="form-help">
                  Human-readable name shown in the interface.
                </small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={tvFormData.description}
                  onChange={handleInputChange}
                  className="form-textarea"
                  placeholder="Optional description of the TV display"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  name="location"
                  value={tvFormData.location}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g., Lobby, Conference Room A, Break Room"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="active"
                  checked={tvFormData.active}
                  onChange={handleInputChange}
                />
                <span>Active (TV is available for content)</span>
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                {editingTV ? 'Update TV' : 'Create TV'}
              </button>
              <button type="button" className="cancel-btn" onClick={handleCancelForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TVs List */}
      <div className="tvs-list-section">
        <h3>Existing TVs</h3>
        
        {isLoadingTVs ? (
          <div className="loading-message">Loading TVs...</div>
        ) : tvs.length === 0 ? (
          <div className="no-content">
            <div className="empty-icon">📺</div>
            <span>No TVs found. Create your first TV to get started.</span>
          </div>
        ) : (
          <div className="tvs-grid">
            {tvs.map((tv) => (
              <div key={tv.id} className={`tv-card ${!tv.active ? 'inactive' : ''}`}>
                <div className="tv-card-header">
                  <div className="tv-info">
                    <h4>{tv.displayName}</h4>
                    <p className="tv-name">ID: {tv.name}</p>
                    {tv.location && <p className="tv-location">📍 {tv.location}</p>}
                  </div>
                  <div className={`tv-status ${tv.active ? 'active' : 'inactive'}`}>
                    {tv.active ? '🟢 Active' : '🔴 Inactive'}
                  </div>
                </div>

                {tv.description && (
                  <div className="tv-description">
                    <p>{tv.description}</p>
                  </div>
                )}

                <div className="tv-card-actions">
                  <button
                    className="edit-btn"
                    onClick={() => handleEditTV(tv)}
                    title="Edit TV"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className={`toggle-btn ${tv.active ? 'deactivate' : 'activate'}`}
                    onClick={() => handleToggleStatus(tv)}
                    title={tv.active ? 'Deactivate TV' : 'Activate TV'}
                  >
                    {tv.active ? '⏸️ Deactivate' : '▶️ Activate'}
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteTV(tv)}
                    title="Delete TV"
                  >
                    🗑️ Delete
                  </button>
                </div>

                <div className="tv-metadata">
                  <small>Created: {new Date(tv.createdAt).toLocaleDateString()}</small>
                  {tv.updatedAt !== tv.createdAt && (
                    <small>Updated: {new Date(tv.updatedAt).toLocaleDateString()}</small>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default TVManagementTab;

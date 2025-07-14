import React, { useState, useEffect } from 'react';
import '../styles/admin.css';
import { makeAuthenticatedRequest } from '../utils/authenticatedApi';
import { 
  formatScheduleDate,
  getMaxFilesForContentType 
} from '../utils/contentScheduleUtils';

function AdminPanel() {
  // Get current datetime in the format required for datetime-local input
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contentType: 'TEXT',
    content: '',
    imageUrls: [],
    videoUrls: [],
    startTime: getCurrentDateTime(),
    endTime: getCurrentDateTime(),
    targetTVs: [],
    active: true
  });

  // UI state
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [selectedTVFilter, setSelectedTVFilter] = useState('all');

  // TV options based on TVEnum
  const tvOptions = [
    { value: 'TV1', label: 'TV 1', icon: '📺' },
    { value: 'TV2', label: 'TV 2', icon: '📺' },
    { value: 'TV3', label: 'TV 3', icon: '📺' },
    { value: 'TV4', label: 'TV 4', icon: '📺' }
  ];

  // Content type options
  const contentTypes = [
    { value: 'TEXT', label: 'Text Content', icon: '📝' },
    { value: 'IMAGE_SINGLE', label: 'Single Image', icon: '🖼️' },
    { value: 'IMAGE_DUAL', label: 'Dual Images', icon: '🖼️🖼️' },
    { value: 'IMAGE_QUAD', label: 'Quad Images', icon: '🖼️🖼️🖼️🖼️' },
    { value: 'VIDEO', label: 'Video Content', icon: '🎥' },
    { value: 'EMBED', label: 'Embed Content', icon: '🌐' }
  ];

  // Fetch existing schedules on component mount
  useEffect(() => {
    fetchSchedules();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch all schedules
  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const response = await makeAuthenticatedRequest('http://localhost:8090/api/content/all');
      const data = await response.json();
      setSchedules(data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setSubmissionMessage(`Error fetching schedules: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle TV selection
  const handleTVSelection = (tvValue) => {
    setFormData(prev => ({
      ...prev,
      targetTVs: prev.targetTVs.includes(tvValue)
        ? prev.targetTVs.filter(tv => tv !== tvValue)
        : [...prev.targetTVs, tvValue]
    }));
  };

  // Handle clearing schedule for immediate content
  const handleClearSchedule = () => {
    setFormData(prev => ({
      ...prev,
      startTime: '',
      endTime: ''
    }));
  };

  // Handle setting current time for schedule
  const handleSetCurrentTime = () => {
    const currentTime = getCurrentDateTime();
    setFormData(prev => ({
      ...prev,
      startTime: currentTime,
      endTime: currentTime
    }));
  };
  const handleContentTypeChange = (contentType) => {
    setFormData(prev => ({
      ...prev,
      contentType,
      content: '',
      imageUrls: [],
      videoUrls: []
    }));
    setImageFiles([]);
    setVideoFiles([]);
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = getMaxFilesForContentType(formData.contentType);
    
    if (files.length > maxFiles) {
      setSubmissionMessage(`Error: ${formData.contentType} allows maximum ${maxFiles} image(s)`);
      return;
    }

    setImageFiles(files);
    
    // Convert files to data URLs (for preview) and prepare for upload
    const filePromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises).then(dataUrls => {
      setFormData(prev => ({
        ...prev,
        imageUrls: dataUrls
      }));
    });
  };

  // Handle video file upload
  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 1) {
      setSubmissionMessage('Error: Only one video file is allowed');
      return;
    }

    setVideoFiles(files);
    
    // Convert files to data URLs (for preview) and prepare for upload
    const filePromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises).then(dataUrls => {
      setFormData(prev => ({
        ...prev,
        videoUrls: dataUrls
      }));
    });
  };

  // Get maximum files allowed for content type
  // Note: Using imported utility function

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionMessage('');

    try {
      // Validate form data
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }
      
      if (formData.targetTVs.length === 0) {
        throw new Error('At least one TV must be selected');
      }

      // Validate content based on content type
      if (formData.contentType === 'TEXT' && !formData.content.trim()) {
        throw new Error('Text content is required');
      }
      
      if (formData.contentType === 'EMBED' && !formData.content.trim()) {
        throw new Error('Embed content is required');
      }

      if (formData.contentType.startsWith('IMAGE_')) {
        const requiredImages = getMaxFilesForContentType(formData.contentType);
        if (formData.imageUrls.length !== requiredImages) {
          throw new Error(`${formData.contentType} requires exactly ${requiredImages} image(s)`);
        }
      }

      if (formData.contentType === 'VIDEO') {
        if (formData.videoUrls.length !== 1) {
          throw new Error('Video content requires exactly 1 video file');
        }
      }

      // Validate date/time if provided - both must be provided or both must be empty
      if ((formData.startTime && !formData.endTime) || (!formData.startTime && formData.endTime)) {
        throw new Error('Both start time and end time must be provided, or both must be empty for immediate/indefinite content');
      }
      
      if (formData.startTime && formData.endTime) {
        const startDate = new Date(formData.startTime);
        const endDate = new Date(formData.endTime);
        
        if (startDate >= endDate) {
          throw new Error('Start time must be before end time');
        }
      }

      // Prepare submission data
      const submissionData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        contentType: formData.contentType,
        content: formData.content.trim(),
        imageUrls: formData.imageUrls,
        videoUrls: formData.videoUrls,
        startTime: formData.startTime || null,
        endTime: formData.endTime || null,
        targetTVs: formData.targetTVs,
        active: formData.active
      };

      // Submit to backend
      const response = await makeAuthenticatedRequest('http://localhost:8090/api/content', {
        method: 'POST',
        body: JSON.stringify(submissionData)
      });

      await response.json();
      
      setSubmissionMessage('Content schedule created successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        contentType: 'TEXT',
        content: '',
        imageUrls: [],
        videoUrls: [],
        startTime: getCurrentDateTime(),
        endTime: getCurrentDateTime(),
        targetTVs: [],
        active: true
      });
      setImageFiles([]);
      setVideoFiles([]);
      
      // Refresh schedules list
      await fetchSchedules();

    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmissionMessage(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete schedule
  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      await makeAuthenticatedRequest(`http://localhost:8090/api/content/${scheduleId}`, {
        method: 'DELETE'
      });
      
      setSubmissionMessage('Schedule deleted successfully!');
      await fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      setSubmissionMessage(`Error deleting schedule: ${error.message}`);
    }
  };

  // Toggle schedule active status
  const handleToggleActive = async (schedule) => {
    // If trying to activate content, check if it has expired
    if (!schedule.active && schedule.endTime) {
      const now = new Date();
      const endTime = new Date(schedule.endTime);
      
      if (endTime <= now) {
        setSubmissionMessage('Error: Cannot activate content that has already expired. Please update the end time first.');
        return;
      }
    }

    try {
      const updatedSchedule = {
        ...schedule,
        active: !schedule.active
      };

      await makeAuthenticatedRequest(`http://localhost:8090/api/content/${schedule.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedSchedule)
      });
      
      setSubmissionMessage(`Schedule ${updatedSchedule.active ? 'activated' : 'deactivated'} successfully!`);
      await fetchSchedules();
    } catch (error) {
      console.error('Error updating schedule:', error);
      setSubmissionMessage(`Error updating schedule: ${error.message}`);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return formatScheduleDate(dateString);
  };

  // Handle TV filter change
  const handleTVFilterChange = (tvFilter) => {
    setSelectedTVFilter(tvFilter);
  };

  // Filter schedules based on selected TV
  const filteredSchedules = selectedTVFilter === 'all' 
    ? schedules 
    : schedules.filter(schedule => schedule.targetTVs.includes(selectedTVFilter));

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h1>Content Management</h1>
        <p className="admin-subtitle">Schedule and manage content for TV displays</p>
      </header>

      <div className="admin-content">
        {/* Content Creation Form */}
        <div className="admin-form-container">
          <form className="admin-form" onSubmit={handleSubmit}>
            {submissionMessage && (
              <div className={`submission-message ${submissionMessage.startsWith('Error') ? 'error' : 'success'}`}>
                {submissionMessage}
              </div>
            )}

            {/* Basic Information */}
            <div className="form-section">
              <h2>Basic Information</h2>
              
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter content title"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-textarea"
                  placeholder="Enter content description (optional)"
                  rows="3"
                />
              </div>
            </div>

            {/* Target TVs */}
            <div className="form-section">
              <h2>Target TVs *</h2>
              <div className="tv-selector">
                {tvOptions.map(tv => (
                  <button
                    key={tv.value}
                    type="button"
                    className={`tv-select-btn ${formData.targetTVs.includes(tv.value) ? 'selected' : ''}`}
                    onClick={() => handleTVSelection(tv.value)}
                  >
                    <div className="tv-icon">{tv.icon}</div>
                    <span>{tv.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Type */}
            <div className="form-section">
              <h2>Content Type *</h2>
              <div className="content-type-selector">
                {contentTypes.map(type => (
                  <label
                    key={type.value}
                    className={`content-type-option ${formData.contentType === type.value ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="contentType"
                      value={type.value}
                      checked={formData.contentType === type.value}
                      onChange={() => handleContentTypeChange(type.value)}
                    />
                    <div className="content-type-icon">{type.icon}</div>
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Content Input */}
            <div className="form-section">
              <h2>Content *</h2>
              
              {formData.contentType === 'TEXT' && (
                <div className="form-group">
                  <label className="form-label">Text Content</label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    className="form-textarea"
                    placeholder="Enter your text content here..."
                    rows="4"
                    required
                  />
                </div>
              )}

              {formData.contentType === 'EMBED' && (
                <div className="form-group">
                  <label className="form-label">Embed HTML/Code</label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    className="embed-textarea"
                    placeholder="Enter HTML, iframe, or other embed code..."
                    rows="6"
                    required
                  />
                </div>
              )}

              {formData.contentType.startsWith('IMAGE_') && (
                <div className="file-upload-container">
                  <label className="file-upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      multiple={formData.contentType !== 'IMAGE_SINGLE'}
                      onChange={handleFileUpload}
                      className="file-input"
                    />
                    <div className="upload-icon">📁</div>
                    <div>
                      <strong>Choose Images</strong>
                      <div className="upload-help">
                        {formData.contentType === 'IMAGE_SINGLE' && 'Select 1 image'}
                        {formData.contentType === 'IMAGE_DUAL' && 'Select 2 images'}
                        {formData.contentType === 'IMAGE_QUAD' && 'Select 4 images'}
                      </div>
                    </div>
                  </label>
                  
                  {imageFiles.length > 0 && (
                    <div className="selected-files">
                      {imageFiles.map((file, index) => (
                        <div key={index} className="selected-file">
                          <span className="file-name">{file.name}</span>
                          {formData.imageUrls[index] && (
                            <img 
                              src={formData.imageUrls[index]} 
                              alt={file.name}
                              className="upload-file-thumbnail"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {formData.contentType === 'VIDEO' && (
                <div className="file-upload-container">
                  <label className="file-upload-label">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="file-input"
                    />
                    <div className="upload-icon">🎥</div>
                    <div>
                      <strong>Choose Video</strong>
                      <div className="upload-help">
                        Select 1 video file (MP4, WebM, OGG)
                      </div>
                    </div>
                  </label>
                  
                  {videoFiles.length > 0 && (
                    <div className="selected-files">
                      {videoFiles.map((file, index) => (
                        <div key={index} className="selected-file">
                          <span className="file-name">{file.name}</span>
                          {formData.videoUrls[index] && (
                            <video 
                              src={formData.videoUrls[index]} 
                              className="upload-file-thumbnail"
                              controls
                              style={{ maxWidth: '200px', maxHeight: '150px' }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Schedule */}
            <div className="form-section">
              <h2>Schedule (Optional)</h2>
              <p className="form-help">
                Leave both times empty for immediate and indefinite display, or set both times for scheduled content.
                <br />
                <strong>Note:</strong> Scheduled content will temporarily override immediate content during its time window.
              </p>
              
              <div className="schedule-inputs">
                <div className="schedule-buttons">
                  <button
                    type="button"
                    className="schedule-helper-btn clear"
                    onClick={handleClearSchedule}
                    title="Clear schedule for immediate content"
                  >
                    📅❌ Immediate Content
                  </button>
                  <button
                    type="button"
                    className="schedule-helper-btn current"
                    onClick={handleSetCurrentTime}
                    title="Set current time as start point"
                  >
                    🕒 Use Current Time
                  </button>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleInputChange}
                  />
                  <span>Active (content will be displayed)</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="form-actions">
              <button
                type="submit"
                className="admin-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Schedule...' : 'Create Content Schedule'}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Schedules */}
        <div className="current-uploads-section">
          <h2>Existing Content Schedules</h2>
          
          {/* TV Filter */}
          <div className="tv-filter-section">
            <label className="tv-filter-label">Filter by TV:</label>
            <div className="tv-filter-options">
              <button
                className={`tv-filter-btn all ${selectedTVFilter === 'all' ? 'active' : ''}`}
                onClick={() => handleTVFilterChange('all')}
              >
                All TVs
              </button>
              {tvOptions.map(tv => (
                <button
                  key={tv.value}
                  className={`tv-filter-btn ${selectedTVFilter === tv.value ? 'active' : ''}`}
                  onClick={() => handleTVFilterChange(tv.value)}
                >
                  {tv.icon} {tv.label}
                </button>
              ))}
            </div>
          </div>
          
          {isLoading ? (
            <div className="loading-message">Loading schedules...</div>
          ) : filteredSchedules.length === 0 ? (
            <div className="no-content">
              <div className="empty-icon">📋</div>
              <span>
                {selectedTVFilter === 'all' 
                  ? 'No content schedules found' 
                  : `No content schedules found for ${tvOptions.find(tv => tv.value === selectedTVFilter)?.label || selectedTVFilter}`
                }
              </span>
            </div>
          ) : (
            <div className="schedules-list">
              {filteredSchedules.map(schedule => (
                <div key={schedule.id} className={`schedule-card ${!schedule.active ? 'inactive' : ''}`}>
                  <div className="schedule-header">
                    <h3>{schedule.title}</h3>
                    <div className="schedule-actions">
                      <button
                        className={`toggle-btn ${schedule.active ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleActive(schedule)}
                        title={schedule.active ? 'Deactivate' : 'Activate'}
                      >
                        {schedule.active ? '🟢' : '🔴'}
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="schedule-details">
                    <p><strong>Type:</strong> {schedule.contentType}</p>
                    <p><strong>TVs:</strong> {schedule.targetTVs.join(', ')}</p>
                    <p><strong>Start:</strong> {formatDate(schedule.startTime)}</p>
                    <p><strong>End:</strong> {formatDate(schedule.endTime)}</p>
                    
                    {schedule.description && (
                      <p><strong>Description:</strong> {schedule.description}</p>
                    )}
                    
                    {schedule.contentType === 'TEXT' && schedule.content && (
                      <div className="content-preview">
                        <strong>Content:</strong>
                        <div className="text-preview">{schedule.content}</div>
                      </div>
                    )}
                    
                    {schedule.contentType.startsWith('IMAGE_') && schedule.imageUrls && (
                      <div className="content-preview">
                        <strong>Images:</strong>
                        <div className="image-preview">
                          {schedule.imageUrls.map((url, index) => (
                            <img 
                              key={index}
                              src={url} 
                              alt={`Content ${index + 1}`}
                              className="preview-thumbnail"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {schedule.contentType === 'VIDEO' && schedule.videoUrls && (
                      <div className="content-preview">
                        <strong>Videos:</strong>
                        <div className="video-preview">
                          {schedule.videoUrls.map((url, index) => (
                            <video 
                              key={index}
                              src={url} 
                              className="preview-thumbnail"
                              controls
                              style={{ maxWidth: '200px', maxHeight: '150px' }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;

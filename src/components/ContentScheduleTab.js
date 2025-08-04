import React, { useState, useEffect, useCallback, useMemo } from "react";
import { makeAuthenticatedRequest } from "../utils/authenticatedApi";
import { formatScheduleDate, getImagesPerSetForContentType } from "../utils/contentScheduleUtils";
import { getInitialFormData, getCurrentDateTime, getCurrentTime, truncateFileName } from "../utils/adminUtils";
import { TV_OPTIONS, CONTENT_TYPES, MAX_BASE64_SIZE_IMAGES, MAX_BASE64_SIZE_VIDEOS, MAX_FALLBACK_SIZE } from "../constants/adminConstants";
import TimeScheduleList from "./TimeScheduleList";
import DailyScheduleInput from "./DailyScheduleInput";

const ContentScheduleTab = React.memo(() => {
  // Form state - use memoized initial data
  const [formData, setFormData] = useState(() => getInitialFormData());

  // UI state
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [selectedTVFilter, setSelectedTVFilter] = useState("all");

  // Fetch existing schedules on component mount
  useEffect(() => {
    fetchSchedules();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch all schedules - memoized
  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await makeAuthenticatedRequest(
        "http://localhost:8090/api/content/all"
      );
      const data = await response.json();
      setSchedules(data);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      setSubmissionMessage(`Error fetching schedules: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle form input changes - memoized
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  // Upload large files to server with fallback to base64 - memoized
  const uploadLargeFile = useCallback(async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await makeAuthenticatedRequest(
        "http://localhost:8090/api/content/upload-file",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.fileUrl; // Assuming backend returns { fileUrl: "..." }
      
    } catch (error) {
      console.warn(`File upload endpoint not available, falling back to base64 for ${file.name}:`, error.message);
      
      // Fallback to base64 if upload endpoint is not available
      // But warn about potential size issues
      if (file.size > MAX_FALLBACK_SIZE) { // 10MB
        throw new Error(`File ${file.name} is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum size for fallback is 10MB.`);
      }
      
      // Convert to base64 as fallback
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      
      return base64;
    }
  }, []);

  // Handle TV selection - memoized
  const handleTVSelection = useCallback((tvValue) => {
    setFormData((prev) => ({
      ...prev,
      targetTVs: prev.targetTVs.includes(tvValue)
        ? prev.targetTVs.filter((tv) => tv !== tvValue)
        : [...prev.targetTVs, tvValue],
    }));
  }, []);

  // Handle setting current time for schedule - memoized
  const handleSetCurrentTime = useCallback(() => {
    const currentTime = getCurrentDateTime();
    setFormData((prev) => ({
      ...prev,
      startTime: currentTime,
      endTime: currentTime,
      isImmediate: false,
    }));
  }, []);

  // Handle adding a new time schedule - memoized
  const handleAddTimeSchedule = useCallback(() => {
    if (!formData.startTime || !formData.endTime) {
      setSubmissionMessage("Please set both start and end times before adding to schedule list");
      return;
    }

    const startDate = new Date(formData.startTime);
    const endDate = new Date(formData.endTime);

    if (startDate >= endDate) {
      setSubmissionMessage("Start time must be before end time");
      return;
    }

    const newSchedule = {
      startTime: formData.startTime,
      endTime: formData.endTime,
      id: Date.now() // Temporary ID for frontend management
    };

    setFormData((prev) => ({
      ...prev,
      timeSchedules: [...prev.timeSchedules, newSchedule],
      startTime: getCurrentDateTime(),
      endTime: getCurrentDateTime(),
      isImmediate: false,
    }));

    setSubmissionMessage("Time schedule added successfully! Add more or submit to create content.");
  }, [formData.startTime, formData.endTime]);

  // Handle removing a time schedule - memoized
  const handleRemoveTimeSchedule = useCallback((scheduleId) => {
    setFormData((prev) => ({
      ...prev,
      timeSchedules: prev.timeSchedules.filter(schedule => schedule.id !== scheduleId),
    }));
  }, []);

  // Handle immediate content toggle - memoized
  const handleImmediateToggle = useCallback((isImmediate) => {
    setFormData((prev) => ({
      ...prev,
      isImmediate,
      timeSchedules: isImmediate ? [] : prev.timeSchedules,
      startTime: isImmediate ? "" : getCurrentDateTime(),
      endTime: isImmediate ? "" : getCurrentDateTime(),
      isDailySchedule: isImmediate ? false : prev.isDailySchedule,
    }));
  }, []);

  // Handle daily schedule toggle - memoized
  const handleDailyScheduleToggle = useCallback((isDailySchedule) => {
    setFormData((prev) => ({
      ...prev,
      isDailySchedule,
      timeSchedules: isDailySchedule ? [] : prev.timeSchedules,
      dailyStartTime: isDailySchedule ? getCurrentTime() : prev.dailyStartTime,
      dailyEndTime: isDailySchedule ? getCurrentTime() : prev.dailyEndTime,
    }));
  }, []);

  // Handle daily schedule time changes - memoized
  const handleDailyTimeChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // Handle setting current time for daily schedule - memoized
  const handleSetCurrentTimeForDaily = useCallback(() => {
    const currentTime = getCurrentTime();
    setFormData((prev) => ({
      ...prev,
      dailyStartTime: currentTime,
      dailyEndTime: currentTime,
    }));
  }, []);

  // Handle content type change - memoized
  const handleContentTypeChange = useCallback((contentType) => {
    setFormData((prev) => ({
      ...prev,
      contentType,
      content: "",
      imageUrls: [],
      videoUrls: [],
    }));
    setImageFiles([]);
    setVideoFiles([]);
  }, []);

  // Handle removing a specific image - memoized
  const handleRemoveImage = useCallback((indexToRemove) => {
    const newImageFiles = imageFiles.filter((_, index) => index !== indexToRemove);
    const newImageUrls = formData.imageUrls.filter((_, index) => index !== indexToRemove);
    
    setImageFiles(newImageFiles);
    setFormData((prev) => ({
      ...prev,
      imageUrls: newImageUrls,
    }));

    // Update submission message based on remaining images
    if (newImageFiles.length === 0) {
      setSubmissionMessage("");
    } else {
      const imagesPerSet = getImagesPerSetForContentType(formData.contentType);
      const completeSets = Math.floor(newImageFiles.length / imagesPerSet);
      const remainingImages = newImageFiles.length % imagesPerSet;
      
      if (newImageFiles.length < imagesPerSet) {
        setSubmissionMessage(
          `You have ${newImageFiles.length} image(s). Missing slots will be left empty in the display.`
        );
      } else if (remainingImages === 0) {
        setSubmissionMessage(
          `Perfect! ${newImageFiles.length} images will create ${completeSets} complete set(s). Each set will rotate every 5 seconds.`
        );
      } else {
        setSubmissionMessage(
          `Good! ${newImageFiles.length} images will create ${completeSets} complete set(s) with ${remainingImages} extra image(s). Missing slots in the last set will be empty.`
        );
      }
    }
  }, [imageFiles, formData.imageUrls, formData.contentType]);

  // Handle file upload with support for larger files - memoized
  const handleFileUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    const imagesPerSet = getImagesPerSetForContentType(formData.contentType);

    // Check if we have at least one image
    if (files.length === 0) {
      setSubmissionMessage("");
      return;
    }

    // Update message based on number of images
    const completeSets = Math.floor(files.length / imagesPerSet);
    const remainingImages = files.length % imagesPerSet;
    
    if (files.length < imagesPerSet) {
      setSubmissionMessage(
        `You have ${files.length} image(s). Missing slots will be left empty in the display.`
      );
    } else if (remainingImages === 0) {
      setSubmissionMessage(
        `Perfect! ${files.length} images will create ${completeSets} complete set(s). Each set will rotate every 5 seconds.`
      );
    } else {
      setSubmissionMessage(
        `Good! ${files.length} images will create ${completeSets} complete set(s) with ${remainingImages} extra image(s). Missing slots in the last set will be empty.`
      );
    }

    setImageFiles(files);

    // Process files: use base64 for small files, upload large files separately
    const imageUrls = [];
    
    for (const file of files) {
      if (file.size <= MAX_BASE64_SIZE_IMAGES) {
        // Small file: convert to base64
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
        imageUrls.push(base64);
      } else {
        // Large file: upload to server and get URL
        try {
          setSubmissionMessage(`Uploading large image: ${file.name}...`);
          const uploadedUrl = await uploadLargeFile(file);
          imageUrls.push(uploadedUrl);
        } catch (error) {
          setSubmissionMessage(`Error uploading ${file.name}: ${error.message}`);
          return;
        }
      }
    }

    setFormData((prev) => ({
      ...prev,
      imageUrls: imageUrls,
    }));

    setSubmissionMessage("All images processed successfully!");
  }, [formData.contentType, uploadLargeFile]);

  // Handle removing the video - memoized
  const handleRemoveVideo = useCallback(() => {
    setVideoFiles([]);
    setFormData((prev) => ({
      ...prev,
      videoUrls: [],
    }));
    setSubmissionMessage("");
  }, []);

  // Handle video file upload with support for larger files - memoized
  const handleVideoUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files);

    if (files.length > 1) {
      setSubmissionMessage("Error: Only one video file is allowed");
      return;
    }

    if (files.length === 0) {
      setVideoFiles([]);
      setFormData((prev) => ({ ...prev, videoUrls: [] }));
      return;
    }

    const file = files[0];
    setVideoFiles(files);

    // Process video: use base64 for small files, upload large files separately
    try {
      if (file.size <= MAX_BASE64_SIZE_VIDEOS) {
        // Small video: convert to base64
        setSubmissionMessage("Processing video...");
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
        
        setFormData((prev) => ({
          ...prev,
          videoUrls: [base64],
        }));
        setSubmissionMessage("Video processed successfully!");
      } else {
        // Large video: upload to server and get URL
        setSubmissionMessage(`Uploading large video: ${file.name}...`);
        const uploadedUrl = await uploadLargeFile(file);
        
        setFormData((prev) => ({
          ...prev,
          videoUrls: [uploadedUrl],
        }));
        setSubmissionMessage("Video uploaded successfully!");
      }
    } catch (error) {
      setSubmissionMessage(`Error processing video ${file.name}: ${error.message}`);
    }
  }, [uploadLargeFile]);

  // Handle form submission - memoized
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionMessage("");

    try {
      // Validate form data
      if (!formData.title.trim()) {
        throw new Error("Title is required");
      }

      if (formData.targetTVs.length === 0) {
        throw new Error("At least one TV must be selected");
      }

      // Validate content based on content type
      if (formData.contentType === "TEXT" && !formData.content.trim()) {
        throw new Error("Text content is required");
      }

      if (formData.contentType === "EMBED" && !formData.content.trim()) {
        throw new Error("Embed content is required");
      }

      if (formData.contentType.startsWith("IMAGE_")) {
        if (imageFiles.length === 0) {
          throw new Error(`${formData.contentType} requires at least 1 image`);
        }
        // Allow any number of images - partial sets are okay
      }

      if (formData.contentType === "VIDEO") {
        if (videoFiles.length !== 1) {
          throw new Error("Video content requires exactly 1 video file");
        }
      }

      // Validate date/time if provided - for multiple schedules, validate individual schedules
      if (!formData.isImmediate) {
        if (formData.isDailySchedule) {
          // Validate daily schedule
          if (!formData.dailyStartTime || !formData.dailyEndTime) {
            throw new Error("Both daily start time and end time are required for daily schedules");
          }
          
          const startTime = formData.dailyStartTime;
          const endTime = formData.dailyEndTime;
          
          // Basic time format validation
          if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime) || 
              !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(endTime)) {
            throw new Error("Invalid time format. Please use HH:MM format");
          }
        } else if (formData.timeSchedules.length === 0) {
          throw new Error(
            "For scheduled content, either set it as immediate, enable daily schedule, or add at least one time schedule"
          );
        }

        // Validate each time schedule (for non-daily schedules)
        if (!formData.isDailySchedule) {
          for (const schedule of formData.timeSchedules) {
            const startDate = new Date(schedule.startTime);
            const endDate = new Date(schedule.endTime);

            if (startDate >= endDate) {
              throw new Error(`Invalid time schedule: Start time (${formatScheduleDate(schedule.startTime)}) must be before end time (${formatScheduleDate(schedule.endTime)})`);
            }
          }
        }
      }

      // Prepare submission data in DTO format
      const submissionData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        contentType: formData.contentType,
        content: formData.content.trim(),
        imageUrls: formData.imageUrls,
        videoUrls: formData.videoUrls,
        targetTVs: formData.targetTVs,
        active: formData.active,
      };

      // Add time schedules based on whether content is immediate or scheduled
      if (formData.isImmediate) {
        submissionData.timeSchedules = [];
        submissionData.startTime = null;
        submissionData.endTime = null;
        submissionData.isImmediate = true;
      } else if (formData.isDailySchedule) {
        // For daily schedules, create a special marker or flag
        submissionData.isDailySchedule = true;
        submissionData.dailyStartTime = formData.dailyStartTime;
        submissionData.dailyEndTime = formData.dailyEndTime;
        submissionData.timeSchedules = [];
        submissionData.isImmediate = false;
        
        // Don't set legacy startTime/endTime for daily schedules to avoid conflicts
        submissionData.startTime = null;
        submissionData.endTime = null;
      } else {
        submissionData.timeSchedules = formData.timeSchedules.map(schedule => ({
          startTime: schedule.startTime,
          endTime: schedule.endTime
        }));
        submissionData.isImmediate = false;
        if (formData.timeSchedules.length > 0) {
          submissionData.startTime = formData.timeSchedules[0].startTime;
          submissionData.endTime = formData.timeSchedules[0].endTime;
        }
      }

      // Debug logging
      console.log("=== DEBUG: Frontend submission data ===");
      console.log("formData.isImmediate:", formData.isImmediate);
      console.log("formData.isDailySchedule:", formData.isDailySchedule);
      console.log("submissionData.isImmediate:", submissionData.isImmediate);
      console.log("submissionData.isDailySchedule:", submissionData.isDailySchedule);
      console.log("submissionData.dailyStartTime:", submissionData.dailyStartTime);
      console.log("submissionData.dailyEndTime:", submissionData.dailyEndTime);
      console.log("Full submissionData:", submissionData);
      console.log("=== END DEBUG ===");

      const response = await makeAuthenticatedRequest(
        "http://localhost:8090/api/content/from-request",
        {
          method: "POST",
          body: JSON.stringify(submissionData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result || `HTTP ${response.status}: ${response.statusText}`);
      }

      setSubmissionMessage("Content schedule created successfully!");

      // Reset form to initial state
      setFormData(getInitialFormData());
      setImageFiles([]);
      setVideoFiles([]);

      // Refresh schedules list
      await fetchSchedules();
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmissionMessage(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, imageFiles, videoFiles, fetchSchedules]);

  // Delete schedule - memoized
  const handleDeleteSchedule = useCallback(async (scheduleId) => {
    if (!window.confirm("Are you sure you want to delete this schedule?")) {
      return;
    }

    try {
      await makeAuthenticatedRequest(
        `http://localhost:8090/api/content/${scheduleId}`,
        {
          method: "DELETE",
        }
      );

      setSubmissionMessage("Schedule deleted successfully!");
      await fetchSchedules();
    } catch (error) {
      console.error("Error deleting schedule:", error);
      setSubmissionMessage(`Error deleting schedule: ${error.message}`);
    }
  }, [fetchSchedules]);

  // Toggle schedule active status - memoized
  const handleToggleActive = useCallback(async (schedule) => {
    // If trying to activate content, check if it has expired
    if (!schedule.active && schedule.endTime) {
      const now = new Date();
      const endTime = new Date(schedule.endTime);

      if (endTime <= now) {
        setSubmissionMessage(
          "Error: Cannot activate content that has already expired. Please update the end time first."
        );
        return;
      }
    }

    try {
      const updatedSchedule = {
        ...schedule,
        active: !schedule.active,
      };

      await makeAuthenticatedRequest(
        `http://localhost:8090/api/content/${schedule.id}`,
        {
          method: "PUT",
          body: JSON.stringify(updatedSchedule),
        }
      );

      setSubmissionMessage(
        `Schedule ${
          updatedSchedule.active ? "activated" : "deactivated"
        } successfully!`
      );
      await fetchSchedules();
    } catch (error) {
      console.error("Error updating schedule:", error);
      setSubmissionMessage(`Error updating schedule: ${error.message}`);
    }
  }, [fetchSchedules]);

  // Format date for display - memoized
  const formatDate = useCallback((dateString) => {
    return formatScheduleDate(dateString);
  }, []);

  // Handle TV filter change - memoized
  const handleTVFilterChange = useCallback((tvFilter) => {
    setSelectedTVFilter(tvFilter);
  }, []);

  // Filter schedules based on selected TV - memoized
  const filteredSchedules = useMemo(() => 
    selectedTVFilter === "all"
      ? schedules
      : schedules.filter((schedule) =>
          schedule.targetTVs.includes(selectedTVFilter)
        ),
    [selectedTVFilter, schedules]
  );

  return (
    <>
      {/* Content Creation Form */}
      <div className="admin-form-container">
        <form className="admin-form" onSubmit={handleSubmit}>
          {submissionMessage && (
            <div
              className={`submission-message ${
                submissionMessage.startsWith("Error") ? "error" : "success"
              }`}
            >
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
              {TV_OPTIONS.map((tv) => (
                <button
                  key={tv.value}
                  type="button"
                  className={`tv-select-btn ${
                    formData.targetTVs.includes(tv.value) ? "selected" : ""
                  }`}
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
              {CONTENT_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`content-type-option ${
                    formData.contentType === type.value ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="contentType"
                    value={type.value}
                    checked={formData.contentType === type.value}
                    onChange={() => handleContentTypeChange(type.value)}
                  />
                  <div className="content-type-icon">
                    {type.value === "IMAGE_QUAD" ? (
                      <div className="quad-icon-grid">
                        <span>🖼️</span>
                        <span>🖼️</span>
                        <span>🖼️</span>
                        <span>🖼️</span>
                      </div>
                    ) : (
                      type.icon
                    )}
                  </div>
                  <span>{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Content Input */}
          <div className="form-section">
            <h2>Content *</h2>

            {formData.contentType === "TEXT" && (
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

            {formData.contentType === "EMBED" && (
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

            {formData.contentType.startsWith("IMAGE_") && (
              <div className="file-upload-container">
                <label className="file-upload-label">
                  <input
                    type="file"
                    accept="image/*"
                    multiple={true}
                    onChange={handleFileUpload}
                    className="file-input"
                  />
                  <div className="upload-icon">📁</div>
                  <div>
                    <strong>Choose Images</strong>
                    <div className="upload-help">
                      {formData.contentType === "IMAGE_SINGLE" &&
                        "Upload multiple images - they will rotate every 5 seconds"}
                      {formData.contentType === "IMAGE_DUAL" &&
                        "Upload 1-2 images - they will be displayed side by side"}
                      {formData.contentType === "IMAGE_QUAD" &&
                        "Upload 1-4 images - they will be displayed in a 2x2 grid (empty slots will be left blank)"}
                    </div>
                  </div>
                </label>

                {imageFiles.length > 0 && (
                  <div className="selected-files">
                    {imageFiles.map((file, index) => (
                      <div key={index} className="selected-file">
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => handleRemoveImage(index)}
                          title="Remove this image"
                        >
                          ✕
                        </button>
                        <span className="file-name" title={file.name}>{truncateFileName(file.name)}</span>
                        {formData.imageUrls[index] && (
                          <img
                            src={formData.imageUrls[index]}
                            alt={file.name}
                            className="upload-file-thumbnail"
                            loading="lazy"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {formData.contentType === "VIDEO" && (
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
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={handleRemoveVideo}
                          title="Remove this video"
                        >
                          ✕
                        </button>
                        <span className="file-name" title={file.name}>{truncateFileName(file.name)}</span>
                        {formData.videoUrls[index] && (
                          <video
                            src={formData.videoUrls[index]}
                            className="upload-file-thumbnail"
                            controls
                            style={{ maxWidth: "200px", maxHeight: "150px" }}
                            preload="metadata"
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
              Choose whether this content should be displayed immediately (unscheduled) or at specific time slots.
              <br />
              <strong>Note:</strong> Scheduled content will temporarily override immediate content during its time windows.
            </p>

            {/* Immediate vs Scheduled Toggle */}
            <div className="schedule-type-selector">
              <label className={`schedule-type-option ${formData.isImmediate ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="scheduleType"
                  checked={formData.isImmediate}
                  onChange={() => handleImmediateToggle(true)}
                />
                <span>📅 Immediate Content</span>
                <small>Display immediately and indefinitely</small>
              </label>
              <label className={`schedule-type-option ${!formData.isImmediate ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="scheduleType"
                  checked={!formData.isImmediate}
                  onChange={() => handleImmediateToggle(false)}
                />
                <span>⏰ Scheduled Content</span>
                <small>Display at specific time slots</small>
              </label>
            </div>

            {!formData.isImmediate && (
              <div className="schedule-management">
                <h3>Time Schedules</h3>
                
                {/* Daily Schedule Input */}
                <DailyScheduleInput
                  dailyStartTime={formData.dailyStartTime}
                  dailyEndTime={formData.dailyEndTime}
                  onTimeChange={handleDailyTimeChange}
                  onSetCurrentTime={handleSetCurrentTimeForDaily}
                  isDailySchedule={formData.isDailySchedule}
                  onToggleDailySchedule={handleDailyScheduleToggle}
                />

                {/* Regular Schedule Form - only show if daily schedule is not enabled */}
                {!formData.isDailySchedule && (
                  <>
                    <div className="schedule-divider">
                      <span>OR</span>
                    </div>
                    
                    <div className="add-schedule-form">
                      <h4>One-time or Custom Schedules</h4>
                      <div className="schedule-inputs">
                        <div className="schedule-buttons">
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

                        <div className="form-group">
                          <button
                            type="button"
                            className="add-schedule-btn"
                            onClick={handleAddTimeSchedule}
                          >
                            ➕ Add Time Slot
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Display Added Schedules */}
                    <TimeScheduleList
                      timeSchedules={formData.timeSchedules}
                      onRemove={handleRemoveTimeSchedule}
                      formatDate={formatScheduleDate}
                    />
                  </>
                )}
              </div>
            )}

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
              {isSubmitting
                ? "Creating Schedule..."
                : "Create Content Schedule"}
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
              className={`tv-filter-btn all ${
                selectedTVFilter === "all" ? "active" : ""
              }`}
              onClick={() => handleTVFilterChange("all")}
            >
              All TVs
            </button>
            {TV_OPTIONS.map((tv) => (
              <button
                key={tv.value}
                className={`tv-filter-btn ${
                  selectedTVFilter === tv.value ? "active" : ""
                }`}
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
              {selectedTVFilter === "all"
                ? "No content schedules found"
                : `No content schedules found for ${
                    TV_OPTIONS.find((tv) => tv.value === selectedTVFilter)
                      ?.label || selectedTVFilter
                  }`}
            </span>
          </div>
        ) : (
          <div className="schedules-list">
            {filteredSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`schedule-card ${
                  !schedule.active ? "inactive" : ""
                }`}
              >
                <div className="schedule-header">
                  <h3>{schedule.title}</h3>
                  <div className="schedule-actions">
                    <button
                      className={`toggle-btn ${
                        schedule.active ? "active" : "inactive"
                      }`}
                      onClick={() => handleToggleActive(schedule)}
                      title={schedule.active ? "Deactivate" : "Activate"}
                    >
                      {schedule.active ? "🟢" : "🔴"}
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
                  <p>
                    <strong>Type:</strong> {schedule.contentType}
                  </p>
                  <p>
                    <strong>TVs:</strong> {schedule.targetTVs.join(", ")}
                  </p>
                  
                  {/* Display time schedules */}
                  {schedule.isDailySchedule ? (
                    <div className="schedule-times">
                      <div className="daily-schedule-display">
                        <strong>📅 Daily Schedule:</strong>
                        <div className="daily-time-display">
                          <span className="daily-time"><strong>From:</strong> {schedule.dailyStartTime}</span>
                          <span className="daily-time"><strong>To:</strong> {schedule.dailyEndTime}</span>
                        </div>
                        <div className="daily-schedule-note">
                          <em>Repeats daily during this time window</em>
                        </div>
                      </div>
                    </div>
                  ) : schedule.timeSchedules && schedule.timeSchedules.length > 0 ? (
                    <div className="schedule-times">
                      <strong>Scheduled Times ({schedule.timeSchedules.length} slot{schedule.timeSchedules.length > 1 ? 's' : ''}):</strong>
                      <div className="time-schedules-list">
                        {schedule.timeSchedules.map((timeSchedule, index) => (
                          <div key={index} className="time-schedule-item">
                            <div className="time-schedule-period">
                              <span className="time-start">{formatDate(timeSchedule.startTime)}</span>
                              <span className="time-separator">→</span>
                              <span className="time-end">{formatDate(timeSchedule.endTime)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : schedule.startTime && schedule.endTime ? (
                    <div className="schedule-times">
                      <p>
                        <strong>Start:</strong> {formatDate(schedule.startTime)}
                      </p>
                      <p>
                        <strong>End:</strong> {formatDate(schedule.endTime)}
                      </p>
                    </div>
                  ) : (
                    <div className="schedule-times">
                      <p className="schedule-immediate">
                        <strong>📅 Immediate Content</strong> - No time limit
                      </p>
                    </div>
                  )}

                  {schedule.description && (
                    <p>
                      <strong>Description:</strong> {schedule.description}
                    </p>
                  )}

                  {schedule.contentType === "TEXT" && schedule.content && (
                    <div className="content-preview">
                      <strong>Content:</strong>
                      <div className="text-preview">{schedule.content}</div>
                    </div>
                  )}

                  {schedule.contentType.startsWith("IMAGE_") &&
                    schedule.imageUrls && (
                      <div className="content-preview">
                        <strong>Images:</strong>
                        <div className="image-preview">
                          {schedule.imageUrls.map((url, index) => (
                            <img
                              key={index}
                              src={url}
                              alt={`Content ${index + 1}`}
                              className="preview-thumbnail"
                              loading="lazy"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                  {schedule.contentType === "VIDEO" && schedule.videoUrls && (
                    <div className="content-preview">
                      <strong>Videos:</strong>
                      <div className="video-preview">
                        {schedule.videoUrls.map((url, index) => (
                          <video
                            key={index}
                            src={url}
                            className="preview-thumbnail"
                            controls
                            style={{ maxWidth: "200px", maxHeight: "150px" }}
                            preload="metadata"
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
    </>
  );
});

export default ContentScheduleTab;

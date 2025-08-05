import React, { useState, useEffect, useCallback } from "react";
import { makeAuthenticatedRequest } from "../utils/authenticatedApi";
import { formatScheduleDate } from "../utils/contentScheduleUtils";
import { getCurrentDateTime, getCurrentTime, truncateFileName } from "../utils/adminUtils";
import { TV_OPTIONS, CONTENT_TYPES, MAX_BASE64_SIZE_IMAGES, MAX_BASE64_SIZE_VIDEOS, MAX_FALLBACK_SIZE } from "../constants/adminConstants";
import { API_ENDPOINTS } from "../config/apiConfig";
import TimeScheduleList from "./TimeScheduleList";
import DailyScheduleInput from "./DailyScheduleInput";

const TVProfilesTab = React.memo(() => {
  // Profile management state
  const [profiles, setProfiles] = useState([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [profileSubmissionMessage, setProfileSubmissionMessage] = useState("");
  
  // Profile form state
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: "",
    description: "",
    isImmediate: true, // Default to immediate
    timeSchedules: [], // Array of time schedules
    // Daily schedule fields
    isDailySchedule: false,
    dailyStartTime: getCurrentTime(),
    dailyEndTime: getCurrentTime(),
    slides: [
      {
        id: 1,
        title: "",
        description: "",
        contentType: "TEXT",
        content: "",
        imageUrls: [],
        videoUrls: [],
        durationSeconds: 10,
        active: true
      }
    ]
  });
  const [profileImageFiles, setProfileImageFiles] = useState({});
  const [profileVideoFiles, setProfileVideoFiles] = useState({});
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  
  // Assignment state
  const [assignments, setAssignments] = useState([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [assignmentFormData, setAssignmentFormData] = useState({
    tvName: "",
    profileId: ""
  });

  // Fetch profiles and assignments on mount
  useEffect(() => {
    fetchProfiles();
    fetchAssignments();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProfiles = useCallback(async () => {
    setIsLoadingProfiles(true);
    try {
      const response = await makeAuthenticatedRequest(`${API_ENDPOINTS.BASE_URL}/api/profiles`);
      const data = await response.json();
      setProfiles(data);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      setProfileSubmissionMessage(`Error fetching profiles: ${error.message}`);
    } finally {
      setIsLoadingProfiles(false);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    setIsLoadingAssignments(true);
    try {
      const response = await makeAuthenticatedRequest(`${API_ENDPOINTS.BASE_URL}/api/profiles/assignments`);
      const data = await response.json();
      setAssignments(data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setIsLoadingAssignments(false);
    }
  }, []);

  // Upload large files to server with fallback to base64 - memoized
  const uploadLargeFile = useCallback(async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await makeAuthenticatedRequest(
        `${API_ENDPOINTS.BASE_URL}/api/content/upload-file`,
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

  // Profile form handlers
  const handleProfileInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Profile scheduling handlers
  const handleProfileImmediateToggle = useCallback((isImmediate) => {
    setProfileFormData(prev => ({
      ...prev,
      isImmediate,
      timeSchedules: isImmediate ? [] : prev.timeSchedules,
      isDailySchedule: isImmediate ? false : prev.isDailySchedule
    }));
  }, []);

  const handleAddProfileTimeSchedule = useCallback(() => {
    if (!profileFormData.startTime || !profileFormData.endTime) {
      setProfileSubmissionMessage("Please set both start and end times before adding to schedule list");
      return;
    }

    const startDate = new Date(profileFormData.startTime);
    const endDate = new Date(profileFormData.endTime);

    if (startDate >= endDate) {
      setProfileSubmissionMessage("Start time must be before end time");
      return;
    }

    const newSchedule = {
      startTime: profileFormData.startTime,
      endTime: profileFormData.endTime,
      id: Date.now() // Temporary ID for frontend management
    };

    setProfileFormData(prev => ({
      ...prev,
      timeSchedules: [...prev.timeSchedules, newSchedule],
      startTime: getCurrentDateTime(),
      endTime: getCurrentDateTime()
    }));

    setProfileSubmissionMessage("Time schedule added successfully! Add more or submit to create profile.");
  }, [profileFormData.startTime, profileFormData.endTime]);

  const handleRemoveProfileTimeSchedule = useCallback((scheduleId) => {
    setProfileFormData(prev => ({
      ...prev,
      timeSchedules: prev.timeSchedules.filter(schedule => schedule.id !== scheduleId)
    }));
  }, []);

  const handleSetProfileCurrentTime = useCallback(() => {
    const currentTime = getCurrentDateTime();
    setProfileFormData(prev => ({
      ...prev,
      startTime: currentTime,
      endTime: currentTime,
      isImmediate: false
    }));
  }, []);

  // Handle daily schedule toggle for profiles
  const handleProfileDailyScheduleToggle = useCallback((isDailySchedule) => {
    setProfileFormData((prev) => ({
      ...prev,
      isDailySchedule,
      timeSchedules: isDailySchedule ? [] : prev.timeSchedules,
      dailyStartTime: isDailySchedule ? getCurrentTime() : prev.dailyStartTime,
      dailyEndTime: isDailySchedule ? getCurrentTime() : prev.dailyEndTime,
    }));
  }, []);

  // Handle daily schedule time changes for profiles
  const handleProfileDailyTimeChange = useCallback((e) => {
    const { name, value } = e.target;
    setProfileFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // Handle setting current time for daily schedule for profiles
  const handleSetProfileCurrentTimeForDaily = useCallback(() => {
    const currentTime = getCurrentTime();
    setProfileFormData((prev) => ({
      ...prev,
      dailyStartTime: currentTime,
      dailyEndTime: currentTime,
    }));
  }, []);

  const handleSlideInputChange = useCallback((slideIndex, field, value) => {
    setProfileFormData(prev => ({
      ...prev,
      slides: prev.slides.map((slide, index) => 
        index === slideIndex ? { ...slide, [field]: value } : slide
      )
    }));
  }, []);

  const handleSlideContentTypeChange = useCallback((slideIndex, contentType) => {
    setProfileFormData(prev => ({
      ...prev,
      slides: prev.slides.map((slide, index) => 
        index === slideIndex ? {
          ...slide,
          contentType,
          content: "",
          imageUrls: [],
          videoUrls: [],
          // Auto-generate title for image and video content types
          title: contentType.startsWith("IMAGE_") || contentType === "VIDEO" 
            ? `${contentType.replace('_', ' ').toLowerCase()} slide ${slideIndex + 1}`
            : slide.title
        } : slide
      )
    }));
    
    // Clear any uploaded files for this slide
    setProfileImageFiles(prev => ({
      ...prev,
      [slideIndex]: []
    }));
    setProfileVideoFiles(prev => ({
      ...prev,
      [slideIndex]: []
    }));
  }, []);

  const addSlide = useCallback(() => {
    if (profileFormData.slides.length < 3) {
      setProfileFormData(prev => ({
        ...prev,
        slides: [...prev.slides, {
          id: prev.slides.length + 1,
          title: "",
          description: "",
          contentType: "TEXT",
          content: "",
          imageUrls: [],
          videoUrls: [],
          durationSeconds: 10,
          active: true
        }]
      }));
    }
  }, [profileFormData.slides.length]);

  const removeSlide = useCallback((slideIndex) => {
    if (profileFormData.slides.length > 1) {
      setProfileFormData(prev => ({
        ...prev,
        slides: prev.slides.filter((_, index) => index !== slideIndex)
      }));
      
      // Clear files for removed slide
      setProfileImageFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[slideIndex];
        return newFiles;
      });
      setProfileVideoFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[slideIndex];
        return newFiles;
      });
    }
  }, [profileFormData.slides.length]);

  const handleSlideFileUpload = useCallback(async (slideIndex, files, fileType) => {
    if (!files || files.length === 0) return;

    const allFiles = Array.from(files);
    const maxSize = fileType === 'image' ? MAX_BASE64_SIZE_IMAGES : MAX_BASE64_SIZE_VIDEOS;
    
    try {
      const fileDataUrls = [];
      
      for (const file of allFiles) {
        if (file.size <= maxSize) {
          // Small file: convert to base64
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
          });
          fileDataUrls.push(base64);
        } else {
          // Large file: upload to server and get URL
          try {
            setProfileSubmissionMessage(`Uploading large file: ${file.name}...`);
            const uploadedUrl = await uploadLargeFile(file);
            fileDataUrls.push(uploadedUrl);
          } catch (error) {
            setProfileSubmissionMessage(`Error uploading ${file.name}: ${error.message}`);
            return;
          }
        }
      }
      
      if (fileType === 'image') {
        setProfileImageFiles(prev => ({
          ...prev,
          [slideIndex]: allFiles
        }));
        
        setProfileFormData(prev => ({
          ...prev,
          slides: prev.slides.map((slide, index) => 
            index === slideIndex ? { ...slide, imageUrls: fileDataUrls } : slide
          )
        }));
      } else {
        setProfileVideoFiles(prev => ({
          ...prev,
          [slideIndex]: allFiles
        }));
        
        setProfileFormData(prev => ({
          ...prev,
          slides: prev.slides.map((slide, index) => 
            index === slideIndex ? { ...slide, videoUrls: fileDataUrls } : slide
          )
        }));
      }
      
      setProfileSubmissionMessage("All files processed successfully!");
    } catch (error) {
      console.error("Error processing files:", error);
      setProfileSubmissionMessage("Error processing files");
    }
  }, [uploadLargeFile]);

  const handleRemoveSlideFile = useCallback((slideIndex, fileIndex, fileType) => {
    if (fileType === 'image') {
      setProfileImageFiles(prev => ({
        ...prev,
        [slideIndex]: prev[slideIndex]?.filter((_, index) => index !== fileIndex) || []
      }));
      
      setProfileFormData(prev => ({
        ...prev,
        slides: prev.slides.map((slide, index) => 
          index === slideIndex ? {
            ...slide,
            imageUrls: slide.imageUrls.filter((_, idx) => idx !== fileIndex)
          } : slide
        )
      }));
    } else {
      setProfileVideoFiles(prev => ({
        ...prev,
        [slideIndex]: prev[slideIndex]?.filter((_, index) => index !== fileIndex) || []
      }));
      
      setProfileFormData(prev => ({
        ...prev,
        slides: prev.slides.map((slide, index) => 
          index === slideIndex ? {
            ...slide,
            videoUrls: slide.videoUrls.filter((_, idx) => idx !== fileIndex)
          } : slide
        )
      }));
    }
  }, []);

  const handleSubmitProfile = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmittingProfile(true);
    setProfileSubmissionMessage("");

    try {
      // Validate form
      if (!profileFormData.name.trim()) {
        throw new Error("Profile name is required");
      }

      if (profileFormData.slides.length === 0) {
        throw new Error("At least one slide is required");
      }

      // Validate scheduling
      if (!profileFormData.isImmediate) {
        if (profileFormData.isDailySchedule) {
          // Validate daily schedule
          if (!profileFormData.dailyStartTime || !profileFormData.dailyEndTime) {
            throw new Error("Both daily start time and end time are required for daily schedules");
          }
          
          const startTime = profileFormData.dailyStartTime;
          const endTime = profileFormData.dailyEndTime;
          
          // Basic time format validation
          if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime) || 
              !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(endTime)) {
            throw new Error("Invalid time format. Please use HH:MM format");
          }
        } else if (profileFormData.timeSchedules.length === 0) {
          throw new Error("For scheduled profiles, either enable daily schedule or add at least one time schedule");
        }
      }

      // Validate each time schedule (for non-daily schedules)
      if (!profileFormData.isImmediate && !profileFormData.isDailySchedule) {
        for (let i = 0; i < profileFormData.timeSchedules.length; i++) {
          const schedule = profileFormData.timeSchedules[i];
          const startDate = new Date(schedule.startTime);
          const endDate = new Date(schedule.endTime);

          if (startDate >= endDate) {
            throw new Error(`Time schedule ${i + 1}: Start time must be before end time`);
          }
        }
      }

      // Validate each slide
      for (let i = 0; i < profileFormData.slides.length; i++) {
        const slide = profileFormData.slides[i];
        
        // Only require title for TEXT content type
        if (slide.contentType === "TEXT" && !slide.title.trim()) {
          throw new Error(`Slide ${i + 1}: Title is required for text content`);
        }

        if (slide.contentType === "TEXT" && !slide.content.trim()) {
          throw new Error(`Slide ${i + 1}: Text content is required`);
        }

        if (slide.contentType === "EMBED" && !slide.content.trim()) {
          throw new Error(`Slide ${i + 1}: Embed content is required`);
        }

        if (slide.contentType.startsWith("IMAGE_") && slide.imageUrls.length === 0) {
          throw new Error(`Slide ${i + 1}: At least one image is required`);
        }

        if (slide.contentType === "VIDEO" && slide.videoUrls.length === 0) {
          throw new Error(`Slide ${i + 1}: At least one video is required`);
        }
      }

      // Prepare submission data
      const submissionData = {
        name: profileFormData.name.trim(),
        description: profileFormData.description.trim(),
        immediate: profileFormData.isImmediate, // Backend expects 'immediate' not 'isImmediate'
        timeSchedules: profileFormData.isImmediate || profileFormData.isDailySchedule ? [] : profileFormData.timeSchedules.map(schedule => ({
          startTime: schedule.startTime,
          endTime: schedule.endTime
        })),
        // Daily schedule fields - always include them but only populate for non-immediate profiles
        dailySchedule: profileFormData.isImmediate ? false : profileFormData.isDailySchedule, // Backend expects 'dailySchedule' not 'isDailySchedule'
        dailyStartTime: profileFormData.isImmediate ? null : profileFormData.dailyStartTime,
        dailyEndTime: profileFormData.isImmediate ? null : profileFormData.dailyEndTime,
        slides: profileFormData.slides.map((slide, index) => ({
          slideOrder: index + 1,
          title: slide.title.trim() || (slide.contentType.startsWith("IMAGE_") || slide.contentType === "VIDEO" 
            ? `${slide.contentType.replace('_', ' ').toLowerCase()} slide ${index + 1}` 
            : slide.title.trim()),
          description: slide.description.trim(),
          contentType: slide.contentType,
          content: slide.content.trim(),
          imageUrls: slide.imageUrls,
          videoUrls: slide.videoUrls,
          durationSeconds: slide.durationSeconds,
          active: slide.active
        }))
      };

      console.log("Submitting profile data:", submissionData);

      const response = await makeAuthenticatedRequest(`${API_ENDPOINTS.BASE_URL}/api/profiles`, {
        method: "POST",
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `HTTP ${response.status}`);
      }

      setProfileSubmissionMessage("Profile created successfully!");
      
      // Reset form
      setProfileFormData({
        name: "",
        description: "",
        isImmediate: true,
        timeSchedules: [],
        // Daily schedule fields
        isDailySchedule: false,
        dailyStartTime: getCurrentTime(),
        dailyEndTime: getCurrentTime(),
        slides: [{
          id: 1,
          title: "",
          description: "",
          contentType: "TEXT",
          content: "",
          imageUrls: [],
          videoUrls: [],
          durationSeconds: 10,
          active: true
        }]
      });
      setProfileImageFiles({});
      setProfileVideoFiles({});
      setShowProfileForm(false);

      // Refresh profiles
      fetchProfiles();

    } catch (error) {
      console.error("Error creating profile:", error);
      setProfileSubmissionMessage(`Error: ${error.message}`);
    } finally {
      setIsSubmittingProfile(false);
    }
  }, [profileFormData, fetchProfiles]);

  const handleDeleteProfile = useCallback(async (profileId) => {
    if (!window.confirm("Are you sure you want to delete this profile? This will also unassign it from all TVs.")) return;

    try {
      // First, get all assignments for this profile and delete them
      const assignmentsResponse = await makeAuthenticatedRequest(`${API_ENDPOINTS.BASE_URL}/api/profiles/assignments`);
      if (assignmentsResponse.ok) {
        const allAssignments = await assignmentsResponse.json();
        const profileAssignments = allAssignments.filter(assignment => assignment.profile?.id === profileId);
        
        // Delete each assignment for this profile
        for (const assignment of profileAssignments) {
          const deleteAssignmentResponse = await makeAuthenticatedRequest(`${API_ENDPOINTS.BASE_URL}/api/profiles/assignments/${assignment.id}`, {
            method: "DELETE"
          });
          
          if (!deleteAssignmentResponse.ok) {
            console.warn(`Failed to delete assignment ${assignment.id}`);
          }
        }
      }

      // Then delete the profile
      const response = await makeAuthenticatedRequest(`${API_ENDPOINTS.BASE_URL}/api/profiles/${profileId}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      setProfileSubmissionMessage("Profile deleted and unassigned from all TVs successfully!");
      
      // Refresh profiles and assignments
      await fetchProfiles();
      await fetchAssignments();
      
    } catch (error) {
      console.error("Error deleting profile:", error);
      setProfileSubmissionMessage(`Error deleting profile: ${error.message}`);
    }
  }, [fetchProfiles, fetchAssignments]);

  // Assignment handlers
  const handleAssignmentInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setAssignmentFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleSubmitAssignment = useCallback(async (e) => {
    e.preventDefault();

    try {
      if (!assignmentFormData.tvName || !assignmentFormData.profileId) {
        throw new Error("Please select both a TV and a profile");
      }

      const response = await makeAuthenticatedRequest(`${API_ENDPOINTS.BASE_URL}/api/profiles/assign`, {
        method: "POST",
        body: JSON.stringify({
          tvName: assignmentFormData.tvName,
          profileId: parseInt(assignmentFormData.profileId)
        })
      });

      console.log("Assignment request sent:", {
        tvName: assignmentFormData.tvName,
        profileId: parseInt(assignmentFormData.profileId)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `HTTP ${response.status}`);
      }

      setProfileSubmissionMessage("Profile assigned successfully!");
      setAssignmentFormData({ tvName: "", profileId: "" });
      setShowAssignmentForm(false);
      
      // Add a small delay before refreshing to ensure backend processing is complete
      setTimeout(() => {
        fetchAssignments();
      }, 500);

    } catch (error) {
      console.error("Error assigning profile:", error);
      setProfileSubmissionMessage(`Error: ${error.message}`);
    }
  }, [assignmentFormData, fetchAssignments]);

  const handleUnassignProfile = useCallback(async (assignmentId) => {
    if (!window.confirm("Are you sure you want to unassign this profile?")) return;

    try {
      const response = await makeAuthenticatedRequest(`${API_ENDPOINTS.BASE_URL}/api/profiles/assignments/${assignmentId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setProfileSubmissionMessage("Profile unassigned successfully!");
      fetchAssignments();
    } catch (error) {
      console.error("Error unassigning profile:", error);
      setProfileSubmissionMessage(`Error: ${error.message}`);
    }
  }, [fetchAssignments]);

  return (
    <div className="profiles-tab">
      <div className="profiles-header">
        <h2>TV Profile Management</h2>
        <p className="profiles-subtitle">
          Create custom profiles with up to 3 slides and assign them to TVs
        </p>
      </div>

      {profileSubmissionMessage && (
        <div className={`submission-message ${profileSubmissionMessage.startsWith("Error") ? "error" : "success"}`}>
          {profileSubmissionMessage}
        </div>
      )}

      {/* Action Buttons */}
      <div className="profiles-actions">
        <button
          className="action-btn create-profile-btn"
          onClick={() => setShowProfileForm(!showProfileForm)}
        >
          <span className="btn-icon">➕</span>
          {showProfileForm ? "Cancel" : "Create New Profile"}
        </button>
        <button
          className="action-btn assign-profile-btn"
          onClick={() => setShowAssignmentForm(!showAssignmentForm)}
        >
          <span className="btn-icon">📺</span>
          {showAssignmentForm ? "Cancel" : "Assign Profile to TV"}
        </button>
      </div>

      {/* Create Profile Form */}
      {showProfileForm && (
        <div className="profile-form-container">
          <form className="profile-form" onSubmit={handleSubmitProfile}>
            <h3>Create New Profile</h3>
            
            {/* Basic Information */}
            <div className="form-section">
              <h4>Basic Information</h4>
              <div className="form-group">
                <label className="form-label">Profile Name *</label>
                <input
                  type="text"
                  name="name"
                  value={profileFormData.name}
                  onChange={handleProfileInputChange}
                  className="form-input"
                  placeholder="Enter profile name"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={profileFormData.description}
                  onChange={handleProfileInputChange}
                  className="form-textarea"
                  placeholder="Enter profile description (optional)"
                  rows="2"
                />
              </div>
            </div>

            {/* Profile Scheduling */}
            <div className="form-section">
              <h4>Profile Scheduling</h4>
              <p className="form-help">
                Choose whether this profile should be active immediately or only during specific time slots.
              </p>

              {/* Immediate vs Scheduled Toggle */}
              <div className="schedule-type-selector">
                <label className={`schedule-type-option ${profileFormData.isImmediate ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="profileScheduleType"
                    checked={profileFormData.isImmediate}
                    onChange={() => handleProfileImmediateToggle(true)}
                  />
                  <span>📅 Immediate Profile</span>
                  <small>Active immediately when assigned to TV</small>
                </label>
                <label className={`schedule-type-option ${!profileFormData.isImmediate ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="profileScheduleType"
                    checked={!profileFormData.isImmediate}
                    onChange={() => handleProfileImmediateToggle(false)}
                  />
                  <span>⏰ Scheduled Profile</span>
                  <small>Active only during specific time slots</small>
                </label>
              </div>

              {!profileFormData.isImmediate && (
                <div className="schedule-management">
                  <h4>Time Schedules</h4>
                  
                  {/* Daily Schedule Input */}
                  <DailyScheduleInput
                    dailyStartTime={profileFormData.dailyStartTime}
                    dailyEndTime={profileFormData.dailyEndTime}
                    onTimeChange={handleProfileDailyTimeChange}
                    onSetCurrentTime={handleSetProfileCurrentTimeForDaily}
                    isDailySchedule={profileFormData.isDailySchedule}
                    onToggleDailySchedule={handleProfileDailyScheduleToggle}
                  />

                  {/* Regular Schedule Form - only show if daily schedule is not enabled */}
                  {!profileFormData.isDailySchedule && (
                    <>
                      <div className="schedule-divider">
                        <span>OR</span>
                      </div>
                      
                      {/* Add New Schedule Form */}
                      <div className="add-schedule-form">
                        <h4>One-time or Custom Schedules</h4>
                    <div className="schedule-inputs">
                      <div className="schedule-buttons">
                        <button
                          type="button"
                          className="schedule-helper-btn current"
                          onClick={handleSetProfileCurrentTime}
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
                          value={profileFormData.startTime || ''}
                          onChange={handleProfileInputChange}
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">End Time</label>
                        <input
                          type="datetime-local"
                          name="endTime"
                          value={profileFormData.endTime || ''}
                          onChange={handleProfileInputChange}
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <button
                          type="button"
                          className="add-schedule-btn"
                          onClick={handleAddProfileTimeSchedule}
                        >
                          ➕ Add Time Slot
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Display Added Schedules */}
                  <TimeScheduleList
                    timeSchedules={profileFormData.timeSchedules}
                    onRemove={handleRemoveProfileTimeSchedule}
                    formatDate={formatScheduleDate}
                  />
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Slides */}
            <div className="form-section">
              <div className="slides-header">
                <h4>Slides ({profileFormData.slides.length}/3)</h4>
                {profileFormData.slides.length < 3 && (
                  <button
                    type="button"
                    className="add-slide-btn"
                    onClick={addSlide}
                  >
                    ➕ Add Slide
                  </button>
                )}
              </div>

              {profileFormData.slides.map((slide, slideIndex) => (
                <div key={slide.id} className="slide-editor">
                  <div className="slide-header">
                    <h5>Slide {slideIndex + 1}</h5>
                    {profileFormData.slides.length > 1 && (
                      <button
                        type="button"
                        className="remove-slide-btn"
                        onClick={() => removeSlide(slideIndex)}
                      >
                        🗑️ Remove
                      </button>
                    )}
                  </div>

                  <div className="slide-content">
                    <div className="form-group">
                      <label className="form-label">
                        Slide Title {slide.contentType === 'TEXT' ? '*' : ''}
                        {(slide.contentType.startsWith('IMAGE_') || slide.contentType === 'VIDEO') && (
                          <span className="title-note"> (Not displayed on TV)</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={slide.title}
                        onChange={(e) => handleSlideInputChange(slideIndex, 'title', e.target.value)}
                        className="form-input"
                        placeholder={
                          slide.contentType === 'TEXT' 
                            ? "Enter slide title" 
                            : (slide.contentType.startsWith('IMAGE_') || slide.contentType === 'VIDEO')
                              ? "Auto-generated (not shown on TV)"
                              : "Enter slide title (optional)"
                        }
                        required={slide.contentType === 'TEXT'}
                        readOnly={slide.contentType.startsWith('IMAGE_') || slide.contentType === 'VIDEO'}
                        style={{
                          backgroundColor: (slide.contentType.startsWith('IMAGE_') || slide.contentType === 'VIDEO') 
                            ? '#f5f5f5' 
                            : 'inherit',
                          cursor: (slide.contentType.startsWith('IMAGE_') || slide.contentType === 'VIDEO') 
                            ? 'not-allowed' 
                            : 'text'
                        }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Slide Description</label>
                      <input
                        type="text"
                        value={slide.description}
                        onChange={(e) => handleSlideInputChange(slideIndex, 'description', e.target.value)}
                        className="form-input"
                        placeholder="Enter slide description (optional)"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Content Type *</label>
                      <div className="content-type-selector">
                        {CONTENT_TYPES.map((type) => (
                          <label
                            key={type.value}
                            className={`content-type-option ${slide.contentType === type.value ? "selected" : ""}`}
                          >
                            <input
                              type="radio"
                              name={`contentType-${slideIndex}`}
                              value={type.value}
                              checked={slide.contentType === type.value}
                              onChange={() => handleSlideContentTypeChange(slideIndex, type.value)}
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

                    {/* Content based on type */}
                    {slide.contentType === "TEXT" && (
                      <div className="form-group">
                        <label className="form-label">Text Content *</label>
                        <textarea
                          value={slide.content}
                          onChange={(e) => handleSlideInputChange(slideIndex, 'content', e.target.value)}
                          className="form-textarea"
                          placeholder="Enter your text content here..."
                          rows="4"
                          required
                        />
                      </div>
                    )}

                    {slide.contentType === "EMBED" && (
                      <div className="form-group">
                        <label className="form-label">Embed HTML/Code *</label>
                        <textarea
                          value={slide.content}
                          onChange={(e) => handleSlideInputChange(slideIndex, 'content', e.target.value)}
                          className="embed-textarea"
                          placeholder="Enter HTML, iframe, or other embed code..."
                          rows="6"
                          required
                        />
                      </div>
                    )}

                    {slide.contentType.startsWith("IMAGE_") && (
                      <div className="file-upload-container">
                        <label className="file-upload-label">
                          <input
                            type="file"
                            accept="image/*"
                            multiple={true}
                            onChange={(e) => handleSlideFileUpload(slideIndex, e.target.files, 'image')}
                            className="file-input"
                          />
                          <div className="upload-icon">📁</div>
                          <div>
                            <strong>Choose Images</strong>
                            <div className="upload-help">
                              {slide.contentType === "IMAGE_SINGLE" && "Upload multiple images - they will rotate every 5 seconds"}
                              {slide.contentType === "IMAGE_DUAL" && "Upload 1-2 images - they will be displayed side by side"}
                              {slide.contentType === "IMAGE_QUAD" && "Upload 1-4 images - they will be displayed in a 2x2 grid (empty slots will be left blank)"}
                            </div>
                          </div>
                        </label>

                        {profileImageFiles[slideIndex]?.length > 0 && (
                          <div className="selected-files">
                            {profileImageFiles[slideIndex].map((file, fileIndex) => (
                              <div key={fileIndex} className="selected-file">
                                <button
                                  type="button"
                                  className="remove-image-btn"
                                  onClick={() => handleRemoveSlideFile(slideIndex, fileIndex, 'image')}
                                  title="Remove this image"
                                >
                                  ✕
                                </button>
                                <span className="file-name" title={file.name}>{truncateFileName(file.name)}</span>
                                {slide.imageUrls[fileIndex] && (
                                  <img
                                    src={slide.imageUrls[fileIndex]}
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

                    {slide.contentType === "VIDEO" && (
                      <div className="file-upload-container">
                        <label className="file-upload-label">
                          <input
                            type="file"
                            accept="video/*"
                            multiple={true}
                            onChange={(e) => handleSlideFileUpload(slideIndex, e.target.files, 'video')}
                            className="file-input"
                          />
                          <div className="upload-icon">🎥</div>
                          <div>
                            <strong>Choose Videos</strong>
                            <div className="upload-help">
                              Select multiple video files (MP4, WebM, OGG) - they will play sequentially
                            </div>
                          </div>
                        </label>

                        {profileVideoFiles[slideIndex]?.length > 0 && (
                          <div className="selected-files">
                            {profileVideoFiles[slideIndex].map((file, fileIndex) => (
                              <div key={fileIndex} className="selected-file">
                                <button
                                  type="button"
                                  className="remove-image-btn"
                                  onClick={() => handleRemoveSlideFile(slideIndex, fileIndex, 'video')}
                                  title="Remove this video"
                                >
                                  ✕
                                </button>
                                <span className="file-name" title={file.name}>{truncateFileName(file.name)}</span>
                                {slide.videoUrls[fileIndex] && (
                                  <video
                                    src={slide.videoUrls[fileIndex]}
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

                    <div className="form-group">
                      <label className="form-label">Duration (seconds)</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={slide.durationSeconds}
                        onChange={(e) => handleSlideInputChange(slideIndex, 'durationSeconds', parseInt(e.target.value) || 10)}
                        className="form-input duration-input"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="admin-submit-btn"
                disabled={isSubmittingProfile}
              >
                {isSubmittingProfile ? "Creating Profile..." : "Create Profile"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assignment Form */}
      {showAssignmentForm && (
        <div className="assignment-form-container">
          <form className="assignment-form" onSubmit={handleSubmitAssignment}>
            <h3>Assign Profile to TV</h3>
            
            <div className="form-group">
              <label className="form-label">Select TV *</label>
              <select
                name="tvName"
                value={assignmentFormData.tvName}
                onChange={handleAssignmentInputChange}
                className="form-select"
                required
              >
                <option value="">Choose a TV...</option>
                {TV_OPTIONS.map((tv) => (
                  <option key={tv.value} value={tv.value}>
                    {tv.icon} {tv.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Select Profile *</label>
              <select
                name="profileId"
                value={assignmentFormData.profileId}
                onChange={handleAssignmentInputChange}
                className="form-select"
                required
              >
                <option value="">Choose a profile...</option>
                {profiles.filter(profile => profile.active).map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} ({profile.slides?.length || 0} slides)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="admin-submit-btn">
                Assign Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Existing Profiles */}
      <div className="profiles-section">
        <h3>Existing Profiles</h3>
        {isLoadingProfiles ? (
          <div className="loading-message">Loading profiles...</div>
        ) : profiles.length === 0 ? (
          <div className="no-content">
            <div className="empty-icon">👥</div>
            <span>No profiles found. Create your first profile above.</span>
          </div>
        ) : (
          <div className="profiles-list">
            {profiles.map((profile) => (
              <div key={profile.id} className={`profile-card ${!profile.active ? "inactive" : ""}`}>
                <div className="profile-header">
                  <h4>{profile.name}</h4>
                  <div className="profile-actions">
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteProfile(profile.id)}
                      title="Delete Profile"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className="profile-details">
                  {profile.description && (
                    <p><strong>Description:</strong> {profile.description}</p>
                  )}
                  <p><strong>Slides:</strong> {profile.slides?.length || 0}</p>
                  
                  {/* Profile scheduling information */}
                  <div className="profile-schedule-info">
                    {(profile.isImmediate || profile.immediate) ? (
                      <p><strong>Scheduling:</strong> <span className="schedule-immediate">📅 Immediate (Always Active)</span></p>
                    ) : profile.isDailySchedule ? (
                      <div>
                        <p><strong>Scheduling:</strong> <span className="schedule-timed">⏰ Daily Schedule ({profile.dailyStartTime} - {profile.dailyEndTime})</span></p>
                      </div>
                    ) : (
                      <div>
                        <p><strong>Scheduling:</strong> <span className="schedule-timed">⏰ Scheduled ({profile.timeSchedules?.length || 0} time slot{profile.timeSchedules?.length !== 1 ? 's' : ''})</span></p>
                        {profile.timeSchedules?.length > 0 && (
                          <div className="profile-schedules-preview">
                            <div className="schedules-list-compact">
                              {profile.timeSchedules.slice(0, 2).map((schedule, index) => (
                                <div key={index} className="schedule-item-compact">
                                  <span className="schedule-time-compact">
                                    {formatScheduleDate(schedule.startTime)} → {formatScheduleDate(schedule.endTime)}
                                  </span>
                                </div>
                              ))}
                              {profile.timeSchedules.length > 2 && (
                                <div className="schedule-item-more">
                                  +{profile.timeSchedules.length - 2} more time slot{profile.timeSchedules.length - 2 !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {profile.slides?.length > 0 && (
                    <div className="slides-preview">
                      <strong>Slides:</strong>
                      <div className="slides-list">
                        {profile.slides.map((slide, index) => (
                          <div key={slide.id || index} className="slide-preview">
                            <div className="slide-info">
                              <span className="slide-number">Slide {slide.slideOrder || index + 1}</span>
                              <span className="slide-title">{slide.title || `${slide.contentType} content`}</span>
                              <span className="slide-type">{slide.contentType}</span>
                              <span className="slide-duration">{slide.durationSeconds}s</span>
                            </div>
                          </div>
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

      {/* Current Assignments */}
      <div className="assignments-section">
        <h3>Current TV Assignments</h3>
        {isLoadingAssignments ? (
          <div className="loading-message">Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div className="no-content">
            <div className="empty-icon">📺</div>
            <span>No profiles are currently assigned to TVs.</span>
          </div>
        ) : (
          <div className="assignments-list">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="assignment-card">
                <div className="assignment-info">
                  <div className="tv-info">
                    <span className="tv-icon">📺</span>
                    <span className="tv-name">{assignment.tvName}</span>
                  </div>
                  <div className="assignment-arrow">→</div>
                  <div className="profile-info">
                    <span className="profile-name">{assignment.profile?.name}</span>
                    <span className="profile-slides">({assignment.profile?.slides?.length || 0} slides)</span>
                  </div>
                </div>
                <button
                  className="unassign-btn"
                  onClick={() => handleUnassignProfile(assignment.id)}
                  title="Unassign Profile"
                >
                  ✕ Unassign
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default TVProfilesTab;

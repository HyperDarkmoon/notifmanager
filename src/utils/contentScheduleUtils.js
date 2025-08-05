// ContentSchedule utility functions and constants

export const CONTENT_TYPES = {
  TEXT: "TEXT",
  IMAGE_SINGLE: "IMAGE_SINGLE",
  IMAGE_DUAL: "IMAGE_DUAL",
  IMAGE_QUAD: "IMAGE_QUAD",
  VIDEO: "VIDEO",
  EMBED: "EMBED",
};

export const TV_ENUM = {
  TV1: "TV1",
  TV2: "TV2",
  TV3: "TV3",
  TV4: "TV4",
};

export const getMaxFilesForContentType = (contentType) => {
  switch (contentType) {
    case CONTENT_TYPES.IMAGE_SINGLE:
      return Infinity; // Allow unlimited images, will show 1 at a time
    case CONTENT_TYPES.IMAGE_DUAL:
      return Infinity; // Allow unlimited images, will show 2 at a time
    case CONTENT_TYPES.IMAGE_QUAD:
      return Infinity; // Allow unlimited images, will show 4 at a time
    case CONTENT_TYPES.VIDEO:
      return Infinity; // Allow unlimited videos, will play sequentially
    default:
      return 0;
  }
};

export const getImagesPerSetForContentType = (contentType) => {
  switch (contentType) {
    case CONTENT_TYPES.IMAGE_SINGLE:
      return 1;
    case CONTENT_TYPES.IMAGE_DUAL:
      return 2;
    case CONTENT_TYPES.IMAGE_QUAD:
      return 4;
    default:
      return 0;
  }
};

export const getImageSetsFromUrls = (imageUrls, contentType) => {
  const imagesPerSet = getImagesPerSetForContentType(contentType);
  if (imagesPerSet === 0) return [];
  
  const sets = [];
  for (let i = 0; i < imageUrls.length; i += imagesPerSet) {
    sets.push(imageUrls.slice(i, i + imagesPerSet));
  }
  return sets;
};

export const getVideoSetsFromUrls = (videoUrls) => {
  // For videos, each video is its own "set" (plays one at a time)
  return videoUrls.map(url => [url]);
};

export const validateSchedule = (formData) => {
  const errors = [];

  if (!formData.title.trim()) {
    errors.push("Title is required");
  }

  if (formData.targetTVs.length === 0) {
    errors.push("At least one TV must be selected");
  }

  if (formData.contentType === CONTENT_TYPES.TEXT && !formData.content.trim()) {
    errors.push("Text content is required");
  }

  if (
    formData.contentType === CONTENT_TYPES.EMBED &&
    !formData.content.trim()
  ) {
    errors.push("Embed content is required");
  }

  if (formData.contentType.startsWith("IMAGE_")) {
    if (formData.imageUrls.length === 0) {
      errors.push(`${formData.contentType} requires at least 1 image`);
    }
    // Remove the requirement for exact multiples - allow partial sets
  }

  if (formData.contentType === CONTENT_TYPES.VIDEO) {
    if (formData.videoUrls.length === 0) {
      errors.push("Video content requires at least 1 video file");
    }
  }

  if (formData.startTime && formData.endTime) {
    const startDate = new Date(formData.startTime);
    const endDate = new Date(formData.endTime);

    if (startDate >= endDate) {
      errors.push("Start time must be before end time");
    }
  }

  return errors;
};

export const createAuthHeaders = (user) => {
  return {
    "Content-Type": "application/json",
    Authorization: `Basic ${btoa(`${user.username}:${user.password}`)}`,
  };
};

export const formatScheduleDate = (dateString) => {
  if (!dateString) return "No time limit";
  return new Date(dateString).toLocaleString();
};

export const isScheduleActive = (schedule) => {
  if (!schedule.active) return false;

  const now = new Date();
  const hasTimeConstraints = schedule.startTime && schedule.endTime;

  if (!hasTimeConstraints) {
    return true; // Show if active and no time constraints
  }

  const startTime = new Date(schedule.startTime);
  const endTime = new Date(schedule.endTime);
  return now >= startTime && now <= endTime;
};

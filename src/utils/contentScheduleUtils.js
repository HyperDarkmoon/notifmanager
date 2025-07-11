// ContentSchedule utility functions and constants

export const CONTENT_TYPES = {
  TEXT: 'TEXT',
  IMAGE_SINGLE: 'IMAGE_SINGLE',
  IMAGE_DUAL: 'IMAGE_DUAL',
  IMAGE_QUAD: 'IMAGE_QUAD',
  EMBED: 'EMBED'
};

export const TV_ENUM = {
  TV1: 'TV1',
  TV2: 'TV2',
  TV3: 'TV3',
  TV4: 'TV4'
};

export const getMaxFilesForContentType = (contentType) => {
  switch (contentType) {
    case CONTENT_TYPES.IMAGE_SINGLE: return 1;
    case CONTENT_TYPES.IMAGE_DUAL: return 2;
    case CONTENT_TYPES.IMAGE_QUAD: return 4;
    default: return 0;
  }
};

export const validateSchedule = (formData) => {
  const errors = [];
  
  if (!formData.title.trim()) {
    errors.push('Title is required');
  }
  
  if (formData.targetTVs.length === 0) {
    errors.push('At least one TV must be selected');
  }
  
  if (formData.contentType === CONTENT_TYPES.TEXT && !formData.content.trim()) {
    errors.push('Text content is required');
  }
  
  if (formData.contentType === CONTENT_TYPES.EMBED && !formData.content.trim()) {
    errors.push('Embed content is required');
  }
  
  if (formData.contentType.startsWith('IMAGE_')) {
    const requiredImages = getMaxFilesForContentType(formData.contentType);
    if (formData.imageUrls.length !== requiredImages) {
      errors.push(`${formData.contentType} requires exactly ${requiredImages} image(s)`);
    }
  }
  
  if (formData.startTime && formData.endTime) {
    const startDate = new Date(formData.startTime);
    const endDate = new Date(formData.endTime);
    
    if (startDate >= endDate) {
      errors.push('Start time must be before end time');
    }
  }
  
  return errors;
};

export const createAuthHeaders = (user) => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${btoa(`${user.username}:${user.password}`)}`
  };
};

export const formatScheduleDate = (dateString) => {
  if (!dateString) return 'No time limit';
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

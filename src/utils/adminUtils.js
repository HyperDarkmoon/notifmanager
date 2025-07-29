// Admin Panel Utility Functions

// Get current date and time in datetime-local format
export const getCurrentDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Get current time in HH:MM format for daily schedules
export const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

// Convert daily schedule time (HH:MM) to datetime for next occurrence
export const convertDailyTimeToDateTime = (timeString) => {
  const now = new Date();
  const [hours, minutes] = timeString.split(':');
  
  // Create a date for today with the specified time
  const scheduledDate = new Date();
  scheduledDate.setHours(parseInt(hours, 10));
  scheduledDate.setMinutes(parseInt(minutes, 10));
  scheduledDate.setSeconds(0);
  scheduledDate.setMilliseconds(0);
  
  // If the scheduled time for today has already passed, use tomorrow instead
  if (scheduledDate <= now) {
    scheduledDate.setDate(scheduledDate.getDate() + 1);
  }
  
  const year = scheduledDate.getFullYear();
  const month = String(scheduledDate.getMonth() + 1).padStart(2, "0");
  const day = String(scheduledDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Extract time (HH:MM) from datetime string
export const extractTimeFromDateTime = (dateTimeString) => {
  if (!dateTimeString) return "";
  const date = new Date(dateTimeString);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

// Get initial form data for content schedules
export const getInitialFormData = () => ({
  title: "",
  description: "",
  contentType: "TEXT",
  content: "",
  imageUrls: [],
  videoUrls: [],
  startTime: getCurrentDateTime(),
  endTime: getCurrentDateTime(),
  targetTVs: [],
  active: true,
  timeSchedules: [],
  isImmediate: true,
  // Daily schedule fields
  isDailySchedule: false,
  dailyStartTime: getCurrentTime(),
  dailyEndTime: getCurrentTime(),
});

// Get initial form data for TV profiles
export const getInitialProfileFormData = () => ({
  name: "",
  description: "",
  isImmediate: true,
  timeSchedules: [],
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

// Utility function to truncate filename while preserving extension
export const truncateFileName = (fileName, maxLength = 30) => {
  if (fileName.length <= maxLength) return fileName;
  
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) {
    // No extension, just truncate
    return fileName.substring(0, maxLength - 3) + '...';
  }
  
  const name = fileName.substring(0, lastDotIndex);
  const extension = fileName.substring(lastDotIndex);
  const availableLength = maxLength - extension.length - 3; // 3 for "..."
  
  if (availableLength <= 0) {
    return '...' + extension;
  }
  
  return name.substring(0, availableLength) + '...' + extension;
};

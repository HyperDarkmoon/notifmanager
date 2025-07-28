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
});

// Get initial form data for TV profiles
export const getInitialProfileFormData = () => ({
  name: "",
  description: "",
  isImmediate: true,
  timeSchedules: [],
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

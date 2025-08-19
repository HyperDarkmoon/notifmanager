// TV and Content Type Constants for Admin Panel
// Note: TV_OPTIONS is now deprecated - use useTVData hook for dynamic TV management
export const TV_OPTIONS = [];

export const CONTENT_TYPES = [
  { value: "TEXT", label: "Text Content", icon: "📝" },
  { value: "IMAGE_SINGLE", label: "Single Image", icon: "🖼️" },
  { value: "IMAGE_DUAL", label: "Dual Images", icon: "🖼️🖼️" },
  { value: "IMAGE_QUAD", label: "Quad Images", icon: "🖼️🖼️\n🖼️🖼️" },
  { value: "VIDEO", label: "Video Content", icon: "🎥" },
  { value: "EMBED", label: "Embed Content", icon: "🌐" },
];

// File size limits - Keep these conservative to avoid JSON size limits
export const MAX_BASE64_SIZE_IMAGES = 1 * 1024 * 1024; // 1MB - smaller to avoid JSON issues
export const MAX_BASE64_SIZE_VIDEOS = 0; // 0MB - Force all videos to upload to server to avoid database packet issues
export const MAX_FALLBACK_SIZE = 10 * 1024 * 1024; // 10MB - maximum for base64 fallback

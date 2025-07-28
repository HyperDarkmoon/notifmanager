// TV and Content Type Constants for Admin Panel
export const TV_OPTIONS = [
  { value: "TV1", label: "TV 1", icon: "📺" },
  { value: "TV2", label: "TV 2", icon: "📺" },
  { value: "TV3", label: "TV 3", icon: "📺" },
  { value: "TV4", label: "TV 4", icon: "📺" },
];

export const CONTENT_TYPES = [
  { value: "TEXT", label: "Text Content", icon: "📝" },
  { value: "IMAGE_SINGLE", label: "Single Image", icon: "🖼️" },
  { value: "IMAGE_DUAL", label: "Dual Images", icon: "🖼️🖼️" },
  { value: "IMAGE_QUAD", label: "Quad Images", icon: "🖼️🖼️\n🖼️🖼️" },
  { value: "VIDEO", label: "Video Content", icon: "🎥" },
  { value: "EMBED", label: "Embed Content", icon: "🌐" },
];

// File size limits
export const MAX_BASE64_SIZE_IMAGES = 2 * 1024 * 1024; // 2MB
export const MAX_BASE64_SIZE_VIDEOS = 10 * 1024 * 1024; // 10MB
export const MAX_FALLBACK_SIZE = 10 * 1024 * 1024; // 10MB

import {
  IMAGE_UPLOAD_MIME_TYPE_SET,
  MAX_IMAGE_UPLOAD_BYTES,
} from "./settings.constants";

export const getImageValidationError = (file: File): string | null => {
  if (!IMAGE_UPLOAD_MIME_TYPE_SET.has(file.type)) {
    return "Unsupported file type. Use JPEG, PNG, or WebP.";
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return "File too large. Max 10MB.";
  }

  return null;
};

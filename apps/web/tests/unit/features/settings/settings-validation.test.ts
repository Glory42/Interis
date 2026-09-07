import { describe, expect, it } from "vitest";
import { getImageValidationError } from "@/features/settings/model/settings.validation";
import { MAX_IMAGE_UPLOAD_BYTES } from "@/features/settings/model/settings.constants";

const fileOfType = (type: string, size = 1024): File => {
  const file = new File(["x"], "avatar", { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
};

describe("getImageValidationError", () => {
  it("accepts JPEG, PNG, and WebP under the size cap", () => {
    expect(getImageValidationError(fileOfType("image/jpeg"))).toBeNull();
    expect(getImageValidationError(fileOfType("image/png"))).toBeNull();
    expect(getImageValidationError(fileOfType("image/webp"))).toBeNull();
  });

  it("rejects an unsupported MIME type", () => {
    expect(getImageValidationError(fileOfType("image/gif"))).toBe(
      "Unsupported file type. Use JPEG, PNG, or WebP.",
    );
  });

  it("rejects a file above the size cap", () => {
    expect(getImageValidationError(fileOfType("image/png", MAX_IMAGE_UPLOAD_BYTES + 1))).toBe(
      "File too large. Max 10MB.",
    );
  });

  it("accepts a file exactly at the size cap", () => {
    expect(getImageValidationError(fileOfType("image/png", MAX_IMAGE_UPLOAD_BYTES))).toBeNull();
  });

  it("checks MIME type before size", () => {
    expect(
      getImageValidationError(fileOfType("application/pdf", MAX_IMAGE_UPLOAD_BYTES + 1)),
    ).toMatch(/Unsupported file type/);
  });
});

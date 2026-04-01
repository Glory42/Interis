import { useRef, useState, type ChangeEvent, type RefObject } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { profileKeys } from "@/features/profile/hooks/useProfile";
import {
  confirmProfileImageUpload,
  requestProfileImageUpload,
  uploadImageToSignedUrl,
  type ProfileUploadContentType,
  type ProfileUploadType,
} from "@/features/uploads/api";
import { isApiError } from "@/lib/api-client";
import { IMAGE_UPLOAD_MIME_TYPES } from "@/features/settings/model/settings.constants";
import { getImageValidationError } from "@/features/settings/model/settings.validation";
import type { MeProfile } from "@/types/api";

type UseProfileImageUploadResult = {
  avatarInputRef: RefObject<HTMLInputElement | null>;
  backdropInputRef: RefObject<HTMLInputElement | null>;
  acceptValue: string;
  isAvatarUploading: boolean;
  avatarUploadError: string | null;
  avatarUploadSuccess: string | null;
  isBackdropUploading: boolean;
  backdropUploadError: string | null;
  backdropUploadSuccess: string | null;
  openAvatarPicker: () => void;
  openBackdropPicker: () => void;
  handleAvatarFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleBackdropFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export const useProfileImageUpload = (
  user: MeProfile | null,
): UseProfileImageUploadResult => {
  const queryClient = useQueryClient();

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const backdropInputRef = useRef<HTMLInputElement | null>(null);

  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(
    null,
  );
  const [avatarUploadSuccess, setAvatarUploadSuccess] = useState<string | null>(
    null,
  );

  const [isBackdropUploading, setIsBackdropUploading] = useState(false);
  const [backdropUploadError, setBackdropUploadError] = useState<string | null>(
    null,
  );
  const [backdropUploadSuccess, setBackdropUploadSuccess] = useState<
    string | null
  >(null);

  const runProfileImageUpload = async (uploadType: ProfileUploadType, file: File) => {
    if (!user) {
      return;
    }

    const contentType = file.type as ProfileUploadContentType;

    if (uploadType === "avatar") {
      setAvatarUploadError(null);
      setAvatarUploadSuccess(null);
      setIsAvatarUploading(true);
    } else {
      setBackdropUploadError(null);
      setBackdropUploadSuccess(null);
      setIsBackdropUploading(true);
    }

    try {
      const { signedUrl, publicUrl } = await requestProfileImageUpload({
        uploadType,
        contentType,
        fileSizeBytes: file.size,
      });

      await uploadImageToSignedUrl({
        signedUrl,
        file,
        contentType,
      });

      await confirmProfileImageUpload({
        uploadType,
        publicUrl,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: authKeys.me }),
        queryClient.invalidateQueries({ queryKey: profileKeys.me }),
        queryClient.invalidateQueries({
          queryKey: profileKeys.detail(user.username),
        }),
      ]);

      if (uploadType === "avatar") {
        setAvatarUploadSuccess("Avatar image uploaded.");
      } else {
        setBackdropUploadSuccess("Backdrop image uploaded.");
      }
    } catch (error) {
      const message = isApiError(error)
        ? error.message
        : "Could not upload image right now.";

      if (uploadType === "avatar") {
        setAvatarUploadError(message);
      } else {
        setBackdropUploadError(message);
      }
    } finally {
      if (uploadType === "avatar") {
        setIsAvatarUploading(false);
      } else {
        setIsBackdropUploading(false);
      }
    }
  };

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const validationError = getImageValidationError(file);
    if (validationError) {
      setAvatarUploadError(validationError);
      setAvatarUploadSuccess(null);
      input.value = "";
      return;
    }

    void runProfileImageUpload("avatar", file);
    input.value = "";
  };

  const handleBackdropFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const validationError = getImageValidationError(file);
    if (validationError) {
      setBackdropUploadError(validationError);
      setBackdropUploadSuccess(null);
      input.value = "";
      return;
    }

    void runProfileImageUpload("backdrop", file);
    input.value = "";
  };

  return {
    avatarInputRef,
    backdropInputRef,
    acceptValue: IMAGE_UPLOAD_MIME_TYPES.join(","),
    isAvatarUploading,
    avatarUploadError,
    avatarUploadSuccess,
    isBackdropUploading,
    backdropUploadError,
    backdropUploadSuccess,
    openAvatarPicker: () => avatarInputRef.current?.click(),
    openBackdropPicker: () => backdropInputRef.current?.click(),
    handleAvatarFileChange,
    handleBackdropFileChange,
  };
};

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
  acceptValue: string;
  isAvatarUploading: boolean;
  avatarUploadError: string | null;
  avatarUploadSuccess: string | null;
  openAvatarPicker: () => void;
  handleAvatarFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export const useProfileImageUpload = (
  user: MeProfile | null,
): UseProfileImageUploadResult => {
  const queryClient = useQueryClient();

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(
    null,
  );
  const [avatarUploadSuccess, setAvatarUploadSuccess] = useState<string | null>(
    null,
  );

  const setCachedAvatar = (username: string, avatarUrl: string | null) => {
    queryClient.setQueryData<MeProfile | null>(authKeys.me, (current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        avatarUrl,
      };
    });

    queryClient.setQueryData<MeProfile | null>(profileKeys.me, (current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        avatarUrl,
      };
    });

    queryClient.setQueryData(profileKeys.detail(username), (current) => {
      if (!current || typeof current !== "object") {
        return current;
      }

      return {
        ...(current as Record<string, unknown>),
        avatarUrl,
      };
    });
  };

  const runProfileImageUpload = async (uploadType: ProfileUploadType, file: File) => {
    if (!user) {
      return;
    }

    const contentType = file.type as ProfileUploadContentType;
    const previewAvatarUrl = URL.createObjectURL(file);

    const previousAuthProfile = queryClient.getQueryData<MeProfile | null>(authKeys.me);
    const previousMeProfile = queryClient.getQueryData<MeProfile | null>(profileKeys.me);
    const previousUserProfile = queryClient.getQueryData(profileKeys.detail(user.username));

    setCachedAvatar(user.username, previewAvatarUrl);

    setAvatarUploadError(null);
    setAvatarUploadSuccess(null);
    setIsAvatarUploading(true);

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

      setCachedAvatar(user.username, publicUrl);

      void Promise.all([
        queryClient.invalidateQueries({ queryKey: authKeys.me }),
        queryClient.invalidateQueries({ queryKey: profileKeys.me }),
        queryClient.invalidateQueries({
          queryKey: profileKeys.detail(user.username),
        }),
      ]).catch(() => undefined);

      setAvatarUploadSuccess("Avatar image uploaded.");
    } catch (error) {
      queryClient.setQueryData(authKeys.me, previousAuthProfile);
      queryClient.setQueryData(profileKeys.me, previousMeProfile);
      queryClient.setQueryData(profileKeys.detail(user.username), previousUserProfile);

      const message = isApiError(error)
        ? error.message
        : "Could not upload image right now.";

      setAvatarUploadError(message);
    } finally {
      URL.revokeObjectURL(previewAvatarUrl);
      setIsAvatarUploading(false);
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

  return {
    avatarInputRef,
    acceptValue: IMAGE_UPLOAD_MIME_TYPES.join(","),
    isAvatarUploading,
    avatarUploadError,
    avatarUploadSuccess,
    openAvatarPicker: () => avatarInputRef.current?.click(),
    handleAvatarFileChange,
  };
};

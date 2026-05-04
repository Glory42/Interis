import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PostActivityDialogActions } from "@/features/feed/components/post-activity-dialog/PostActivityDialogActions";
import { PostActivityDialogAuthorRow } from "@/features/feed/components/post-activity-dialog/PostActivityDialogAuthorRow";
import { PostActivityDialogCommentComposer } from "@/features/feed/components/post-activity-dialog/PostActivityDialogCommentComposer";
import { PostActivityDialogCommentsList } from "@/features/feed/components/post-activity-dialog/PostActivityDialogCommentsList";
import { PostActivityDialogContentEditor } from "@/features/feed/components/post-activity-dialog/PostActivityDialogContentEditor";
import { PostActivityDialogHeader } from "@/features/feed/components/post-activity-dialog/PostActivityDialogHeader";
import type { FeedItem } from "@/features/feed/types";
import {
  useAddPostComment,
  useLikePost,
  usePostComments,
  usePostDetail,
  useUnlikePost,
  useUpdatePost,
} from "@/features/posts/hooks/usePosts";

type PostActivityDialogProps = {
  item: FeedItem;
  isOpen: boolean;
  mode: "view" | "edit";
  onClose: () => void;
};

export const PostActivityDialog = ({
  item,
  isOpen,
  mode,
  onClose,
}: PostActivityDialogProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const postId = item.post?.id ?? item.metadata.postId ?? null;
  const isOwnPost = Boolean(user && user.id === item.actor.id);

  const postDetailQuery = usePostDetail(postId ?? "", Boolean(isOpen && postId));
  const postCommentsQuery = usePostComments(postId ?? "", Boolean(isOpen && postId));

  const addCommentMutation = useAddPostComment(postId ?? "");
  const likePostMutation = useLikePost(postId ?? "");
  const unlikePostMutation = useUnlikePost(postId ?? "");
  const updatePostMutation = useUpdatePost(postId ?? "");

  const [commentDraft, setCommentDraft] = useState("");
  const [editDraft, setEditDraft] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(mode === "edit" && isOwnPost);

  const content = postDetailQuery.data?.content ?? item.post?.content ?? item.metadata.excerpt ?? "";
  const currentEditDraft = editDraft ?? content;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  const actorAvatar = item.actor.avatarUrl ?? item.actor.image ?? null;
  const actorInitial = item.actor.username.slice(0, 1).toUpperCase();
  const actorName = item.actor.displayUsername ?? item.actor.username;
  const likeCount = postDetailQuery.data?.likeCount ?? item.engagement.likeCount;
  const commentCount = postCommentsQuery.data?.length ?? item.engagement.commentCount;
  const viewerHasLiked = item.engagement.viewerHasLiked === true;
  const isLikePending = likePostMutation.isPending || unlikePostMutation.isPending;

  const canSaveEdit =
    isOwnPost &&
    currentEditDraft.trim().length > 0 &&
    currentEditDraft.trim().length <= 250 &&
    !updatePostMutation.isPending;

  const comments = postCommentsQuery.data ?? [];
  const canSubmitComment =
    commentDraft.trim().length > 0 &&
    commentDraft.trim().length <= 1000 &&
    !addCommentMutation.isPending;

  const dialogTitle = useMemo(() => {
    if (item.movie?.title) {
      return item.movie.title;
    }

    return "Network post";
  }, [item.movie?.title]);

  const goToLogin = async () => {
    const redirectPath = `${window.location.pathname}${window.location.search}`;
    await navigate({ to: "/login", search: { redirect: redirectPath } });
  };

  const handleToggleLike = async () => {
    if (!postId || isLikePending) {
      return;
    }

    if (!user) {
      await goToLogin();
      return;
    }

    if (viewerHasLiked) {
      await unlikePostMutation.mutateAsync();
      return;
    }

    await likePostMutation.mutateAsync();
  };

  const handleSubmitComment = async () => {
    if (!postId || !canSubmitComment) {
      return;
    }

    if (!user) {
      await goToLogin();
      return;
    }

    await addCommentMutation.mutateAsync({ content: commentDraft.trim() });
    setCommentDraft("");
  };

  const handleSaveEdit = async () => {
    if (!postId || !canSaveEdit) {
      return;
    }

    await updatePostMutation.mutateAsync({ content: currentEditDraft.trim() });
    setIsEditing(false);
  };

  if (!isOpen || !postId) {
    return null;
  }

  return createPortal(
    <div className="theme-modal-overlay fixed inset-0 z-140 flex items-center justify-center bg-background/70 px-4 py-6 backdrop-blur-sm sm:py-10">
      <button
        type="button"
        aria-label="Close post dialog"
        className="absolute inset-0"
        onClick={onClose}
      />

      <section className="theme-modal-panel relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden border border-border/80 bg-card/95 p-0 animate-fade-up">
        <PostActivityDialogHeader dialogTitle={dialogTitle} onClose={onClose} />

        <div className="space-y-4 overflow-y-auto px-4 py-4">
          <PostActivityDialogAuthorRow
            actorAvatar={actorAvatar}
            actorInitial={actorInitial}
            actorName={actorName}
            actorUsername={item.actor.username}
            createdAt={item.createdAt}
          />

          <PostActivityDialogContentEditor
            isEditing={isEditing}
            content={content}
            currentEditDraft={currentEditDraft}
            canSaveEdit={canSaveEdit}
            isSaving={updatePostMutation.isPending}
            onEditDraftChange={setEditDraft}
            onEnableEditing={() => {
              if (isOwnPost) {
                setIsEditing(true);
              }
            }}
            onCancelEditing={() => {
              setEditDraft(null);
              setIsEditing(false);
            }}
            onSaveEditing={() => {
              void handleSaveEdit();
            }}
          />

          <PostActivityDialogActions
            likeCount={likeCount}
            commentCount={commentCount}
            isLikePending={isLikePending}
            viewerHasLiked={viewerHasLiked}
            isOwnPost={isOwnPost}
            isEditing={isEditing}
            onToggleLike={() => {
              void handleToggleLike();
            }}
            onToggleEditing={() => {
              setIsEditing((current) => !current);
            }}
          />

          <PostActivityDialogCommentsList
            comments={comments}
            isPending={postCommentsQuery.isPending}
            isError={postCommentsQuery.isError}
          />

          <PostActivityDialogCommentComposer
            commentDraft={commentDraft}
            canSubmitComment={canSubmitComment}
            isSubmittingComment={addCommentMutation.isPending}
            submitError={addCommentMutation.error}
            onCommentDraftChange={setCommentDraft}
            onSubmitComment={() => {
              void handleSubmitComment();
            }}
          />
        </div>
      </section>
    </div>,
    document.body,
  );
};

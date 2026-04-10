import { Heart } from "lucide-react";
import { ProfileMediaInteractionGridSection } from "@/features/profile/components/ProfileMediaInteractionGridSection";
import { useUserLikedFilms } from "@/features/profile/hooks/useProfile";

type ProfileLikedPageProps = {
  username: string;
};

export const ProfileLikedPage = ({ username }: ProfileLikedPageProps) => {
  const likedQuery = useUserLikedFilms(username);
  const items = likedQuery.data ?? [];

  return (
    <ProfileMediaInteractionGridSection
      loadingLabel="Loading liked films..."
      errorLabel="Could not load liked films."
      sectionTitle="Likes"
      interactionVerb="liked"
      emptyState={{
        icon: Heart,
        title: "No likes yet",
        description: "This profile has not liked any items yet.",
      }}
      isPending={likedQuery.isPending}
      isError={likedQuery.isError}
      items={items}
    />
  );
};

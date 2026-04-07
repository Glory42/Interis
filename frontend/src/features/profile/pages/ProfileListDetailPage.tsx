import { Layers3 } from "lucide-react";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";

type ProfileListDetailPageProps = {
  listId: string;
};

export const ProfileListDetailPage = ({ listId }: ProfileListDetailPageProps) => {
  return (
    <ProfileTabEmptyState
      icon={Layers3}
      title="List details are unavailable"
      description={`Public list detail for ${listId} is not available yet.`}
    />
  );
};

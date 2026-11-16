import { LineRowsSkeleton, LoadingRegion } from "@/components/ui/PageSkeletons";
import { Switch } from "@/components/ui/switch";
import type { PushCategory } from "@/features/push/api";
import { usePushPreferences, useUpdatePushPreferences } from "@/features/push/hooks/usePush";

const CATEGORIES: { id: PushCategory; label: string; hint: string }[] = [
  { id: "follows", label: "New followers", hint: "Someone follows you" },
  { id: "likes", label: "Likes", hint: "On your reviews, posts and activity" },
  { id: "comments", label: "Comments", hint: "On your reviews and posts" },
  { id: "moderation", label: "Moderation notices", hint: "A moderator removed something of yours" },
];

// Which notifications are pushed, on every device. The bell always shows them all.
export const PushPreferencesList = () => {
  const preferencesQuery = usePushPreferences(true);
  const updateMutation = useUpdatePushPreferences();
  const preferences = preferencesQuery.data;

  if (!preferences) {
    return preferencesQuery.isError ? (
      <p role="alert" className="body-s text-[color:var(--danger)]">Couldn't load your push settings.</p>
    ) : (
      <LoadingRegion label="Loading push settings">
        <LineRowsSkeleton count={4} withAvatar={false} />
      </LoadingRegion>
    );
  }

  return (
    <div>
      <h3 className="kicker mb-1 text-muted-foreground">Push me about</h3>
      <ul>
        {CATEGORIES.map((category) => (
          <li key={category.id} className="border-b border-[color:var(--line)] py-2">
            <Switch
              label={category.label}
              checked={preferences[category.id]}
              onCheckedChange={(checked) => updateMutation.mutate({ [category.id]: checked })}
            />
            <p className="body-s pl-9 text-muted-foreground">{category.hint}</p>
          </li>
        ))}
      </ul>
      {updateMutation.isError ? (
        <p role="alert" className="body-s mt-2 text-[color:var(--danger)]">Couldn't save that change.</p>
      ) : null}
    </div>
  );
};

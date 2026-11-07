import { Navigate, createFileRoute } from "@tanstack/react-router";
import { SettingsIndex } from "@/features/settings/components/SettingsIndex";
import { PHONE_QUERY, useMediaQuery } from "@/lib/use-media-query";

export const Route = createFileRoute("/settings/")({
  component: SettingsIndexPage,
});

// Phones get the index; desktop has the side list, so it opens Profile.
function SettingsIndexPage() {
  const isPhone = useMediaQuery(PHONE_QUERY);
  return isPhone ? <SettingsIndex /> : <Navigate to="/settings/profile" replace />;
}

import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { normalizeDiaryTag } from "@/features/diary/diary-tags";
import { ProfileDiaryPage } from "@/features/profile/pages/ProfileDiaryPage";

type DiarySearch = { tag?: string };

// ?tag= filters the diary by one Diary Tag; one that can't exist is kept so the page shows no matches.
const validateDiarySearch = (search: DiarySearch & SearchSchemaInput): DiarySearch => {
  const raw = typeof search.tag === "string" ? search.tag.trim().slice(0, 60) : "";
  return raw ? { tag: normalizeDiaryTag(raw) ?? raw } : {};
};

export const Route = createFileRoute("/profile/$username/diary")({
  validateSearch: validateDiarySearch,
  component: ProfileDiaryRoute,
});

function ProfileDiaryRoute() {
  const { username } = Route.useParams();
  const { tag } = Route.useSearch();

  return <ProfileDiaryPage username={username} tag={tag} />;
}

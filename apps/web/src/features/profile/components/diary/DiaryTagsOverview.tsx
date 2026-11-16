import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useUserDiaryTags } from "@/features/diary/hooks/useDiaryTags";
import { cn } from "@/lib/utils";

type DiaryTagsOverviewProps = {
  username: string;
  activeTag?: string;
};

const COLLAPSED_COUNT = 12;

// The user's Diary Tags with how many logs carry each; a tag filters the diary by it.
export const DiaryTagsOverview = ({ username, activeTag }: DiaryTagsOverviewProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const tags = useUserDiaryTags(username).data ?? [];
  if (tags.length === 0) return null;
  const shown = isExpanded ? tags : tags.slice(0, COLLAPSED_COUNT);

  return (
    <section aria-label="Tags" className="mb-4">
      <div className="slate mono-meta uppercase">
        <span>Tags</span>
        <span>{tags.length}</span>
      </div>
      <ul className="flex flex-wrap gap-1.5 border-b border-[color:var(--line)] py-2.5">
        {shown.map(({ tag, count }) => (
          <li key={tag}>
            <Link
              to="/profile/$username/diary"
              params={{ username }}
              search={tag === activeTag ? {} : { tag }}
              aria-current={tag === activeTag ? "true" : undefined}
              aria-label={`#${tag}, ${count} ${count === 1 ? "log" : "logs"}`}
              className={cn(
                "mono-meta inline-flex items-center gap-1.5 rounded-[3px] border px-2 py-1 transition-colors",
                tag === activeTag
                  ? "border-primary text-foreground"
                  : "border-[color:var(--line)] text-muted-foreground hover:text-foreground",
              )}
            >
              #{tag}
              <span className="tabular-nums text-[color:var(--faint)]">{count}</span>
            </Link>
          </li>
        ))}
        {tags.length > COLLAPSED_COUNT ? (
          <li>
            <button
              type="button"
              onClick={() => setIsExpanded((current) => !current)}
              className="mono-meta px-2 py-1 text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? "Fewer" : `All ${tags.length}`}
            </button>
          </li>
        ) : null}
      </ul>
    </section>
  );
};

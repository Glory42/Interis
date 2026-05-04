import { ExternalLink } from "lucide-react";
import type { PersonDetailResponse } from "@/features/people/api";
import { getPersonModuleStyles } from "@/features/people/components/styles";
import type { PersonExternalLink } from "./external-links";
import { getProfileImageUrl } from "./helpers";

type PersonDetailSidebarProps = {
  person: PersonDetailResponse["person"];
  styles: ReturnType<typeof getPersonModuleStyles>;
  externalLinks: PersonExternalLink[];
};

export const PersonDetailSidebar = ({
  person,
  styles,
  externalLinks,
}: PersonDetailSidebarProps) => {
  return (
    <aside>
      <div
        className="mb-4 aspect-2/3 overflow-hidden border"
        style={{ borderColor: styles.border }}
      >
        <img
          src={getProfileImageUrl(person.profilePath)}
          alt={`${person.name} profile`}
          className="h-full w-full object-cover"
        />
      </div>

      <div
        className="space-y-2 border p-3"
        style={{ borderColor: styles.border, background: styles.panel }}
      >
        <p
          className="font-mono text-[9px] uppercase tracking-[0.22em]"
          style={{ color: styles.faint }}
        >
          Person
        </p>
        <p className="font-mono text-xs" style={{ color: styles.text }}>
          TMDB ID: {person.tmdbPersonId}
        </p>
        {person.knownForDepartment ? (
          <p className="font-mono text-[11px]" style={{ color: styles.muted }}>
            Known for {person.knownForDepartment}
          </p>
        ) : null}
        {person.popularity !== null ? (
          <p className="font-mono text-[11px]" style={{ color: styles.muted }}>
            Popularity {person.popularity.toFixed(1)}
          </p>
        ) : null}
      </div>

      {externalLinks.length > 0 ? (
        <div
          className="mt-3 space-y-2 border p-3"
          style={{ borderColor: styles.border, background: styles.panel }}
        >
          <p
            className="font-mono text-[9px] uppercase tracking-[0.22em]"
            style={{ color: styles.faint }}
          >
            Links
          </p>
          {externalLinks.map((externalLink) => (
            <a
              key={`${person.tmdbPersonId}-${externalLink.label}`}
              href={externalLink.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-[11px]"
              style={{ color: styles.accent }}
            >
              <span>{externalLink.label}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      ) : null}
    </aside>
  );
};

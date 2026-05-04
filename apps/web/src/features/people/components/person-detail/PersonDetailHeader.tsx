import type { PersonDetailResponse } from "@/features/people/api";
import { getPersonModuleStyles } from "@/features/people/components/styles";
import { toDisplayDate } from "./helpers";

type PersonDetailHeaderProps = {
  person: PersonDetailResponse["person"];
  styles: ReturnType<typeof getPersonModuleStyles>;
};

export const PersonDetailHeader = ({ person, styles }: PersonDetailHeaderProps) => {
  return (
    <>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        {person.roleHints.map((roleHint) => (
          <span
            key={`${person.tmdbPersonId}-${roleHint}`}
            className="border px-2 py-0.5 font-mono text-[9px] uppercase"
            style={{
              borderColor: styles.border,
              color: styles.muted,
            }}
          >
            {roleHint}
          </span>
        ))}
      </div>

      <h1
        className="mb-3 font-mono text-3xl font-bold leading-tight md:text-5xl"
        style={{ color: styles.text }}
      >
        {person.name}
      </h1>

      <div
        className="mb-8 grid grid-cols-1 gap-3 border-b pb-6 sm:grid-cols-2"
        style={{ borderColor: styles.borderSoft }}
      >
        <p className="font-mono text-[11px]" style={{ color: styles.muted }}>
          <span style={{ color: styles.faint }}>Born </span>
          {toDisplayDate(person.birthday) ?? "Unknown"}
        </p>
        <p className="font-mono text-[11px]" style={{ color: styles.muted }}>
          <span style={{ color: styles.faint }}>Died </span>
          {toDisplayDate(person.deathday) ?? "-"}
        </p>
        <p className="font-mono text-[11px]" style={{ color: styles.muted }}>
          <span style={{ color: styles.faint }}>Place </span>
          {person.placeOfBirth ?? "Unknown"}
        </p>
        <p className="font-mono text-[11px]" style={{ color: styles.muted }}>
          <span style={{ color: styles.faint }}>Aliases </span>
          {person.alsoKnownAs.length > 0 ? person.alsoKnownAs.length : "-"}
        </p>
      </div>

      <p className="mb-8 text-sm leading-relaxed">
        {person.biography ?? "No biography is available from TMDB for this person."}
      </p>
    </>
  );
};

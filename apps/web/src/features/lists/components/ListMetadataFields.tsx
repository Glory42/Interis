type ListMetadataFieldsProps = {
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  isPublic: boolean;
  onIsPublicChange: (value: boolean) => void;
  isRanked: boolean;
  onIsRankedChange: (value: boolean) => void;
};

export const ListMetadataFields = ({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  isPublic,
  onIsPublicChange,
  isRanked,
  onIsRankedChange,
}: ListMetadataFieldsProps) => {
  return (
    <div className="mb-8 grid gap-6 lg:grid-cols-2">
      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value.slice(0, 100))}
            placeholder="Give your list a name..."
            className="w-full border border-border/75 bg-background/45 px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>

        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Visibility
          </p>
          <div className="flex gap-2">
            {(["Public", "Private"] as const).map((v) => {
              const active = v === "Public" ? isPublic : !isPublic;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => onIsPublicChange(v === "Public")}
                  className="flex-1 border px-2 py-2 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors"
                  style={{
                    borderColor: active
                      ? "var(--primary)"
                      : "color-mix(in srgb, var(--border) 80%, transparent)",
                    color: active
                      ? "var(--primary)"
                      : "color-mix(in srgb, var(--foreground) 50%, transparent)",
                    background: active
                      ? "color-mix(in srgb, var(--primary) 8%, transparent)"
                      : "transparent",
                  }}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Ranking
          </p>
          <div className="flex gap-2">
            {(["Ranked", "Unranked"] as const).map((v) => {
              const active = v === "Ranked" ? isRanked : !isRanked;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => onIsRankedChange(v === "Ranked")}
                  className="flex-1 border px-2 py-2 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors"
                  style={{
                    borderColor: active
                      ? "var(--primary)"
                      : "color-mix(in srgb, var(--border) 80%, transparent)",
                    color: active
                      ? "var(--primary)"
                      : "color-mix(in srgb, var(--foreground) 50%, transparent)",
                    background: active
                      ? "color-mix(in srgb, var(--primary) 8%, transparent)"
                      : "transparent",
                  }}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Description{" "}
          <span className="normal-case tracking-normal opacity-60">
            (optional)
          </span>
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value.slice(0, 500))}
          placeholder="What's this list about?"
          rows={6}
          className="w-full resize-none border border-border/75 bg-background/45 px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        <p className="mt-1 font-mono text-[10px] text-muted-foreground/60">
          {description.length}/500
        </p>
      </div>
    </div>
  );
};

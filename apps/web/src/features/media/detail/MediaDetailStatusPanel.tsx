import type { MediaModuleStyles } from "@/features/media/styles";

type MediaDetailStatusPanelProps = {
  message: string;
  moduleStyles: MediaModuleStyles;
  loading?: boolean;
};

export const MediaDetailStatusPanel = ({
  message,
  moduleStyles,
  loading = false,
}: MediaDetailStatusPanelProps) => {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      {loading ? (
        <div
          className="h-64 animate-pulse rounded-xl border"
          style={{
            borderColor: moduleStyles.border,
            background: moduleStyles.panel,
          }}
        />
      ) : (
        <div
          className="rounded-xl border p-5 font-mono text-xs"
          style={{
            borderColor: moduleStyles.border,
            background: moduleStyles.panel,
            color: moduleStyles.muted,
          }}
        >
          {message}
        </div>
      )}
    </main>
  );
};

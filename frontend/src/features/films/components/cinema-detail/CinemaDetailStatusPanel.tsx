import { CINEMA_MODULE_STYLES } from "@/features/films/components/cinema-detail/styles";

type CinemaDetailStatusPanelProps = {
  message: string;
  loading?: boolean;
};

export const CinemaDetailStatusPanel = ({
  message,
  loading = false,
}: CinemaDetailStatusPanelProps) => {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      {loading ? (
        <div
          className="h-64 animate-pulse border"
          style={{
            borderColor: CINEMA_MODULE_STYLES.border,
            background: CINEMA_MODULE_STYLES.panel,
          }}
        />
      ) : (
        <div
          className="border p-5 font-mono text-xs"
          style={{
            borderColor: CINEMA_MODULE_STYLES.border,
            background: CINEMA_MODULE_STYLES.panel,
            color: CINEMA_MODULE_STYLES.muted,
          }}
        >
          {message}
        </div>
      )}
    </main>
  );
};

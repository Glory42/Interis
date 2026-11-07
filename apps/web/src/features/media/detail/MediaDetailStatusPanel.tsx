import type { MediaModuleStyles } from "@/features/media/styles";

type MediaDetailStatusPanelProps = {
  message: string;
  moduleStyles: MediaModuleStyles;
};

// Invalid ids and failed loads; the loading state is MediaDetailSkeleton.
export const MediaDetailStatusPanel = ({ message, moduleStyles }: MediaDetailStatusPanelProps) => (
  <main className="mx-auto w-full max-w-5xl px-4 py-10">
    <div
      className="rounded-xl border p-5 font-mono text-xs"
      style={{ borderColor: moduleStyles.border, background: moduleStyles.panel, color: moduleStyles.muted }}
    >
      {message}
    </div>
  </main>
);

import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-detail/styles";

type SerialDetailTopBarProps = {
  title: string;
};

export const SerialDetailTopBar = ({ title }: SerialDetailTopBarProps) => {
  return (
    <div
      className="sticky top-12 z-20 flex items-center gap-3 border-b px-4 py-3"
      style={{
        background: "color-mix(in srgb, var(--card) 94%, var(--background) 6%)",
        borderColor: SERIAL_MODULE_STYLES.border,
        backdropFilter: "blur(12px)",
      }}
    >
      <Link
        to="/serials"
        className="flex items-center gap-1.5 font-mono text-[11px]"
        style={{ color: SERIAL_MODULE_STYLES.muted }}
        viewTransition
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Serials</span>
      </Link>

      <span
        className="font-mono text-[11px]"
        style={{ color: SERIAL_MODULE_STYLES.faint }}
      >
        /
      </span>

      <span
        className="truncate font-mono text-[11px] uppercase"
        style={{ color: SERIAL_MODULE_STYLES.accent }}
      >
        {title}
      </span>
    </div>
  );
};

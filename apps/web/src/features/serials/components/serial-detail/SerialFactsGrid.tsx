import type { SerialFactRow } from "@/features/serials/components/serial-detail/facts";
import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-detail/styles";

type SerialFactsGridProps = {
  factRows: SerialFactRow[];
};

export const SerialFactsGrid = ({ factRows }: SerialFactsGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
      {factRows.map((fact) => (
        <div
          key={fact.label}
          className="flex items-start gap-3 border-b py-3"
          style={{ borderColor: SERIAL_MODULE_STYLES.borderSoft }}
        >
          <fact.icon
            className="mt-0.5 h-3.5 w-3.5 shrink-0"
            style={{ color: SERIAL_MODULE_STYLES.accent }}
          />
          <div className="min-w-0 flex-1">
            <p
              className="mb-0.5 font-mono text-[9px] uppercase tracking-[0.22em]"
              style={{ color: SERIAL_MODULE_STYLES.faint }}
            >
              {fact.label}
            </p>
            <p
              className="font-mono text-xs"
              style={{ color: SERIAL_MODULE_STYLES.text }}
            >
              {fact.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

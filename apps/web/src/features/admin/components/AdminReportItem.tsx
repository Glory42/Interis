import { useState } from "react";
import { Ellipsis } from "lucide-react";
import { ModalShell } from "@/components/ui/ModalShell";
import { AdminReportActions } from "@/features/admin/components/AdminReportActions";
import { REPORT_TYPE_LABEL as TYPE_LABEL, type GroupedReport } from "@/features/admin/reports-api";
import { PHONE_QUERY, useMediaQuery } from "@/lib/use-media-query";

const HOUR_MS = 3_600_000;

// "1d 2h" since the item was first reported.
const ageSince = (date: Date) => {
  const hours = Math.max(0, Math.floor((Date.now() - date.getTime()) / HOUR_MS));
  return hours >= 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h` : hours > 0 ? `${hours}h` : "<1h";
};

const ReportDetails = ({ item }: { item: GroupedReport }) => (
  <>
    <p className="user-text body-s whitespace-pre-wrap text-foreground">{`“${item.contentSnapshot}”`}</p>
    <ul aria-label="Reports on this item" className="space-y-1">
      {item.reports.map((report, index) => (
        <li key={index} className="body-s text-muted-foreground">
          {`@${report.reporterUsername ?? "deleted"} · ${report.reason}${report.details ? ` “${report.details}”` : ""}`}
        </li>
      ))}
    </ul>
  </>
);

export const AdminReportItem = ({ item, isPending }: { item: GroupedReport; isPending: boolean }) => {
  const isPhone = useMediaQuery(PHONE_QUERY);
  const [isOpen, setIsOpen] = useState(false);
  const summary = `${TYPE_LABEL[item.targetType]} · ${item.contentSnapshot}`;
  const sheetTitle = `${TYPE_LABEL[item.targetType]} · ${item.reportCount} report${item.reportCount === 1 ? "" : "s"}`;

  return (
    <li className="border-b border-[color:var(--line)]">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-expanded={isPhone ? undefined : isOpen}
          onClick={() => setIsOpen((open) => !open)}
          className="grid min-w-0 flex-1 grid-cols-[2rem_1fr_auto] items-baseline gap-3 py-2.5 text-left sm:grid-cols-[2rem_1fr_9rem_10rem_4rem]"
        >
          <span className="font-mono text-sm text-foreground">{item.reportCount}</span>
          <span className="body-s min-w-0 truncate text-foreground">{summary}</span>
          <span className="body-s hidden truncate text-muted-foreground sm:block">{item.authorUsername ? `@${item.authorUsername}` : "—"}</span>
          <span className="mono-meta hidden truncate uppercase text-muted-foreground sm:block">{item.reasons.join(" · ")}</span>
          <span className="mono-meta text-right text-muted-foreground">{ageSince(item.oldestReportAt)}</span>
        </button>
        {isPhone ? (
          <button type="button" aria-label={`Actions for ${summary}`} onClick={() => setIsOpen(true)} className="shrink-0 p-2 text-muted-foreground">
            <Ellipsis aria-hidden className="size-4" />
          </button>
        ) : null}
      </div>

      {isOpen && !isPhone ? (
        <div className="space-y-3 pb-4 pl-11">
          <ReportDetails item={item} />
          {isPending ? <AdminReportActions item={item} /> : null}
        </div>
      ) : null}

      {isOpen && isPhone ? (
        <ModalShell layout="sheet" onClose={() => setIsOpen(false)} ariaCloseLabel="Close report">
          <section
            role="dialog"
            aria-modal="true"
            aria-label={sheetTitle}
            className="w-full space-y-3 overflow-y-auto rounded-t-xl border-t border-[color:var(--line)] bg-card p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] animate-fade-up"
          >
            <h2 className="kicker text-muted-foreground">{sheetTitle}</h2>
            <ReportDetails item={item} />
            {item.authorUsername ? <p className="body-s text-muted-foreground">{`by @${item.authorUsername}`}</p> : null}
            {isPending ? <AdminReportActions item={item} stacked onDone={() => setIsOpen(false)} /> : null}
          </section>
        </ModalShell>
      ) : null}
    </li>
  );
};

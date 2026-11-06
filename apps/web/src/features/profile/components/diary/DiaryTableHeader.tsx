import { cn } from "@/lib/utils";
import { diaryGridColumns } from "./diary-model";

export const DiaryTableHeader = ({ isOwner = false }: { isOwner?: boolean }) => {
  return (
    <div
      className={cn("hidden items-center gap-3 border-b px-2 pb-2 md:grid", diaryGridColumns(isOwner))}
      style={{ borderColor: "var(--shell-border)" }}
    >
      <p className="font-mono text-[9px] uppercase tracking-widest shell-muted">Month</p>
      <p className="font-mono text-[9px] uppercase tracking-widest shell-muted">Day</p>
      <p className="font-mono text-[9px] uppercase tracking-widest shell-muted"></p>
      <p className="font-mono text-[9px] uppercase tracking-widest shell-muted">Entry</p>
      <p className="font-mono text-[9px] uppercase tracking-widest shell-muted">Released</p>
      <p className="font-mono text-[9px] uppercase tracking-widest shell-muted">Rating</p>
      <p className="text-center font-mono text-[9px] uppercase tracking-widest shell-muted">
        Like
      </p>
      <p className="text-center font-mono text-[9px] uppercase tracking-widest shell-muted">
        Rew.
      </p>
      <p className="text-center font-mono text-[9px] uppercase tracking-widest shell-muted">
        Rev.
      </p>
      {isOwner ? <span /> : null}
    </div>
  );
};

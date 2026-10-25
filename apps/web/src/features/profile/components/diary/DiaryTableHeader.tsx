import { cn } from "@/lib/utils";
import { diaryGridColumns } from "./diary-model";

export const DiaryTableHeader = ({ isOwner = false }: { isOwner?: boolean }) => {
  return (
    <div
      className={cn("hidden items-center gap-3 border-b px-2 pb-2 md:grid", diaryGridColumns(isOwner))}
      style={{ borderColor: "var(--profile-shell-border)" }}
    >
      <p className="font-mono text-[9px] uppercase tracking-widest profile-shell-muted">Month</p>
      <p className="font-mono text-[9px] uppercase tracking-widest profile-shell-muted">Day</p>
      <p className="font-mono text-[9px] uppercase tracking-widest profile-shell-muted"></p>
      <p className="font-mono text-[9px] uppercase tracking-widest profile-shell-muted">Entry</p>
      <p className="font-mono text-[9px] uppercase tracking-widest profile-shell-muted">Released</p>
      <p className="font-mono text-[9px] uppercase tracking-widest profile-shell-muted">Rating</p>
      <p className="text-center font-mono text-[9px] uppercase tracking-widest profile-shell-muted">
        Like
      </p>
      <p className="text-center font-mono text-[9px] uppercase tracking-widest profile-shell-muted">
        Rew.
      </p>
      <p className="text-center font-mono text-[9px] uppercase tracking-widest profile-shell-muted">
        Rev.
      </p>
      {isOwner ? <span /> : null}
    </div>
  );
};

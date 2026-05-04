export const DiaryTableHeader = () => {
  return (
    <div
      className="hidden items-center gap-3 border-b px-2 pb-2 md:grid md:grid-cols-[80px_48px_56px_1fr_80px_120px_32px_32px_32px]"
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
    </div>
  );
};

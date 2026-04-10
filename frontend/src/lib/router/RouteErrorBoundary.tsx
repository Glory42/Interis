import type { ErrorComponentProps } from "@tanstack/react-router";

type RouteErrorBoundaryProps = ErrorComponentProps & {
  title?: string;
};

export const RouteErrorBoundary = ({
  error,
  reset,
  title = "Something went wrong",
}: RouteErrorBoundaryProps) => {
  const message = error instanceof Error ? error.message : "Unexpected route error.";

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-4 py-10">
      <div className="w-full border border-border/70 bg-card/40 p-6">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Route Error
        </p>
        <h1 className="mb-2 text-xl font-semibold text-foreground">{title}</h1>
        <p className="mb-5 text-sm text-muted-foreground">{message}</p>
        <button
          type="button"
          onClick={() => {
            reset();
          }}
          className="border border-border/70 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-secondary/40"
        >
          Retry
        </button>
      </div>
    </div>
  );
};

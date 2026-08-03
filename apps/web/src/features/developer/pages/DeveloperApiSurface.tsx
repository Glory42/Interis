import { Badge } from "@/components/ui/badge";
import { publicSurface } from "./developer-content";

export const DeveloperApiSurface = () => (
  <section id="api-surface" className="mb-12 scroll-mt-6">
    <h2 className="mb-1 text-lg font-semibold tracking-tight text-foreground">
      Public API surface
    </h2>
    <p className="mb-5 text-sm developer-shell-muted">
      Response size depends on user data. Empty collections return{" "}
      <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
        []
      </code>
      .
    </p>

    <div className="overflow-hidden rounded-2xl border developer-shell-border developer-shell-panel">
      {publicSurface.map((endpoint) => (
        <div
          key={endpoint.path}
          className="flex flex-col gap-2 border-b border-border/40 px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-4"
        >
          <div className="flex shrink-0 items-center gap-2 sm:w-[28rem]">
            <Badge variant="muted" className="shrink-0 font-mono">
              {endpoint.method}
            </Badge>
            <code className="whitespace-nowrap font-mono text-xs text-primary">
              {endpoint.path}
            </code>
          </div>
          <p className="text-xs leading-relaxed developer-shell-muted sm:flex-1">
            {endpoint.description}
          </p>
        </div>
      ))}
    </div>
  </section>
);

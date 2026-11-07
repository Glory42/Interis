import { DOCS_URL, PUBLIC_ENDPOINTS, publicApiBase } from "./developer-content";
import { DeveloperTryIt } from "./DeveloperTryIt";

const TERMS = "GET only · No key · 60 req/min/IP · Cached 5 min";

export const DeveloperPage = () => {
  const base = `${publicApiBase()}/:username`;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="overflow-hidden rounded-[3px] border border-[color:var(--line)]">
        <div className="slate mono-meta flex-wrap gap-x-3 uppercase">
          <span>Interis · Public API</span>
          <span>{TERMS}</span>
        </div>

        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-2">
          <div>
            <h1 className="display-2 leading-tight text-foreground">Your diary, on your own site.</h1>
            <p className="body mt-2 text-muted-foreground">Every public profile can be read as JSON. No key, no sign-up, open CORS.</p>

            <div className="mt-5 flex items-center gap-2 rounded-[3px] border border-[color:var(--line)] px-3 py-2">
              <span className="mono-meta uppercase text-muted-foreground">Base</span>
              <code className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">{base}</code>
              <button type="button" onClick={() => void navigator.clipboard?.writeText(base)} className="mono-meta uppercase text-primary hover:underline">
                ⧉ Copy
              </button>
            </div>

            <h2 className="kicker mt-6 flex justify-between text-muted-foreground">
              <span>{`Endpoints · ${PUBLIC_ENDPOINTS.length}`}</span>
              <span>Default / max limit</span>
            </h2>
            <ul aria-label="Endpoints" className="mt-2 font-mono text-xs">
              {PUBLIC_ENDPOINTS.map((endpoint) => (
                <li key={endpoint.path} title={endpoint.description} className="flex items-baseline gap-2 py-1">
                  <span className="text-foreground">{endpoint.path}</span>
                  <span aria-hidden className="min-w-3 flex-1 -translate-y-1 border-b border-dotted border-[color:var(--line-strong)]" />
                  <span className="text-muted-foreground">{endpoint.limits ?? "—"}</span>
                </li>
              ))}
            </ul>
            <a href={DOCS_URL} target="_blank" rel="noreferrer" className="body-s mt-4 inline-block text-primary hover:underline">
              Full docs ↗
            </a>
          </div>

          <DeveloperTryIt />
        </div>

        <p className="mono-meta mt-10 border-t border-[color:var(--line)] pt-4 text-muted-foreground">
          {"Film and TV data from "}
          <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-foreground hover:underline">
            TMDB
          </a>
          {". "}
          <span>This product uses the TMDB API but is not endorsed or certified by TMDB.</span>
        </p>
      </div>
    </div>
  );
};

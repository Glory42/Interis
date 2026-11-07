import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { SentenceSelect } from "@/components/ui/SentenceSelect";
import { apiRequest } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { TRY_ENDPOINTS, buildSnippet, publicApiBase, type SnippetKind, type TryEndpoint } from "./developer-content";

const ENDPOINT_OPTIONS = [
  { value: "diary", word: "recently watched", label: "Recently watched" },
  { value: "currently-watching", word: "currently watching", label: "Currently watching" },
] as const;

const KINDS: SnippetKind[] = ["fetch", "curl", "html"];
const inlineInput = "border-b border-dashed border-[color:var(--primary)] bg-transparent px-0.5 text-foreground outline-none";

// The sentence drives the snippet and the preview together; the preview runs only when asked.
export const DeveloperTryIt = () => {
  const [username, setUsername] = useState("glory42");
  const [endpoint, setEndpoint] = useState<TryEndpoint>("diary");
  const [entries, setEntries] = useState("4");
  const [kind, setKind] = useState<SnippetKind>("fetch");

  const option = TRY_ENDPOINTS[endpoint];
  const limit = Math.min(Math.max(Number.parseInt(entries, 10) || 1, 1), option.max);
  const name = username.trim() || ":username";
  const path = `/${encodeURIComponent(name)}/${option.path}?limit=${limit}`;
  const snippet = buildSnippet(kind, `${publicApiBase()}${path}`, endpoint);
  const preview = useMutation({ mutationFn: () => apiRequest<unknown>(`/api/public${path}`) });

  return (
    <section aria-labelledby="try-it">
      <h2 id="try-it" className="kicker text-muted-foreground">Try it</h2>
      <p className="body mt-2 text-foreground">
        {"Show "}
        <input aria-label="Username" value={username} onChange={(event) => setUsername(event.target.value)} size={Math.max(name.length, 6)} className={inlineInput} />
        {"'s "}
        <SentenceSelect value={endpoint} options={ENDPOINT_OPTIONS} onChange={setEndpoint} />
        {", "}
        <input aria-label="Entries" inputMode="numeric" value={entries} onChange={(event) => setEntries(event.target.value)} size={2} className={inlineInput} />
        {" entries."}
      </p>

      <div className="mt-3 overflow-hidden rounded-[3px] border border-[color:var(--line)]">
        <div className="slate mono-meta uppercase">
          <span role="tablist" aria-label="Snippet" className="flex gap-3">
            {KINDS.map((candidate) => (
              <button
                key={candidate}
                type="button"
                role="tab"
                aria-selected={kind === candidate}
                onClick={() => setKind(candidate)}
                className={cn(kind === candidate ? "text-white" : "hover:text-white")}
              >
                {candidate}
              </button>
            ))}
          </span>
          <button type="button" onClick={() => void navigator.clipboard?.writeText(snippet)} className="hover:text-white">
            ⧉ Copy
          </button>
        </div>
        <pre data-testid="snippet" className="overflow-x-auto p-3 font-mono text-xs leading-relaxed text-foreground">
          {snippet}
        </pre>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Button size="md" variant="outline" disabled={preview.isPending || !username.trim()} onClick={() => preview.mutate()}>
          {preview.isPending ? "Running…" : "Run it"}
        </Button>
        {preview.isError ? <span className="body-s text-[color:var(--danger)]">That request failed. Check the username.</span> : null}
      </div>
      {preview.data !== undefined ? (
        <pre aria-label="Live preview" className="mt-3 max-h-72 overflow-auto rounded-[3px] border border-[color:var(--line)] p-3 font-mono text-xs text-muted-foreground">
          {JSON.stringify(preview.data, null, 2)}
        </pre>
      ) : null}
    </section>
  );
};

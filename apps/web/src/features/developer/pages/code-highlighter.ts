import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import wasmUrl from "shiki/onig.wasm?url";
import javascript from "@shikijs/langs/javascript";
import bash from "@shikijs/langs/bash";
import tsx from "@shikijs/langs/tsx";
import dracula from "@shikijs/themes/dracula";

const SHIKI_THEME = "dracula";

const SHIKI_LANG_BY_EXAMPLE_LANGUAGE: Record<string, string> = {
  js: "javascript",
  curl: "bash",
  tsx: "tsx",
};

let highlighterPromise: Promise<HighlighterCore> | null = null;

const getHighlighter = () => {
  highlighterPromise ??= createHighlighterCore({
    themes: [dracula],
    langs: [javascript, bash, tsx],
    engine: createOnigurumaEngine(() => fetch(wasmUrl)),
  });
  return highlighterPromise;
};

export const highlightExampleCode = async (
  code: string,
  language: string,
): Promise<string> => {
  const highlighter = await getHighlighter();
  const lang = SHIKI_LANG_BY_EXAMPLE_LANGUAGE[language] ?? "javascript";
  return highlighter.codeToHtml(code, { lang, theme: SHIKI_THEME });
};

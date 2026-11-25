# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Claude Code specifics

The project guide itself lives in [`AGENTS.md`](AGENTS.md) and is imported above, so everything there applies to Claude Code too. Keep this file limited to tool-specific notes; put shared project guidance in `AGENTS.md`.

- **Skills:** read from `.claude/skills/` — `add-theme`, `codebase-audit`, `codebase-cleanup`, `commit`, `performance-check`, `refactor-hunt`. They are mirrored byte-for-byte in `.agents/skills/` for Codex; edit both copies or CI (`diff -r`) fails.
- **Search:** use the `Explore` subagent for wide, read-only searches so the main context stays small; read files directly when the scope is a handful of files.
- **Fan-out:** `codebase-audit`, `codebase-cleanup`, `refactor-hunt` and `performance-check` are written to delegate full-tree search work to subagents.
- **Permissions:** `.claude/settings.local.json` allows `bun run *` without prompting.

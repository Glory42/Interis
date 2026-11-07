# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues in `Glory42/Interis`. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..." --label "..."`. Use a heredoc (or `--body-file -`) for multi-line bodies. Mirror the issue forms in `.github/ISSUE_TEMPLATE/`: bugs get title prefix `bug: ` and label `bug` (`bug_report.yml`); feature requests get `feat: ` and label `feature` (`feature_request.yml`). Security reports go through `SECURITY.md`, not a public issue.
- **Read an issue**: `gh issue view <number> --comments`, or `gh issue view <number> --json number,title,body,labels,comments,parent,subIssues,blockedBy` for structured output.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`
- **Epics**: tracking issues carry the `epic` label and group work as GitHub sub-issues — `gh issue create --parent <epic>` or `gh issue edit <epic> --add-sub-issue <n>`.

Infer the repo from `git remote -v` — `gh` does this automatically when run inside a clone.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr` equivalents:

- **Read a PR**: `gh pr view <number> --comments` and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` then keep only `authorAssociation` of `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE` (drop `OWNER`/`MEMBER`/`COLLABORATOR`).
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either — resolve with `gh pr view 42` and fall back to `gh issue view 42`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

The `wayfinder:*` labels don't exist in the repo yet — they'd be created on first use.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. `gh issue create --label wayfinder:map`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue — `gh issue create --parent <map>` or `gh issue edit <map> --add-sub-issue <n>`. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: GitHub's **native issue dependencies** — the canonical, UI-visible representation. Add an edge with `gh issue edit <child> --add-blocked-by <blocker>` (or `gh issue create --blocked-by <n>`). Read them back with `gh issue view <n> --json blockedBy`. A ticket is unblocked when every blocker is closed.
- **Frontier query**: list the map's open children (`gh issue view <map> --json subIssues --jq '.subIssues.nodes[] | select(.state == "OPEN")'`), drop any with an open blocker (`--json blockedBy`, also a `.nodes[]` list) or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me` — the session's first write.
- **Resolve**: `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far.

# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Canonical label             | Label in our tracker | Exists in repo? | Meaning                                  |
| ---------------------------- | -------------------- | --------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | No              | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | No              | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | No              | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | No              | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Yes             | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table. Only `wontfix` exists today; the other four get created the first time they're applied (`gh issue edit --add-label` fails on a missing label, so create it with `gh label create` first).

The repo's other labels describe type, area and priority rather than triage state: `bug`, `feature`, `enhancement`, `documentation`, `duplicate`, `invalid`, `question`, `good first issue`, `help wanted`, `security`, `performance`, `refactor`, `testing`, `devops`, `accessibility`, `ux`, `epic`, `priority: critical`, `priority: high`. The issue forms apply `bug` (bug report) and `feature` (feature request) automatically. Check `gh label list --repo Glory42/Interis` for the current set.

Edit the right-hand columns to match whatever vocabulary you actually use.

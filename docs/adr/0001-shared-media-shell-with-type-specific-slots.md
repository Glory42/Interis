# Shared media shell with type-specific slots, built against existing types first

**Status:** accepted

Movie, Series, Album, and Book each have their own detail page and archive/browse page today, sharing only small atomic pieces (`MediaPosterGridItem`, `resolveFeedMovieLink`, the `--module-*` color tokens). Extending this to Track/Edition and further media types would mean building each surface a fifth and sixth time.

**Decision:** one shared shell owns the parts every media type does identically — header, action sidebar (like/want-to-consume/rate/log), the log modal, review list + rating breakdown, a generic metadata-chips row, and (on archive pages) the filter bar + grid. Genuinely different behavior — Season/Episode accordion, cast & crew, currently-watching/listening progress, a future Edition browser — stays as small components slotted into the shell, not folded into it. Verified live that `/cinema` and `/serials` are already pixel-identical in structure apart from labels and accent color, which is strong evidence the shell captures the real shared shape rather than an aspirational one.

Build the shell against the four *existing* types first, as its own milestone, before Track/Edition or new data sources exist. Designing the shell around features that don't exist yet risks over-fitting it to a guess.

**Considered Options:**
- **Fully generic engine** — one component driven entirely by a per-type descriptor object. Rejected: tends to accumulate `if (mediaType === X)` branches as each type's quirks pile up, which is the opposite of "doesn't block future improvements."
- **No shared shell** — keep separate top-level pages per type, share only atomic pieces (today's state). Rejected: doesn't fulfill "everything on the site shares the same components," and archive pages being already-identical shows most of the sharing opportunity was being left on the table.

**Consequences:** the shell's shape is a contract every current and future media type must fit through a slot mechanism — a media type whose detail page doesn't decompose into (shared facts/actions) + (a few distinct sections) would strain this model and should prompt revisiting this ADR, not silently bending the shell.

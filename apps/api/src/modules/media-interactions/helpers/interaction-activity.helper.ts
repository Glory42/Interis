import type { InteractionStateInput } from "./interaction-state-rules.helper";

export type ActivityFlag = "liked" | "watchlisted";

export const ACTIVITY_TYPE_BY_FLAG = {
  liked: "liked_movie",
  watchlisted: "watchlisted_movie",
} as const satisfies Record<ActivityFlag, string>;

type FlagState = Record<ActivityFlag, boolean>;

const FLAGS: ActivityFlag[] = ["liked", "watchlisted"];

// Only an explicit change is news. Record on `true` when it was unset and the
// write left it set; retract on `false` when it was set (#76, #79). Implied
// changes, like watching clearing the Watchlist, neither record nor retract.
export function diffInteractionActivity(
  change: Pick<InteractionStateInput, ActivityFlag>,
  previous: FlagState | null,
  current: FlagState | null,
): { record: ActivityFlag[]; retract: ActivityFlag[] } {
  const wasSet = (flag: ActivityFlag) => previous?.[flag] ?? false;
  return {
    record: FLAGS.filter(
      (flag) => change[flag] === true && !wasSet(flag) && (current?.[flag] ?? false),
    ),
    retract: FLAGS.filter((flag) => change[flag] === false && wasSet(flag)),
  };
}

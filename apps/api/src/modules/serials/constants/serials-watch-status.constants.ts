// A series' stored watch status (serial_interaction.watch_status). `null`
// means "no status": nothing watched yet, or every episode unchecked.
// `completed` is the single "watched" truth (the old is_watched column is gone, #105).
export const SERIAL_WATCH_STATUSES = ["watching", "paused", "dropped", "completed"] as const;

export type SerialWatchStatus = (typeof SERIAL_WATCH_STATUSES)[number];

// Statuses a user sets by hand from the series page. `completed` and `null`
// come from the watched toggle / log / episode progress instead.
export const USER_SET_WATCH_STATUSES = ["watching", "paused", "dropped"] as const;

export type UserSetWatchStatus = (typeof USER_SET_WATCH_STATUSES)[number];

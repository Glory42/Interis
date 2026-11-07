// A suspension holds until it's lifted or its end time passes; an ended one is
// simply ignored, so no request ever writes to clear it.
export const isSuspensionInEffect = (
  flags: { isSuspended: boolean; suspendedUntil: Date | null },
  now: Date = new Date(),
): boolean => flags.isSuspended && (flags.suspendedUntil === null || flags.suspendedUntil > now);

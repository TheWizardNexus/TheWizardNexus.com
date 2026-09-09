export const CONTACT_INTERVAL_MS = 15 * 60 * 1000;
export const CONTACT_DAY_MS = 24 * 60 * 60 * 1000;
export const CONTACT_DAILY_LIMIT = 3;

// A request with an unknown delivery outcome still occupies its reserved slot.
export function contactAllowance(entries, now = Date.now()) {
    const counted = entries.filter(
        function occupiesContactSlot(entry) {
            return entry.status !== 'rejected';
        }
    );
    const recent = counted.map(
        function contactTime(entry) {
            return entry.acceptedAt || entry.settledAt || entry.submittedAt;
        }
    ).filter(
        function withinContactDay(time) {
            return time > now - CONTACT_DAY_MS;
        }
    ).sort(
        function chronological(left, right) {
            return left - right;
        }
    );
    const last = recent.at(-1);
    const intervalEnd = last === undefined ? 0 : last + CONTACT_INTERVAL_MS;
    const dayEnd = recent.length >= CONTACT_DAILY_LIMIT
        ? recent[recent.length - CONTACT_DAILY_LIMIT] + CONTACT_DAY_MS
        : 0;
    const nextAllowedAt = Math.max(intervalEnd, dayEnd);
    const accepted = entries.filter(
        function acceptedContact(entry) {
            return entry.status === 'accepted';
        }
    );

    return {
        allowed: now >= nextAllowedAt,
        remaining: Math.max(0, CONTACT_DAILY_LIMIT - recent.length),
        acceptedTotal: accepted.length,
        acceptedToday: accepted.filter(
            function acceptedWithinContactDay(entry) {
                return entry.acceptedAt > now - CONTACT_DAY_MS;
            }
        ).length,
        reservedToday: recent.length,
        nextAllowedAt
    };
}

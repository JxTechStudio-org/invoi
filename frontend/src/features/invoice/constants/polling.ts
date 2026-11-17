// D14: poll every 5 s while an invoice is processing, give up after 2 minutes.
// Detail page + list page together stay at 24 requests a minute, under the 60/min limit.
export const POLL_INTERVAL_MS = 5_000
export const POLL_LIMIT_MS = 120_000

// The app is only reachable through the host's Nginx (container ports are bound to 127.0.0.1),
// so trust exactly one proxy hop: req.ip is then the address Nginx saw. `true` would trust the
// whole client-supplied X-Forwarded-For header and let callers dodge the login rate limit.
export const TRUST_PROXY_HOPS = 1;

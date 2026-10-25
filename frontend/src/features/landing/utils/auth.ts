/** True when a login token is stored (same key as services/api/client.ts). */
export function hasAuthToken(): boolean {
    try {
        return Boolean(localStorage.getItem('authToken'));
    } catch {
        return false;
    }
}

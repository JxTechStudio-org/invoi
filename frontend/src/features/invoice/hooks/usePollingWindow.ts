import { useEffect, useState } from 'react'
import { POLL_LIMIT_MS } from '../constants/polling'

/**
 * True while `active` has been true for less than POLL_LIMIT_MS. Restarts each time
 * `active` turns true again (for example after a re-extract).
 */
export function usePollingWindow(active: boolean): { withinWindow: boolean; timedOut: boolean } {
    const [timedOut, setTimedOut] = useState(false)

    useEffect(() => {
        setTimedOut(false)
        if (!active) return
        const timer = setTimeout(() => setTimedOut(true), POLL_LIMIT_MS)
        return () => clearTimeout(timer)
    }, [active])

    return { withinWindow: active && !timedOut, timedOut: active && timedOut }
}

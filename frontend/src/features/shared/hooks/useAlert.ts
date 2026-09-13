import { useState, useCallback } from 'react'

interface AlertItem {
    id: number
    message: string
    type: 'success' | 'info' | 'warning' | 'error'
}

let idCounter = 0

export function useAlert() {
    const [alerts, setAlerts] = useState<AlertItem[]>([])

    const showAlert = useCallback((message: string, type: AlertItem['type'] = 'info') => {
        const id = idCounter++;
        setAlerts((prev) => [...prev, { id, message, type }])
    }, []);

    const removeAlert = useCallback((id: number) => {
        setAlerts((prev) => prev.filter((a) => a.id !== id))
    }, []);

    return { alerts, showAlert, removeAlert };
}

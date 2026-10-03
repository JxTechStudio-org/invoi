import { createContext, useContext, useState, type ReactNode } from 'react'

export type NotificationType = 'success' | 'warning' | 'error'

export interface AppNotification {
    id: string
    message: string
    type: NotificationType
    timestamp: string
    isRead: boolean
}

interface NotificationsContextValue {
    notifications: AppNotification[]
    unreadCount: number
    addNotification: (message: string, type?: NotificationType) => void
    markAsRead: (id: string) => void
    markAllAsRead: () => void
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

export function NotificationsProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<AppNotification[]>([])

    const addNotification = (message: string, type: NotificationType = 'success') => {
        setNotifications((prev) => [
            {
                id: crypto.randomUUID(),
                message,
                type,
                timestamp: new Date().toLocaleString('ar-SA'),
                isRead: false
            },
            ...prev
        ])
    }

    const markAsRead = (id: string) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    }

    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    }

    const unreadCount = notifications.filter((n) => !n.isRead).length

    return (
        <NotificationsContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead }}>
            {children}
        </NotificationsContext.Provider>
    )
}

export function useNotifications() {
    const context = useContext(NotificationsContext)
    if (!context) {
        throw new Error('useNotifications must be used within NotificationsProvider')
    }
    return context
}

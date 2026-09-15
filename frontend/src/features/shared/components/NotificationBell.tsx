import { Badge, Popover, List, Empty, theme } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import type { GlobalToken } from 'antd/es/theme/interface'

type NotificationType = 'success' | 'warning' | 'error'

interface NotificationItem {
    id: string
    message: string
    type: NotificationType
    timestamp: string
}

interface NotificationBellProps {
    notifications: NotificationItem[]
    onNotificationClick?: (id: string) => void
}

function getDotColor(type: NotificationType, token: GlobalToken): string {
    const colorMap: Record<NotificationType, string> = {
        success: token.colorSuccess,
        warning: token.colorWarning,
        error: token.colorError
    }
    return colorMap[type]
}

export default function NotificationBell({ notifications, onNotificationClick }: NotificationBellProps) {
    const { token } = theme.useToken()

    const content = (
        <List
            style={{ width: 320, maxHeight: 360, overflowY: 'auto' }}
            dataSource={notifications}
            locale={{ emptyText: <Empty description="لا توجد إشعارات" /> }}
            renderItem={(item) => (
                <List.Item
                    style={{ cursor: 'pointer', padding: '10px 4px' }}
                    onClick={() => onNotificationClick?.(item.id)}
                >
                    <span
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: getDotColor(item.type, token),
                            marginInlineEnd: 10,
                            flexShrink: 0
                        }}
                    />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, color: token.colorText }}>{item.message}</div>
                        <div style={{ fontSize: 12, color: token.colorTextTertiary }}>{item.timestamp}</div>
                    </div>
                </List.Item>
            )}
        />
    )

    return (
        <Popover content={content} trigger="click" placement="bottomLeft">
            <Badge count={notifications.length} size="small" offset={[-2, 2]}>
                <BellOutlined style={{ fontSize: 20, cursor: 'pointer', color: token.colorTextSecondary }} />
            </Badge>
        </Popover>
    )
}

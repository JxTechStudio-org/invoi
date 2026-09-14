import { Badge, Popover, List, Empty } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import { theme } from 'antd'

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

const DOT_COLOR: Record<NotificationType, string> = {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444'
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
                            backgroundColor: DOT_COLOR[item.type],
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


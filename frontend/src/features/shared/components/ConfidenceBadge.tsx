import { Tag } from 'antd'
import { CheckCircleFilled, MinusCircleFilled, ExclamationCircleFilled } from '@ant-design/icons'

type ConfidenceLevel = 'high' | 'medium' | 'low'

interface ConfidenceBadgeProps {
    level: ConfidenceLevel
    percentage: number
}

const CONFIG: Record<ConfidenceLevel, { color: string; icon: React.ReactNode; label: string }> = {
    high: { color: 'success', icon: <CheckCircleFilled />, label: 'عالية' },
    medium: { color: 'warning', icon: <MinusCircleFilled />, label: 'متوسطة' },
    low: { color: 'error', icon: <ExclamationCircleFilled />, label: 'منخفضة' }
}

export default function ConfidenceBadge({ level, percentage }: ConfidenceBadgeProps) {
    const config = CONFIG[level]

    return (
        <Tag icon={config.icon} color={config.color} style={{ borderRadius: 9999, padding: '2px 12px' }}>
            {config.label} - {percentage}%
        </Tag>
    )
}

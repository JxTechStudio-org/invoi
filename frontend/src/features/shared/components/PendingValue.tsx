// shared/components/PendingValue.tsx
import { theme } from 'antd'

interface PendingValueProps {
    value: string | number | null | undefined
    text?: string
}

export default function PendingValue({ value , text='جاري التحميل' }: PendingValueProps) {
    const { token } = theme.useToken()

    if (value === null || value === undefined || value === '') {
        return <span style={{ color: token.colorTextTertiary, fontStyle: 'italic' }}>{text}</span>
    }

    return <>{value}</>
}

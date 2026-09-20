import { Typography} from 'antd'
interface InfoItemProps {
    icon: React.ReactNode
    iconBgColor: string
    iconColor: string
    title: string
    description: string
    token: any
}

const { Text } = Typography
export default function InfoFeatureItem({ icon, iconBgColor, iconColor, title, description, token }: InfoItemProps) {
    
    return (
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ padding: 12, borderRadius: token.borderRadius, backgroundColor: iconBgColor, color: iconColor }}>
                {icon}
            </div>
            <div>
                <Text strong style={{ display: 'block', fontSize: 13, color: token.colorTextHeading }}>{title}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{description}</Text>
            </div>
        </div>
    )
}

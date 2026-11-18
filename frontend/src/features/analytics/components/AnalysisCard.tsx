import type { ReactNode } from 'react'
import { Card, Typography, theme } from 'antd'

const { Title, Text } = Typography

interface AnalysisCardProps {
    title: string
    extra?: string
    children: ReactNode
}


export default function AnalysisCard({ title, extra, children }: AnalysisCardProps) {
    const { token } = theme.useToken()

    return (
        <Card
            style={{
                borderRadius: 24,
                border: `1px solid ${token.colorBorder}`,
                boxShadow: token.boxShadowTertiary,
                background: token.colorBgContainer
            }}
            styles={{ body: { padding: '22px 24px' } }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 4, height: 16, borderRadius: 999, backgroundColor: token.colorPrimary }} />
                    <Title level={5} style={{ margin: 0, fontWeight: 700, color: token.colorText, fontSize: 16 }}>
                        {title}
                    </Title>
                </div>
                {extra && (
                    <Text style={{ fontSize: 11, fontWeight: 600, color: token.colorTextSecondary }}>{extra}</Text>
                )}
            </div>
            {children}
        </Card>
    )
}
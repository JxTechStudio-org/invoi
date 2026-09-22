import { Card, theme, Typography } from 'antd'
import type { TopVendor } from '../components/dashboardCalculations'

const { Title, Text } = Typography

interface TopVendorsListProps {
    data: TopVendor[]
    loading?: boolean
}

export default function TopVendorsList({ data, loading }: TopVendorsListProps) {
    const { token } = theme.useToken()
    const maxCount = Math.max(...data.map((v) => v.invoiceCount), 1)

    return (
        <Card
            loading={loading}
            style={{ borderRadius: 12, border: `1px solid ${token.colorBorder}`, boxShadow: token.boxShadowTertiary , height:'100%' }}
        >
            <Title level={5} style={{ marginBottom: 16 }}>
                أكثر الموردين تكرارًا
            </Title>
            {data.map((vendor) => (
                <div key={vendor.name} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 14 }}>{vendor.name}</Text>
                        <Text style={{ fontSize: 14, color: token.colorTextSecondary }}>{vendor.invoiceCount}</Text>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, backgroundColor: token.colorBorderSecondary }}>
                        <div
                            style={{
                                width: `${(vendor.invoiceCount / maxCount) * 100}%`,
                                height: '100%',
                                borderRadius: 3,
                                backgroundColor: token.colorPrimary
                            }}
                        />
                    </div>
                </div>
            ))}
        </Card>
    )
}


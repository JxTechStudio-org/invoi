import { Card, theme, Typography, Space } from 'antd'
import type { TopVendor } from '../components/dashboardCalculations'

const { Title, Text } = Typography

interface TopVendorsListProps {
    data?: TopVendor[]
    loading?: boolean
}

export default function TopVendorsList({ data = [], loading }: TopVendorsListProps) {
    const { token } = theme.useToken()
    const safeData = Array.isArray(data) ? data : []
    const maxCount = Math.max(...safeData.map((v) => v.invoiceCount), 1)

    return (
        <Card
            loading={loading}
            variant="borderless"
            style={{
                borderRadius: 24,
                boxShadow: token.boxShadowTertiary,
                height: '100%',
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorder}`,
            }}
            styles={{ body: { padding: '22px 24px' } }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <Space size={8}>
                    <div
                        style={{
                            width: 4,
                            height: 16,
                            borderRadius: 999,
                            backgroundColor: token.colorPrimary,
                        }}
                    />
                    <Title level={5} style={{ margin: 0, fontWeight: 700, color: token.colorText, fontSize: 16 }}>
                        أكثر الموردين تكرارًا
                    </Title>
                </Space>
                <Text style={{ fontSize: 11, fontWeight: 600, color: token.colorTextSecondary }}>
                    الترتيب التراكمي
                </Text>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {safeData.map((vendor, index) => {
                    const percentage = (vendor.invoiceCount / maxCount) * 100
                    const isTopOne = index === 0

                    return (
                        <div
                            key={vendor.name}
                            style={{
                                padding: '12px 14px',
                                borderRadius: 16,
                                backgroundColor: isTopOne ? token.colorPrimaryBg || token.colorBgLayout : token.colorBgLayout,
                                border: `1px solid ${isTopOne ? token.colorPrimary + '40' : token.colorBorder + '30'}`,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Space size={10}>
                                    <span
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: isTopOne ? token.colorPrimary : token.colorTextSecondary,
                                            backgroundColor: isTopOne ? token.colorBgContainer : 'transparent',
                                            padding: isTopOne ? '2px 6px' : '0',
                                            borderRadius: 6,
                                        }}
                                    >
                                        #{index + 1}
                                    </span>
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: token.colorText,
                                            maxWidth: '170px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                        title={vendor.name}
                                    >
                                        {vendor.name}
                                    </Text>
                                </Space>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                                    <Text style={{ fontSize: 13, fontWeight: 700, color: token.colorPrimary }}>
                                        {vendor.invoiceCount}
                                    </Text>
                                    <Text style={{ fontSize: 10, color: token.colorTextSecondary }}>فاتورة</Text>
                                </div>
                            </div>

                            <div
                                style={{
                                    height: 6,
                                    borderRadius: 999,
                                    backgroundColor: token.colorBorderSecondary,
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    style={{
                                        width: `${percentage}%`,
                                        height: '100%',
                                        borderRadius: 999,
                                        backgroundColor: token.colorPrimary,
                                        transition: 'width 0.4s ease-in-out',
                                    }}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </Card>
    )
}


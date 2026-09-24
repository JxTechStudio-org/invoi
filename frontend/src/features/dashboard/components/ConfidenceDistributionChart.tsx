
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, theme, Typography, Empty , Space   } from 'antd'
import type { ConfidenceDistribution } from './dashboardCalculations'

const { Title , Text } = Typography

interface ConfidenceDistributionChartProps {
    data?: ConfidenceDistribution
    loading?: boolean
}

export default function ConfidenceDistributionChart({ data, loading }: ConfidenceDistributionChartProps) {
    const { token } = theme.useToken()

    const chartData = [
        { name: 'ثقة عالية', value: data?.high ?? 0, color: token.colorSuccess },
        { name: 'ثقة متوسطة', value: data?.medium ?? 0, color: token.colorWarning },
        { name: 'ثقة منخفضة', value: data?.low ?? 0, color: token.colorError }
    ]

    const total = chartData.reduce((sum, item) => sum + item.value, 0)

    return (
        <Card
            loading={loading}
            style={{ borderRadius: 24, border: `1px solid ${token.colorBorder}`, boxShadow: token.boxShadowTertiary , height:'100%' }}
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
                        مستوى الثقة
                    </Title>
                </Space>
                <Text style={{ fontSize: 11, fontWeight: 600, color: token.colorTextSecondary }}>
                   توزيع مستوى الثقة
                </Text>
            </div>
            
            {total === 0 ? (
                <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Empty description="لا توجد بيانات ثقة كافية بعد" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                        <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                            {chartData.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: token.colorBgContainer,
                                border: `1px solid ${token.colorBorder}`,
                                borderRadius: 8
                            }}
                        />
                        <Legend
                            layout="horizontal"
                            align="center"
                            verticalAlign="bottom"
                            iconType="circle"
                            iconSize={10}
                            wrapperStyle={{ display: 'flex', justifyContent: 'center', gap: 20, paddingTop: 12 }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </Card>
    )
}

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, theme, Typography } from 'antd'
import type { ProcessingVolumePoint } from '../components/dashboardCalculations'

const { Title, Text } = Typography

interface ProcessingVolumeChartProps {
    data: ProcessingVolumePoint[]
    loading?: boolean
}

export default function ProcessingVolumeChart({ data, loading }: ProcessingVolumeChartProps) {
    const { token } = theme.useToken()

    return (
        <Card
            loading={loading}
            style={{ borderRadius: 24, border: `1px solid ${token.colorBorder}`, boxShadow: token.boxShadowTertiary }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                        style={{
                            width: 4,
                            height: 16,
                            borderRadius: 999,
                            backgroundColor: token.colorPrimary,
                        }}
                    />
                    <Title level={5} style={{ margin: 0, fontWeight: 700, color: token.colorText, fontSize: 16 }}>
                        حجم المعالجة (آخر 6 أشهر)
                    </Title>
                </div>
                <Text style={{ fontSize: 11, fontWeight: 600, color: token.colorTextSecondary }}>
                    الفواتير المعالجة
                </Text>
            </div>
            <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke={token.colorBorderSecondary} vertical={false} />
                    <XAxis dataKey="month" stroke={token.colorTextSecondary} fontSize={12} axisLine={false} tickLine={false} />
                    <YAxis
                        yAxisId="volume"
                        stroke={token.colorTextSecondary}
                        fontSize={12}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => value.toLocaleString('en-US')}
                        label={{ value: 'عدد الفواتير', angle: -90, position: 'insideLeft', style: { fill: token.colorTextTertiary, fontSize: 12 } }}
                    />
                    <YAxis
                        yAxisId="growth"
                        orientation="right"
                        stroke={token.colorTextSecondary}
                        fontSize={12}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `${value}%`}
                        label={{ value: 'نسبة النمو', angle: 90, position: 'insideRight', style: { fill: token.colorTextTertiary, fontSize: 12 } }}
                    />
                    <Tooltip
                        cursor={{ fill: token.colorFillTertiary }}
                        contentStyle={{
                            backgroundColor: token.colorBgContainer,
                            border: `1px solid ${token.colorBorder}`,
                            borderRadius: 8
                        }}
                    />
                    <Legend wrapperStyle={{ fontSize: 13 }} />
                    <Bar
                        yAxisId="volume"
                        dataKey="volume"
                        name="حجم المعالجة الشهري"
                        fill={token.colorPrimary}
                        radius={[8, 8, 0, 0]}
                        barSize={36}
                    />
                    <Line
                        yAxisId="growth"
                        dataKey="growthRate"
                        name="معدل النمو الشهري"
                        stroke={token.colorWarning}
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: token.colorWarning }}
                        connectNulls
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </Card>
    )
}

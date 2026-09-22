import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, theme, Typography } from 'antd'
import type { ProcessingVolumePoint } from '../components/dashboardCalculations'

const { Title } = Typography

interface ProcessingVolumeChartProps {
    data: ProcessingVolumePoint[]
    loading?: boolean
}

export default function ProcessingVolumeChart({ data, loading }: ProcessingVolumeChartProps) {
    const { token } = theme.useToken()

    return (
        <Card
            loading={loading}
            style={{ borderRadius: 12, border: `1px solid ${token.colorBorder}`, boxShadow: token.boxShadowTertiary }}
        >
            <Title level={5} style={{ marginBottom: 16 }}>
                حجم المعالجة (آخر 6 أشهر)
            </Title>
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

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Grid, theme } from 'antd'
import type { TableColumnsType } from 'antd'
import MainTable from '../../shared/components/MainTable'
import MobileDataCard from '../../shared/components/MobileDataCard'
import AnalysisCard from './AnalysisCard'
import type { AnalysisChartData } from '../api/analyticsApi'
import { formatAxis, formatFull, ltr } from '../utils/format'

const { useBreakpoint } = Grid


type ChartRow = { key: string; label: string; value: number }

interface AnalysisChartProps {
    chart: AnalysisChartData
}

export default function AnalysisChart({ chart }: AnalysisChartProps) {
    const { token } = theme.useToken()
    const screens = useBreakpoint()
    const isMobileOrTablet = !screens.lg

    const rows: ChartRow[] = chart.items.map((item, index) => ({
        key: `${item.label}-${index}`,
        label: item.label,
        value: item.value
    }))

    const columns: TableColumnsType<ChartRow> = [
        {
            title: 'البند',
            dataIndex: 'label',
            key: 'label',
            render: (label: string) => ltr(label)
        },
        {
            title: 'القيمة',
            dataIndex: 'value',
            key: 'value',
            render: (value: number) => formatFull(value)
        }
    ]

    return (
        <AnalysisCard title="التوزيع">
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chart.items}>
                    <CartesianGrid strokeDasharray="3 3" stroke={token.colorBorderSecondary} vertical={false} />
                    <XAxis
                        dataKey="label"
                        stroke={token.colorTextSecondary}
                        fontSize={12}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(label: string) => ltr(label)}
                    />
                    <YAxis
                        stroke={token.colorTextSecondary}
                        fontSize={12}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value: number) => formatAxis(value)}
                    />
                    <Tooltip
                        cursor={{ fill: token.colorFillTertiary }}
                        formatter={(value) => formatFull(Number(value))}
                        labelFormatter={(label) => ltr(String(label))}
                        contentStyle={{
                            backgroundColor: token.colorBgContainer,
                            border: `1px solid ${token.colorBorder}`,
                            borderRadius: 8
                        }}
                    />
                    <Bar dataKey="value" name="القيمة" fill={token.colorPrimary} radius={[8, 8, 0, 0]} barSize={36} />
                </BarChart>
            </ResponsiveContainer>

            <div style={{ marginTop: 20 }}>
                {isMobileOrTablet ? (
                    <MobileDataCard<ChartRow> columns={columns} dataSource={rows} />
                ) : (
                    <MainTable<ChartRow> columns={columns} dataSource={rows} rowKey="key" />
                )}
            </div>
        </AnalysisCard>
    )
}
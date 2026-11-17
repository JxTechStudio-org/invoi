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

    const chartHeight = Math.max(200, chart.items.length * 52)

    return (
        <AnalysisCard title="التوزيع">
            <div style={{ direction: 'ltr' }}>
                <ResponsiveContainer width="100%" height={chartHeight}>
                    <BarChart
                        layout="vertical"
                        data={chart.items}
                        margin={{ top: 10, right: 10, left: 20, bottom: 10 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke={token.colorBorderSecondary} horizontal={false} />
                        <XAxis
                            type="number"
                            reversed={true}
                            stroke={token.colorTextSecondary}
                            fontSize={12}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value: number) => formatAxis(value)}
                        />
                        <YAxis
                            type="category"
                            dataKey="label"
                            orientation="right"
                            stroke={token.colorTextSecondary}
                            fontSize={13}
                            axisLine={false}
                            tickLine={false}
                            width={110}
                            tick={{
                                fill: token.colorTextSecondary,
                                fontSize: 13,
                                textAnchor: 'start',
                                dx: 8
                            }}
                        />
                        <Tooltip
                            cursor={{ fill: token.colorFillTertiary }}
                            formatter={(value) => [formatFull(Number(value)), 'القيمة']}
                            labelFormatter={(label) => String(label)}
                            contentStyle={{
                                backgroundColor: token.colorBgContainer,
                                border: `1px solid ${token.colorBorder}`,
                                borderRadius: 8,
                                color: token.colorText,
                                direction: 'rtl',
                                textAlign: 'right'
                            }}
                            itemStyle={{ color: token.colorText }}
                        />
                        <Bar
                            dataKey="value"
                            name="القيمة"
                            fill={token.colorPrimary}
                            radius={[8, 0, 0, 8]}
                            barSize={20}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div style={{ marginTop: 20 }}>
                {isMobileOrTablet ? (
                    <MobileDataCard<ChartRow> columns={columns} dataSource={rows} />
                ) : (
                    <MainTable<ChartRow> columns={columns} dataSource={rows} rowKey="key" pagination={false} />
                )}
            </div>
        </AnalysisCard>
    )
}
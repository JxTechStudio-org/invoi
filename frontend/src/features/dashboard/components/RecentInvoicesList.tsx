
import { Card, List, Tag, theme, Typography , Space } from 'antd'
import PendingValue from '../../shared/components/PendingValue'
import type { RecentInvoiceSummary } from '../components/dashboardCalculations'
import ConfidenceBadge from '../../shared/components/ConfidenceBadge'

const { Title } = Typography

const STATUS_CONFIG = {
    processing: { label: 'قيد المعالجة', color: 'warning' as const },
    completed: { label: 'مكتملة', color: 'success' as const },
    needs_review: { label: 'تحتاج مراجعة', color: 'error' as const }
}

interface RecentInvoicesListProps {
    data: RecentInvoiceSummary[]
    loading?: boolean
}

export default function RecentInvoicesList({ data, loading }: RecentInvoicesListProps) {
    return (
        <Card
            loading={loading}
            style={{ borderRadius: 12 }}
        >
            <Title level={5} style={{ marginBottom: 16 }}>
                آخر الفواتير المرفوعة
            </Title>
            <List
                dataSource={data}
                rowKey="id"
                renderItem={(invoice) => (
                    <List.Item>
                        <span style={{ flex: 1 }}>
                            <PendingValue value={invoice.vendorName} text="جاري الاستخراج..." />
                        </span>
                        <Space size={8}>
                            {invoice.confidenceLevel && invoice.confidencePercentage !== null && (
                                <ConfidenceBadge level={invoice.confidenceLevel} percentage={invoice.confidencePercentage} />
                            )}
                            <Tag color={STATUS_CONFIG[invoice.status].color}>{STATUS_CONFIG[invoice.status].label}</Tag>
                        </Space>
                    </List.Item>
                )}
            />
        </Card>
    )
}


import { Card, theme, Typography, Empty, Flex } from 'antd'
import PendingValue from '../../shared/components/PendingValue'
import type { RecentInvoiceSummary } from '../components/dashboardCalculations'
import ConfidenceBadge from '../../shared/components/ConfidenceBadge'
import type { GlobalToken } from 'antd'

const { Title, Text } = Typography

const getStatusTokenConfig = (token: GlobalToken) => ({
    processing: { label: 'قيد المعالجة', colorBg: token.colorWarningBg, colorText: token.colorWarningText },
    completed: { label: 'مكتملة', colorBg: token.colorSuccessBg, colorText: token.colorSuccessText },
    needs_review: { label: 'تحتاج مراجعة', colorBg: token.colorErrorBg, colorText: token.colorErrorText }
})

interface RecentInvoicesListProps {
    data?: RecentInvoiceSummary[]
    loading?: boolean
}

export default function RecentInvoicesList({ data = [], loading }: RecentInvoicesListProps) {
    const { token } = theme.useToken()
    const statusConfig = getStatusTokenConfig(token)
    const safeData = Array.isArray(data) ? data : []

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
                        آخر الفواتير المرفوعة
                    </Title>
                </div>
                <Text style={{ fontSize: 11, fontWeight: 600, color: token.colorTextSecondary }}>
                    النشاط الأخير
                </Text>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 120px',
                    padding: '0 12px 10px 12px',
                    borderBottom: `2px solid ${token.colorPrimary}40`,
                    marginBottom: 10,
                    alignItems: 'baseline'
                }}
            >
                <Text style={{ fontSize: 12, fontWeight: 700, color: token.colorPrimary }}>اسم المورد</Text>
                <Text style={{ fontSize: 12, fontWeight: 700, color: token.colorPrimary, textAlign: 'center' }}>الحالة</Text>
            </div>

            <div>
                {safeData.length === 0 ? (
                    <Flex vertical align="center" justify="center" style={{ height: '50vh' }}>
                        <Empty description="لا توجد فواتير مطابقة" />
                    </Flex>
                ) : (
                    safeData.map((invoice, index) => {
                        const invoiceStatus = statusConfig[invoice.status] || { label: invoice.status, colorBg: token.colorBgLayout, colorText: token.colorText }
                        const isLast = index === safeData.length - 1

                        return (
                            <div
                                key={invoice.id || index}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 120px',
                                    padding: '14px 12px',
                                    alignItems: 'center',
                                    borderBottom: isLast ? 'none' : `1px solid ${token.colorBorderSecondary}40`,
                                    borderRadius: 5,
                                    transition: 'all 0.2s ease',
                                    cursor: 'default'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = token.colorFillSecondary
                                    e.currentTarget.style.boxShadow = `inset 2px 0 0 ${token.colorPrimary}`
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                    e.currentTarget.style.boxShadow = 'none'
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                                    <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, color: token.colorText }}>
                                        <PendingValue value={invoice.vendorName} text="جاري الاستخراج..." />
                                    </div>
                                    {invoice.confidenceLevel && invoice.confidencePercentage !== null && (
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <ConfidenceBadge level={invoice.confidenceLevel} percentage={invoice.confidencePercentage} />
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            padding: '4px 12px',
                                            borderRadius: 999,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            backgroundColor: invoiceStatus.colorBg,
                                            color: invoiceStatus.colorText,
                                            lineHeight: '1.2',
                                            border: `1px solid ${invoiceStatus.colorText}30`,
                                            textAlign: 'center',
                                            width: '100%'
                                        }}
                                    >
                                        {invoiceStatus.label}
                                    </span>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </Card>
    )
}

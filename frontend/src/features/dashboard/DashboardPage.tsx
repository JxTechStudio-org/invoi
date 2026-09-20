import { Row, Col, theme } from 'antd'
import { FileTextOutlined, ClockCircleOutlined, CheckCircleOutlined, DollarOutlined } from '@ant-design/icons'
import StatCard from '@/shared/components/StatCard'
import MainAlert from '@/shared/components/MainAlert'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { useProcessingVolume } from '../hooks/useProcessingVolume'

export default function DashboardPage() {
    const { stats, isLoading, errorMessage } = useDashboardStats()
    const { data: volumeData } = useProcessingVolume()
    const { token } = theme.useToken()

    if (errorMessage) {
        return <MainAlert alertMessage={errorMessage} alertType="error" />
    }

    return (
        <div style={{ padding: 24 }}>
            <h2 style={{ marginBottom: 20 }}>لوحة التحكم</h2>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <StatCard
                        title="إجمالي الفواتير"
                        value={stats?.totalInvoices ?? '—'}
                        icon={<FileTextOutlined style={{ color: token.colorPrimary }} />}
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatCard
                        title="بانتظار المراجعة"
                        value={stats?.lowConfidenceCount ?? '—'}
                        icon={<ClockCircleOutlined style={{ color: token.colorWarning }} />}
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatCard
                        title="معدل الدقة"
                        value={stats ? `${stats.accuracyRate}%` : '—'}
                        icon={<CheckCircleOutlined style={{ color: token.colorSuccess }} />}
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatCard
                        title="إجمالي المبلغ هذا الشهر"
                        value={stats?.totalAmountThisMonth ?? '—'}
                        prefix="$"
                        icon={<DollarOutlined style={{ color: token.colorPrimary }} />}
                    />
                </Col>
            </Row>

            {/* هنا يوضع الرسم البياني باستخدام volumeData — نتفق على مكتبة الرسوم لاحقًا */}

            {isLoading && <MainAlert alertMessage="جاري تحميل البيانات..." alertType="info" />}
        </div>
    )
}

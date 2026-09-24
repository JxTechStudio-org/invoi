import { Row, Col, theme } from 'antd'
import { FileTextOutlined, ClockCircleOutlined, CheckCircleOutlined, DollarOutlined, PercentageOutlined } from '@ant-design/icons'
import StatCard from '../../shared/components/StatCard'
import ExportButton from '../../shared/components/ExportButton'
import MainAlert from '../../shared/components/MainAlert'
import { TbDeviceAnalytics } from "react-icons/tb"
import ProcessingVolumeChart from '../components/ProcessingVolumeChart'
import ConfidenceDistributionChart from '../components/ConfidenceDistributionChart'
import RecentInvoicesList from '../components/RecentInvoicesList'
import TopVendorsList from '../components/TopVendorsList'
import { useDashboardData } from '../hooks/useDashboardData'
import { useExportInvoices } from '../hooks/useExportInvoices'
import PageHeader from '../../shared/components/PageHeader'

export default function DashboardPage() {
    const { token } = theme.useToken()
    const {
        stats,
        processingVolume,
        confidenceDistribution,
        recentInvoices,
        topVendors,
        accuracyRate,
        isLoading,
        errorMessage
    } = useDashboardData()
    const { exportInvoices, isExporting, errorMessage: exportError } = useExportInvoices()

    if (errorMessage) {
        return <MainAlert alertMessage={errorMessage} alertType="error" />
    }

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <PageHeader pageIcon={<TbDeviceAnalytics />} pagename1='لوحة التحكم' />
                <ExportButton onClick={exportInvoices} loading={isExporting} />
            </div>
            <div style={{ padding: 24 }}>

                {exportError && (
                    <div style={{ marginBottom: 16 }}>
                        <MainAlert alertMessage={exportError} alertType="error" />
                    </div>
                )}

                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={12} flex="1 1 220px">
                        <StatCard
                            title="إجمالي الفواتير"
                            value={stats.totalInvoices}
                            icon={<FileTextOutlined style={{ color: token.colorPrimary }} />}
                        />
                    </Col>
                    <Col xs={24} sm={12} flex="1 1 220px">
                        <StatCard
                            title="تحتاج مراجعة"
                            value={stats.needsReviewCount}
                            icon={<ClockCircleOutlined style={{ color: token.colorWarning }} />}
                        />
                    </Col>
                    <Col xs={24} sm={12} flex="1 1 220px">
                        <StatCard
                            title="نسبة الفواتير المكتملة"
                            value={stats.completionRate !== null ? `${stats.completionRate}%` : '—'}
                            icon={<PercentageOutlined style={{ color: token.colorInfo }} />}
                        />
                    </Col>
                    <Col xs={24} sm={12} flex="1 1 220px">
                        <StatCard
                            title="معدل الدقة"
                            value={accuracyRate !== undefined ? `${accuracyRate}%` : '—'}
                            icon={<CheckCircleOutlined style={{ color: token.colorSuccess }} />}
                        />
                    </Col>
                    <Col xs={24} sm={12} flex="1 1 220px">
                        <StatCard
                            title="إجمالي المبلغ هذا الشهر"
                            value={stats.totalAmountThisMonth.toLocaleString('ar-SA')}
                            prefix="ر.س"
                            icon={<DollarOutlined style={{ color: token.colorPrimary }} />}
                        />
                    </Col>
                </Row>

                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} lg={16}>
                        <ProcessingVolumeChart data={processingVolume} loading={isLoading} />
                    </Col>
                    <Col xs={24} lg={8}>
                        <ConfidenceDistributionChart data={confidenceDistribution} loading={isLoading} />
                    </Col>
                </Row>

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                        <RecentInvoicesList data={recentInvoices} loading={isLoading} />
                    </Col>
                    <Col xs={24} lg={12}>
                        <TopVendorsList data={topVendors} loading={isLoading} />
                    </Col>
                </Row>
            </div>
        </>
    )
}

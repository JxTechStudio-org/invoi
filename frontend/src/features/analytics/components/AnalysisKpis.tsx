import { Col, Row } from 'antd'
import StatCard from '../../shared/components/StatCard'
import type { AnalysisKpi } from '../api/analyticsApi'
import { formatNumber, unitLabel } from '../utils/format'

interface AnalysisKpisProps {
    kpis: AnalysisKpi[]
}

export default function AnalysisKpis({ kpis }: AnalysisKpisProps) {
    return (
        <Row gutter={[16, 16]}>
            {kpis.map((kpi, index) => (
                <Col key={`${kpi.label}-${index}`} xs={24} sm={12} lg={8}>
                    <StatCard
                        title={kpi.unit ? `${kpi.label} (${unitLabel(kpi.unit)})` : kpi.label}
                        value={formatNumber(kpi.value)}
                    />
                </Col>
            ))}
        </Row>
    )
}
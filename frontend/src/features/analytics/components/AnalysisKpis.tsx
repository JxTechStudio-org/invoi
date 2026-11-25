import { Col, Row } from 'antd'
import StatCard from '../../shared/components/StatCard'
import type { AnalysisKpi } from '../api/analyticsApi'
import { formatNumber, unitLabel } from '../utils/format'

interface AnalysisKpisProps {
    kpis: AnalysisKpi[]
}

function getKpiTitle(kpi: AnalysisKpi): string {
    // If label already contains unit parentheses (e.g. "DPO (يوم)"), avoid duplicating it
    if (kpi.label.includes('(') || kpi.label.includes(')')) {
        return kpi.label
    }
    const unit = unitLabel(kpi.unit)
    return unit ? `${kpi.label} (${unit})` : kpi.label
}

export default function AnalysisKpis({ kpis }: AnalysisKpisProps) {
    return (
        <Row gutter={[16, 16]}>
            {kpis.map((kpi, index) => (
                <Col key={`${kpi.label}-${index}`} xs={24} sm={12} lg={8}>
                    <StatCard
                        title={getKpiTitle(kpi)}
                        value={formatNumber(kpi.value)}
                    />
                </Col>
            ))}
        </Row>
    )
}

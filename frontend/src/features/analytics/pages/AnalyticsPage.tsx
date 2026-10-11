import { Empty, Flex, Spin, Typography } from 'antd'
import { AiOutlineBarChart } from 'react-icons/ai'
import PageHeader from '../../shared/components/PageHeader'
import MainAlert from '../../shared/components/MainAlert'
import MainButton from '../../shared/components/MainButton'
import AnalysisRequest from '../components/AnalysisRequest'
import AnalysisKpis from '../components/AnalysisKpis'
import AnalysisChart from '../components/AnalysisChart'
import AnalysisReport from '../components/AnalysisReport'
import { useAnalytics } from '../hooks/useAnalytics'

const { Title, Text } = Typography

export default function AnalyticsPage() {
    const { run, retry, result, isPending, activeType, errorMessage } = useAnalytics()

    const hasKpis = !!result?.kpis?.length
    const hasChart = !!result?.chart?.items?.length
    const hasReport = !!result?.report?.trim()

    const generatedAt = result?.generatedAt ? new Date(result.generatedAt) : null
    const generatedAtText =
        generatedAt && !Number.isNaN(generatedAt.getTime()) ? generatedAt.toLocaleString('ar-SA') : null

    const renderResult = () => {
        if (isPending) {
            return (
                <Flex vertical align="center" justify="center" gap={16} style={{ padding: 60 }}>
                    <Spin size="large" />
                    <Text>جاري التحليل… قد يستغرق ذلك من 20 إلى 60 ثانية</Text>
                </Flex>
            )
        }

        if (errorMessage) {
            return (
                <Flex vertical align="center" gap={16}>
                    <MainAlert alertMessage={errorMessage} alertType="error" />
                    <MainButton text="حاول مرة ثانية" type="primary" onClick={retry} />
                </Flex>
            )
        }

        if (result) {
            if (!hasKpis && !hasChart && !hasReport) {
                return (
                    <Flex vertical align="center" justify="center" style={{ padding: 60 }}>
                        <Empty description="لا توجد بيانات كافية لعرض هذا التحليل" />
                    </Flex>
                )
            }

            return (
                <Flex vertical gap={24}>
                    <div>
                        <Title level={4} style={{ margin: 0 }}>
                            {result.title}
                        </Title>
                        {generatedAtText && <Text type="secondary">{generatedAtText}</Text>}
                    </div>
                    {hasKpis && <AnalysisKpis kpis={result.kpis!} />}
                    {hasChart && <AnalysisChart chart={result.chart!} />}
                    {hasReport && <AnalysisReport report={result.report!} />}
                </Flex>
            )
        }

        return (
            <Flex vertical align="center" justify="center" style={{ padding: 60 }}>
                <Empty description="اختر تحليلاً من الأعلى أو اكتب سؤالك" />
            </Flex>
        )
    }

    return (
        <>
            <PageHeader pageIcon={<AiOutlineBarChart />} pagename1="التحليلات" page1path="/analytics" />

            <Flex vertical gap={24}>
                <AnalysisRequest onRun={run} disabled={isPending} activeType={activeType} />
                {renderResult()}
            </Flex>
        </>
    )
}
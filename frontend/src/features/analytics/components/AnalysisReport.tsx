import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Typography, theme } from 'antd'
import AnalysisCard from './AnalysisCard'

const { Title, Paragraph, Text } = Typography

interface AnalysisReportProps {
    report: string
}

export default function AnalysisReport({ report }: AnalysisReportProps) {
    const { token } = theme.useToken()

    return (
        <AnalysisCard title="التقرير" extra="ملخص بالذكاء الاصطناعي">
            <div style={{ color: token.colorText, lineHeight: 1.8 }}>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h1: ({ children }) => (
                            <Title level={3} style={{ marginTop: 24, marginBottom: 12, color: token.colorText }}>
                                {children}
                            </Title>
                        ),
                        h2: ({ children }) => (
                            <Title level={4} style={{ marginTop: 20, marginBottom: 10, color: token.colorText }}>
                                {children}
                            </Title>
                        ),
                        h3: ({ children }) => (
                            <Title level={5} style={{ marginTop: 16, marginBottom: 8, color: token.colorText }}>
                                {children}
                            </Title>
                        ),
                        p: ({ children }) => (
                            <Paragraph style={{ color: token.colorText, marginBottom: 14 }}>
                                {children}
                            </Paragraph>
                        ),
                        ul: ({ children }) => (
                            <ul style={{ paddingInlineStart: 24, marginBottom: 14, color: token.colorText }}>
                                {children}
                            </ul>
                        ),
                        ol: ({ children }) => (
                            <ol style={{ paddingInlineStart: 24, marginBottom: 14, color: token.colorText }}>
                                {children}
                            </ol>
                        ),
                        li: ({ children }) => <li style={{ marginBottom: 6 }}>{children}</li>,
                        strong: ({ children }) => (
                            <Text strong style={{ color: token.colorText }}>
                                {children}
                            </Text>
                        ),
                        table: ({ children }) => (
                            <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                                <table
                                    style={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                        borderRadius: token.borderRadiusSM
                                    }}
                                >
                                    {children}
                                </table>
                            </div>
                        ),
                        th: ({ children }) => (
                            <th
                                style={{
                                    backgroundColor: token.colorFillAlter,
                                    border: `1px solid ${token.colorBorderSecondary}`,
                                    padding: '8px 12px',
                                    fontWeight: 600,
                                    textAlign: 'start'
                                }}
                            >
                                {children}
                            </th>
                        ),
                        td: ({ children }) => (
                            <td
                                style={{
                                    border: `1px solid ${token.colorBorderSecondary}`,
                                    padding: '8px 12px'
                                }}
                            >
                                {children}
                            </td>
                        ),
                        blockquote: ({ children }) => (
                            <blockquote
                                style={{
                                    borderInlineStart: `4px solid ${token.colorPrimary}`,
                                    paddingInlineStart: 12,
                                    margin: '12px 0',
                                    color: token.colorTextSecondary,
                                    backgroundColor: token.colorFillAlter,
                                    paddingBlock: 8,
                                    borderRadius: 4
                                }}
                            >
                                {children}
                            </blockquote>
                        ),
                        code: ({ children }) => (
                            <code
                                style={{
                                    backgroundColor: token.colorFillTertiary,
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    fontSize: '0.9em',
                                    fontFamily: 'monospace'
                                }}
                            >
                                {children}
                            </code>
                        )
                    }}
                >
                    {report}
                </ReactMarkdown>
            </div>
        </AnalysisCard>
    )
}

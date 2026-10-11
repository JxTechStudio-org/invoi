import type { ReactNode } from 'react'
import { Typography, theme } from 'antd'
import AnalysisCard from './AnalysisCard'

const { Title, Paragraph } = Typography

// i will use markdown library later, this is just for testing
type Block =
    | { kind: 'h'; level: number; text: string }
    | { kind: 'p'; text: string }
    | { kind: 'ul'; items: string[] }
    | { kind: 'ol'; items: string[] }

function parseMarkdown(markdown: string): Block[] {
    const blocks: Block[] = []

    for (const raw of markdown.split('\n')) {
        const line = raw.trim()
        if (!line) continue

        const heading = /^(#{1,3})\s+(.*)$/.exec(line)
        const bullet = /^[-*]\s+(.*)$/.exec(line)
        const numbered = /^\d+[.)]\s+(.*)$/.exec(line)
        const last = blocks[blocks.length - 1]

        if (heading) {
            blocks.push({ kind: 'h', level: heading[1].length, text: heading[2] })
        } else if (bullet) {
            if (last?.kind === 'ul') last.items.push(bullet[1])
            else blocks.push({ kind: 'ul', items: [bullet[1]] })
        } else if (numbered) {
            if (last?.kind === 'ol') last.items.push(numbered[1])
            else blocks.push({ kind: 'ol', items: [numbered[1]] })
        } else {
            blocks.push({ kind: 'p', text: line })
        }
    }

    return blocks
}

function renderInline(text: string): ReactNode[] {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
        part.length > 4 && part.startsWith('**') && part.endsWith('**') ? (
            <strong key={index}>{part.slice(2, -2)}</strong>
        ) : (
            part
        )
    )
}

interface AnalysisReportProps {
    report: string
}

export default function AnalysisReport({ report }: AnalysisReportProps) {
    const { token } = theme.useToken()
    const blocks = parseMarkdown(report)

    return (
        <AnalysisCard title="التقرير" extra="ملخص بالذكاء الاصطناعي">
            {blocks.map((block, index) => {
                if (block.kind === 'h') {
                    const level = Math.min(block.level + 2, 5) as 3 | 4 | 5
                    return (
                        <Title key={index} level={level} style={{ marginTop: index === 0 ? 0 : 20 }}>
                            {renderInline(block.text)}
                        </Title>
                    )
                }
                if (block.kind === 'p') {
                    return (
                        <Paragraph key={index} style={{ color: token.colorText }}>
                            {renderInline(block.text)}
                        </Paragraph>
                    )
                }
                const ListTag = block.kind === 'ul' ? 'ul' : 'ol'
                return (
                    <ListTag key={index} style={{ paddingInlineStart: 22, color: token.colorText }}>
                        {block.items.map((item, i) => (
                            <li key={i} style={{ marginBottom: 6 }}>
                                {renderInline(item)}
                            </li>
                        ))}
                    </ListTag>
                )
            })}
        </AnalysisCard>
    )
}
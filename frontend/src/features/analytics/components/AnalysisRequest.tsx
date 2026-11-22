import { useState } from 'react'
import { Flex, Input } from 'antd'
import MainButton from '../../shared/components/MainButton'
import AnalysisCard from './AnalysisCard'
import { ANALYSIS_LABELS, PRESET_TYPES } from '../api/analyticsApi'
import type { AnalysisRequestBody, AnalysisType } from '../api/analyticsApi'

interface AnalysisRequestProps {
    onRun: (body: AnalysisRequestBody) => void
    disabled?: boolean
    activeType?: AnalysisType
}

export default function AnalysisRequest({ onRun, disabled = false, activeType }: AnalysisRequestProps) {
    const [question, setQuestion] = useState('')

    const submitQuestion = () => {
        const trimmed = question.trim()
        if (!trimmed || disabled) return
        onRun({ type: 'custom_question', question: trimmed })
    }

    return (
        <AnalysisCard title="اطلب تحليلاً">
            <Flex vertical gap={16}>
                <Flex gap={12} wrap>
                    <Input
                        value={question}
                        maxLength={500}
                        allowClear
                        disabled={disabled}
                        placeholder="اسأل المساعد الذكي عن فواتيرك… مثلاً: من أكثر مورد متأخرين في السداد له؟"
                        onChange={(e) => setQuestion(e.target.value)}
                        onPressEnter={submitQuestion}
                        style={{ flex: '1 1 260px' }}
                    />
                    <MainButton
                        text="اسأل"
                        type="primary"
                        onClick={submitQuestion}
                        loading={disabled && activeType === 'custom_question'}
                        disabled={disabled || question.trim() === ''}
                    />
                </Flex>

                <Flex gap={8} wrap>
                    {PRESET_TYPES.map((type) => (
                        <MainButton
                            key={type}
                            text={ANALYSIS_LABELS[type]}
                            shape="round"
                            type={activeType === type ? 'primary' : 'default'}
                            loading={disabled && activeType === type}
                            onClick={() => onRun({ type })}
                            disabled={disabled}
                        />
                    ))}
                </Flex>
            </Flex>
        </AnalysisCard>
    )
}

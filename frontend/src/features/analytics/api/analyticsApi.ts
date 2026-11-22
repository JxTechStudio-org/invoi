import { apiClient } from '../../../services/api/client'

// Must match ANALYTICS_TYPES in backend (analytics.dto.ts)
export const ANALYSIS_TYPES = [
    'ap_summary',
    'dpo_aging',
    'top_suppliers',
    'invoices_review',
    'custom_question'
] as const

export type AnalysisType = (typeof ANALYSIS_TYPES)[number]

export const ANALYSIS_LABELS: Record<AnalysisType, string> = {
    ap_summary: 'ملخص الحسابات الدائنة',
    dpo_aging: 'تحليل أعمار الديون و DPO',
    top_suppliers: 'أبرز الموردين',
    invoices_review: 'مراجعة الفواتير',
    custom_question: 'المساعد الذكي'
}

// section 1 buttons
export const PRESET_TYPES = ANALYSIS_TYPES.filter((t) => t !== 'custom_question')

export interface AnalysisRequestBody {
    type: AnalysisType
    question?: string
}

export interface AnalysisKpi {
    label: string
    value: number | string
    unit?: string
}

export interface AnalysisChartItem {
    label: string
    value: number
}

export interface AnalysisChartData {
    kind: 'bar'
    items: AnalysisChartItem[]
}

export interface AnalysisResult {
    type: AnalysisType
    title: string
    generatedAt: string
    kpis?: AnalysisKpi[]
    chart?: AnalysisChartData
    report?: string
}

// Analysis takes up to 60s; backend timeout is 2m, so frontend timeout is set slightly higher
const ANALYSIS_TIMEOUT_MS = 130_000

export async function runAnalysis(body: AnalysisRequestBody): Promise<AnalysisResult> {
    const { data } = await apiClient.post<AnalysisResult>('/analytics', body, {
        timeout: ANALYSIS_TIMEOUT_MS
    })
    return data
}

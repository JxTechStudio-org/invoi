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

// Section 1 buttons
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

export type AnalysisJobStatus = 'pending' | 'completed' | 'failed'

export interface AnalysisJob {
    id: string
    type: AnalysisType
    question?: string
    status: AnalysisJobStatus
    result?: AnalysisResult
    error?: string
    createdAt: string
    completedAt?: string
}

export async function createAnalysisJob(body: AnalysisRequestBody): Promise<{ jobId: string }> {
    const { data } = await apiClient.post<{ jobId: string }>('/analytics', body)
    return data
}

export async function getAnalysisJob(jobId: string): Promise<AnalysisJob> {
    const { data } = await apiClient.get<AnalysisJob>(`/analytics/jobs/${jobId}`)
    return data
}

export async function getLatestAnalysis(): Promise<Record<string, AnalysisResult>> {
    const { data } = await apiClient.get<Record<string, AnalysisResult>>('/analytics/latest')
    return data
}

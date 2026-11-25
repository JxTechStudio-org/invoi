import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import {
    createAnalysisJob,
    getAnalysisJob,
    getLatestAnalysis
} from '../api/analyticsApi'
import type {
    AnalysisRequestBody,
    AnalysisResult,
    AnalysisType
} from '../api/analyticsApi'

const ACTIVE_JOB_KEY = 'invoi_active_analytics_job_id'
const SELECTED_TYPE_KEY = 'invoi_analytics_selected_type'

function getErrorMessage(error: unknown): string {
    if (isAxiosError(error)) {
        const status = error.response?.status
        const serverMessage = error.response?.data?.message
        if (typeof serverMessage === 'string' && serverMessage.trim()) {
            return serverMessage
        }
        if (status === 504 || error.code === 'ECONNABORTED') {
            return 'التحليل أخذ وقتاً أطول من المتوقع، حاول مرة ثانية'
        }
        if (status === 502) return 'تعذر إكمال التحليل حالياً، حاول مرة ثانية'
        if (status === 500) return 'حدث خطأ في خادم التحليل، تحقق من إعدادات الخدمة'
        if (status === 404) return 'خدمة التحليل غير متوفرة أو المسار غير موجود'
        if (status === 429) return 'لقد وصلت إلى الحد اليومي المسموح به للتحليلات (5 تحليلات يومياً)'
        if (status === 400) return 'طلب التحليل غير صالح'
        if (!error.response) return 'تعذر الاتصال بالخادم، تحقق من الاتصال وحاول مرة ثانية'
    }
    if (typeof error === 'string') return error
    if (error instanceof Error) return error.message
    return 'حدث خطأ غير متوقع، حاول مرة ثانية'
}

export function useAnalytics() {
    const queryClient = useQueryClient()

    const [activeJobId, setActiveJobId] = useState<string | null>(() => {
        return localStorage.getItem(ACTIVE_JOB_KEY)
    })

    const [selectedType, setSelectedType] = useState<AnalysisType | null>(() => {
        return (localStorage.getItem(SELECTED_TYPE_KEY) as AnalysisType) || null
    })

    const [lastRequest, setLastRequest] = useState<AnalysisRequestBody | null>(null)

    // Fetch latest completed results per type on load
    const latestQuery = useQuery({
        queryKey: ['analytics', 'latest'],
        queryFn: getLatestAnalysis,
        staleTime: 30_000,
    })

    // Poll active job every 3 seconds while pending; stops on unmount
    const jobQuery = useQuery({
        queryKey: ['analytics', 'job', activeJobId],
        queryFn: () => getAnalysisJob(activeJobId!),
        enabled: Boolean(activeJobId),
        refetchInterval: (query) => {
            const data = query.state.data
            if (!data || data.status === 'pending') {
                return 3000
            }
            return false
        },
    })

    // Create job mutation
    const createMutation = useMutation({
        mutationFn: createAnalysisJob,
        onSuccess: (data, variables) => {
            setActiveJobId(data.jobId)
            localStorage.setItem(ACTIVE_JOB_KEY, data.jobId)
            setSelectedType(variables.type)
            localStorage.setItem(SELECTED_TYPE_KEY, variables.type)
        },
    })

    // Handle job status transitions
    useEffect(() => {
        if (!jobQuery.data) return

        if (jobQuery.data.status === 'completed') {
            localStorage.removeItem(ACTIVE_JOB_KEY)
            queryClient.invalidateQueries({ queryKey: ['analytics', 'latest'] })
        } else if (jobQuery.data.status === 'failed') {
            localStorage.removeItem(ACTIVE_JOB_KEY)
        }
    }, [jobQuery.data, queryClient])

    // Clean up if job is not found (404) or query fails
    useEffect(() => {
        if (jobQuery.isError) {
            localStorage.removeItem(ACTIVE_JOB_KEY)
            setActiveJobId(null)
        }
    }, [jobQuery.isError])

    // If no type was selected yet, select the most recent one from latestQuery
    useEffect(() => {
        if (!selectedType && latestQuery.data) {
            const entries = Object.entries(latestQuery.data)
            if (entries.length > 0) {
                entries.sort((a, b) => {
                    const dateA = new Date(a[1].generatedAt).getTime() || 0
                    const dateB = new Date(b[1].generatedAt).getTime() || 0
                    return dateB - dateA
                })
                const newestType = entries[0][0] as AnalysisType
                setSelectedType(newestType)
            }
        }
    }, [selectedType, latestQuery.data])

    const isJobPending = Boolean(activeJobId) && (!jobQuery.data || jobQuery.data.status === 'pending')
    const isPending = createMutation.isPending || isJobPending

    const run = (body: AnalysisRequestBody, options?: { force?: boolean }) => {
        // Prevent duplicate submissions while an analysis is pending
        if (isPending) return

        // If clicking a preset type that has already been generated and not forcing re-run:
        // Switch to viewing the latest result immediately without consuming daily quota
        if (
            !options?.force &&
            body.type !== 'custom_question' &&
            latestQuery.data?.[body.type] &&
            selectedType !== body.type
        ) {
            setSelectedType(body.type)
            localStorage.setItem(SELECTED_TYPE_KEY, body.type)
            setActiveJobId(null)
            localStorage.removeItem(ACTIVE_JOB_KEY)
            return
        }

        setLastRequest(body)
        setSelectedType(body.type)
        localStorage.setItem(SELECTED_TYPE_KEY, body.type)

        createMutation.mutate(body)
    }

    const retry = () => {
        if (lastRequest && !isPending) {
            createMutation.reset()
            run(lastRequest, { force: true })
        }
    }

    // Determine current result:
    // 1. If currently polling job just completed and matches selectedType, show its result
    // 2. Otherwise show latest result for the selected type
    let result: AnalysisResult | null = null
    if (
        jobQuery.data?.status === 'completed' &&
        jobQuery.data.result &&
        (!selectedType || jobQuery.data.type === selectedType)
    ) {
        result = jobQuery.data.result
    } else if (selectedType && latestQuery.data?.[selectedType]) {
        result = latestQuery.data[selectedType]
    }

    // Determine active type to highlight button
    const activeType: AnalysisType | undefined = isPending
        ? lastRequest?.type || (jobQuery.data?.type as AnalysisType) || selectedType || undefined
        : result?.type || selectedType || undefined

    // Determine error message
    let errorMessage: string | null = null
    if (createMutation.isError) {
        errorMessage = getErrorMessage(createMutation.error)
    } else if (jobQuery.data?.status === 'failed') {
        errorMessage = jobQuery.data.error || 'تعذر إكمال التحليل، حاول مرة ثانية'
    } else if (jobQuery.isError) {
        errorMessage = getErrorMessage(jobQuery.error)
    }

    return {
        run,
        retry,
        result,
        isPending,
        activeType,
        errorMessage,
    }
}

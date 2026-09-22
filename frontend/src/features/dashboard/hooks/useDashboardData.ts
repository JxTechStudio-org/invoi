
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useInvoicesList } from '../../invoice/hooks/useInvoicesList'
import { dashboardApi } from '../api/dashboardApi'
import {
    calculateStats,
    calculateProcessingVolume,
    calculateConfidenceDistribution,
    calculateRecentInvoices,
    calculateTopVendors
} from '../components/dashboardCalculations'

/**
 * ⚠️ تحذير أداء: هذا الـ hook يجلب كل الفواتير (تجاوزنا 10,000 سجل
 * فعليًا بالاختبار) لحساب الإحصائيات محليًا بالمتصفح. هذا حل مؤقت
 * لحد ما يتأكد شكل GET /metrics ويصير الحساب من جهة السيرفر بدلاً
 * من جلب كل البيانات هنا.
 */
export function useDashboardData() {
    const { invoices, isLoading, errorMessage } = useInvoicesList({})

    const metricsQuery = useQuery({
        queryKey: ['dashboard-metrics'],
        queryFn: async () => (await dashboardApi.getMetrics()).data,
        retry: false
    })

    const stats = useMemo(() => calculateStats(invoices), [invoices])
    const processingVolume = useMemo(() => calculateProcessingVolume(invoices), [invoices])
    const confidenceDistribution = useMemo(() => calculateConfidenceDistribution(invoices), [invoices])
    const recentInvoices = useMemo(() => calculateRecentInvoices(invoices), [invoices])
    const topVendors = useMemo(() => calculateTopVendors(invoices), [invoices])

    return {
        stats,
        processingVolume,
        confidenceDistribution,
        recentInvoices,
        topVendors,
        accuracyRate: metricsQuery.data?.accuracyRate,
        isLoading,
        errorMessage
    }
}

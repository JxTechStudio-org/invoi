
import { apiClient } from '../../../services/api/client'
import type { InvoicesListFilters } from '../../invoice/api/invoicesListApi'

/**
 * ⚠️ غير مؤكد بعد: شكل رد GET /metrics لسا ما تأكدنا منه مع أحمد.
 * accuracyRate تحديدًا لا يوجد بديل محلي له (لا يمكن حسابه من بيانات
 * /invoices الحالية)، لذلك يبقى معتمد بالكامل على هذا الـ endpoint.
 */

export interface DashboardMetrics {
    accuracyRate?: number
}

export const dashboardApi = {
    getMetrics: () => apiClient.get<DashboardMetrics>('/metrics'),
    exportInvoices: (filters?: InvoicesListFilters) =>
        apiClient.get('/invoices/export', { params: filters, responseType: 'blob' })
}

import { apiClient } from '../../../services/api/client'
import type { Invoice } from './invoicesListApi'

export const invoiceReviewApi = {
    // Human sign-off: sets status to completed (backend requires vendor, total and date).
    approve: (id: string) => apiClient.post<Invoice>(`/invoices/${id}/approve`),
    // "Report an error": sends the invoice back to needs_review with reason user_flagged.
    flag: (id: string) => apiClient.post<Invoice>(`/invoices/${id}/flag`)
}

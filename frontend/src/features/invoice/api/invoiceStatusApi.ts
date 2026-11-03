import { apiClient } from '../../../services/api/client'
import type { Invoice } from './invoicesListApi'

export interface InvoiceStatus {
    invoiceId: string
    status: Invoice['status']
    // The backend locks edit/approve/flag only while a job is running (D15).
    extractionState: 'queued' | 'running' | null
}

export const invoiceStatusApi = {
    get: (id: string) => apiClient.get<InvoiceStatus>(`/invoices/${id}/status`)
}

import { apiClient } from '../../../services/api/client'

export interface Invoice {
    key: string
    fileUrl: string
    status: 'processing' | 'done' | 'error'
    sellerName: string | null
    invoiceDate: string | null
    amount: number | null
    createdAt: string
}

export interface InvoicesListFilters {
    status?: string
}

export const invoicesListApi = {
    getList: (filters?: InvoicesListFilters) =>
        apiClient.get<Invoice[]>('/invoices', { params: filters })
}

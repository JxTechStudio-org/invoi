import { apiClient } from '../../../services/api/client'

export interface Invoice {
    id: string
    userId: string
    fileUrl: string
    status: 'processing' | 'completed' | 'needs_review'
    vendorName: string | null
    sellerName: string | null
    customerName: string | null
    invoiceNumber: string | null
    invoiceDate: string | null
    dueDate: string | null
    amount: string | null
    amountPaid: string | null
    taxAmount: string | null
    totalAmount: string | null
    currency: string | null
    taxNumber: string | null
    crNumber: string | null
    paymentMethod: string | null
    paymentStatus: string | null
    extractionConfidence: number | null
    needsReviewReason: string | null
    createdAt: string
    updatedAt: string
}

export interface InvoicesListFilters {
    status?: 'processing' | 'completed' | 'needs_review'
}

export const invoicesListApi = {
    getList: (filters?: InvoicesListFilters) =>
        apiClient.get<Invoice[]>('/invoices', { params: filters })
}

import type { AxiosProgressEvent } from 'axios'
import { apiClient } from '../../../services/api/client'

export interface UploadInvoiceResponse {
    invoice_id: string
    status: 'processing' | 'done' | 'error'
}

export const uploadInvoice = (
    file: File,
    onProgress?: (percent: number) => void
) => {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient.post<UploadInvoiceResponse>('/invoices/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event: AxiosProgressEvent) => {
            if (event.total && onProgress) {
                onProgress(Math.round((event.loaded * 100) / event.total))
            }
        }
    })
}

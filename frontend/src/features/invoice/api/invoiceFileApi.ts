import { apiClient } from '../../../services/api/client'

// The file endpoint needs the Bearer token, so it cannot be used as a plain <a href>/<img src>.
// Fetch it as a Blob and show it through an object URL instead.
export const invoiceFileApi = {
    getFile: (id: string) => apiClient.get<Blob>(`/invoices/${id}/file`, { responseType: 'blob' })
}

/** Opens the invoice file in a new tab. Call directly from a click handler so the tab is not blocked. */
export async function openInvoiceFile(id: string): Promise<void> {
    // Open the tab synchronously (inside the click) and fill it once the file has loaded.
    const tab = window.open('', '_blank')
    try {
        const response = await invoiceFileApi.getFile(id)
        const url = URL.createObjectURL(response.data)
        if (tab) {
            tab.location.href = url
        } else {
            // Pop-up blocked: fall back to downloading the file.
            const link = document.createElement('a')
            link.href = url
            link.download = `invoice-${id}`
            link.click()
        }
        // The new tab keeps its own copy once loaded; free ours afterwards.
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (error) {
        tab?.close()
        throw error
    }
}

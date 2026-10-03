import type { Invoice } from '../../invoice/api/invoicesListApi'

export interface VendorSummary {
    name: string
    invoiceCount: number
    totalAmount: number
    needsReviewCount: number
    lastInvoiceDate: string | null
}

function parseAmount(value: string | null): number {
    if (!value) return 0
    const parsed = parseFloat(value)
    return Number.isNaN(parsed) ? 0 : parsed
}

export function calculateVendorSummaries(invoices: Invoice[]): VendorSummary[] {
    const vendorsMap = new Map<string, VendorSummary>()

    invoices.forEach((invoice) => {
        const name = invoice.vendorName ?? invoice.sellerName
        if (!name) return

        const existing = vendorsMap.get(name)
        const invoiceAmount = parseAmount(invoice.amount)
        const invoiceDate = invoice.createdAt

        if (existing) {
            existing.invoiceCount += 1
            existing.totalAmount += invoiceAmount
            if (invoice.status === 'needs_review') existing.needsReviewCount += 1
            if (!existing.lastInvoiceDate || new Date(invoiceDate) > new Date(existing.lastInvoiceDate)) {
                existing.lastInvoiceDate = invoiceDate
            }
        } else {
            vendorsMap.set(name, {
                name,
                invoiceCount: 1,
                totalAmount: invoiceAmount,
                needsReviewCount: invoice.status === 'needs_review' ? 1 : 0,
                lastInvoiceDate: invoiceDate
            })
        }
    })

    return Array.from(vendorsMap.values()).sort((a, b) => b.invoiceCount - a.invoiceCount)
}


import type { Invoice } from '../../invoice/api/invoicesListApi'

export interface DashboardStats {
    totalInvoices: number
    processingCount: number
    needsReviewCount: number
    totalAmountThisMonth: number
    completionRate: number | null
}
export interface ProcessingVolumePoint {
    month: string
    volume: number
    growthRate: number | null
}

export interface ConfidenceDistribution {
    high: number
    medium: number
    low: number
}

export interface TopVendor {
    name: string
    invoiceCount: number
}

export interface RecentInvoiceSummary {
    id: string
    vendorName: string | null
    status: Invoice['status']
    amount: number | null
    confidenceLevel: ConfidenceLevel | null
    confidencePercentage: number | null
}

const ARABIC_MONTHS = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
]


export type ConfidenceLevel = 'high' | 'medium' | 'low'

/**
 * ثقة الفاتورة = أضعف حقل فيها، لأن أي حقل أقل من 0.9 يرسل الفاتورة للمراجعة
 * (low_confidence في backend/src/invoices/invoice-review.ts).
 */
export function getInvoiceConfidence(confidence: Invoice['extractionConfidence']): number | null {
    if (!confidence) return null
    const scores = Object.values(confidence).filter((score) => typeof score === 'number')
    return scores.length ? Math.min(...scores) : null
}

// high = لا تحتاج مراجعة (≥ 0.9)، medium = فحص واحد فشل جزئياً، low = حقل ناقص أو غير صالح
export function getConfidenceLevel(confidence: number | null): ConfidenceLevel | null {
    if (confidence === null) return null
    if (confidence >= 0.9) return 'high'
    if (confidence >= 0.6) return 'medium'
    return 'low'
}

export function calculateCompletionRate(invoices: Invoice[]): number | null {
    if (invoices.length === 0) return null
    const completedCount = invoices.filter((inv) => inv.status === 'completed').length
    return Math.round((completedCount / invoices.length) * 100)
}

/**
 * الحقول المالية (amount, totalAmount...) تصل كنصوص من الـ API،
 * لازم نحوّلها لأرقام قبل أي عملية حسابية.
 */
function parseAmount(value: string | null): number {
    if (!value) return 0
    const parsed = parseFloat(value)
    return Number.isNaN(parsed) ? 0 : parsed
}

export function calculateStats(invoices: Invoice[]): DashboardStats {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const totalAmountThisMonth = invoices.reduce((sum, invoice) => {
        const createdAt = new Date(invoice.createdAt)
        const isThisMonth = createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear
        return isThisMonth ? sum + parseAmount(invoice.amount) : sum
    }, 0)

    return {
        totalInvoices: invoices.length,
        processingCount: invoices.filter((inv) => inv.status === 'processing').length,
        needsReviewCount: invoices.filter((inv) => inv.status === 'needs_review').length,
        totalAmountThisMonth,
        completionRate: calculateCompletionRate(invoices)
    }
}

export function calculateProcessingVolume(invoices: Invoice[]): ProcessingVolumePoint[] {
    const now = new Date()
    const buckets: { month: string; volume: number }[] = []

    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        buckets.push({ month: ARABIC_MONTHS[date.getMonth()], volume: 0 })
    }

    invoices.forEach((invoice) => {
        const createdAt = new Date(invoice.createdAt)
        const monthsAgo =
            (now.getFullYear() - createdAt.getFullYear()) * 12 + (now.getMonth() - createdAt.getMonth())
        if (monthsAgo >= 0 && monthsAgo <= 5) {
            buckets[5 - monthsAgo].volume += 1
        }
    })

    return buckets.map((bucket, index) => {
        if (index === 0) return { ...bucket, growthRate: null }
        const previous = buckets[index - 1].volume
        const growthRate = previous === 0 ? null : Math.round(((bucket.volume - previous) / previous) * 100)
        return { ...bucket, growthRate }
    })
}

export function calculateConfidenceDistribution(invoices: Invoice[]): ConfidenceDistribution {
    const distribution: ConfidenceDistribution = { high: 0, medium: 0, low: 0 }

    invoices.forEach((invoice) => {
        const level = getConfidenceLevel(getInvoiceConfidence(invoice.extractionConfidence))
        if (level) distribution[level] += 1
    })

    return distribution
}


export function calculateRecentInvoices(invoices: Invoice[], limit = 6): RecentInvoiceSummary[] {
    return [...invoices]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit)
        .map((inv) => {
            const confidence = getInvoiceConfidence(inv.extractionConfidence)
            return {
                id: inv.id,
                vendorName: inv.vendorName ?? inv.sellerName,
                status: inv.status,
                amount: inv.amount !== null ? parseAmount(inv.amount) : null,
                confidenceLevel: getConfidenceLevel(confidence),
                confidencePercentage: confidence !== null ? Math.round(confidence * 100) : null
            }
        })
}


export function calculateTopVendors(invoices: Invoice[], limit = 5): TopVendor[] {
    const counts = new Map<string, number>()

    invoices.forEach((invoice) => {
        const name = invoice.vendorName ?? invoice.sellerName
        if (!name) return
        counts.set(name, (counts.get(name) ?? 0) + 1)
    })

    return Array.from(counts.entries())
        .map(([name, invoiceCount]) => ({ name, invoiceCount }))
        .sort((a, b) => b.invoiceCount - a.invoiceCount)
        .slice(0, limit)
}


export function calculateAverageProcessingTime(invoices: Invoice[]): number | null {
    const completedInvoices = invoices.filter((inv) => inv.status === 'completed')
    if (completedInvoices.length === 0) return null

    const totalHours = completedInvoices.reduce((sum, invoice) => {
        const created = new Date(invoice.createdAt).getTime()
        const updated = new Date(invoice.updatedAt).getTime()
        const hours = (updated - created) / (1000 * 60 * 60)
        return sum + hours
    }, 0)

    return Math.round((totalHours / completedInvoices.length) * 10) / 10
}

const UNIT_LABELS: Record<string, string> = {
    days: 'يوم',
    day: 'يوم',
    invoices: 'فاتورة',
    invoice: 'فاتورة',
    SAR: 'ر.س',
    sar: 'ر.س'
}

export const unitLabel = (unit?: string) => (unit ? (UNIT_LABELS[unit] ?? unit) : '')

// For KPI cards: large values are compacted (e.g. 5.3M)
export function formatNumber(value: number | string): string {
    if (typeof value !== 'number') return value
    if (Math.abs(value) >= 1_000_000) {
        return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
    }
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

// For chart axes: consistently compacted (e.g. 600K, 1.2M)
export const formatAxis = (value: number) =>
    new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)

// For tables: display full numeric value with 2 decimal places
export const formatFull = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 2 })

// In RTL layouts, text like "1–30" or "90+" can flip; wrap in LTR directional isolate marks
export const ltr = (text: string) => `\u2066${text}\u2069`

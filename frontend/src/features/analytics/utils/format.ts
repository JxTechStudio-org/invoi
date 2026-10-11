const UNIT_LABELS: Record<string, string> = {
    days: 'يوم',
    invoices: 'فاتورة'
}

export const unitLabel = (unit?: string) => (unit ? (UNIT_LABELS[unit] ?? unit) : '')

// للبطاقات: الأرقام الكبيرة تتختصر (5.3M)
export function formatNumber(value: number | string): string {
    if (typeof value !== 'number') return value
    if (Math.abs(value) >= 1_000_000) {
        return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
    }
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

// لمحور الرسم: دايماً مختصر بنفس الصيغة (600K, 1.2M)
export const formatAxis = (value: number) =>
    new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)

// للجداول: الرقم كامل
export const formatFull = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 2 })

// الصفحة عربية (من اليمين لليسار) فنصوص مثل 1–30 و90+ تنعكس.
// هذي الدالة تجبر النص يظهر من اليسار لليمين.
export const ltr = (text: string) => `\u2066${text}\u2069`
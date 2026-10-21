// Arabic labels for backend enum values (backend/prisma/schema.prisma).

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
    paid: 'مدفوعة',
    unpaid: 'غير مدفوعة',
    partially_paid: 'مدفوعة جزئيًا',
    overdue: 'متأخرة'
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
    bank_transfer: 'تحويل بنكي',
    credit_card: 'بطاقة ائتمانية',
    cash: 'نقدًا',
    cheque: 'شيك',
    online_payment: 'دفع إلكتروني',
    mixed: 'مختلط'
}

export const CURRENCY_LABELS: Record<string, string> = {
    SAR: 'ريال سعودي (SAR)',
    USD: 'دولار أمريكي (USD)',
    AED: 'درهم إماراتي (AED)'
}

export const toOptions = (labels: Record<string, string>) =>
    Object.entries(labels).map(([value, label]) => ({ value, label }))

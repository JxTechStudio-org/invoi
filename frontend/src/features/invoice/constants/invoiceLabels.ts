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

// Reason codes from backend/src/invoices/invoice-review.ts
export const REVIEW_REASON_LABELS: Record<string, string> = {
    low_confidence: 'بعض الحقول المستخرجة بدرجة ثقة منخفضة',
    customer_name_mismatch: 'اسم العميل في الفاتورة لا يطابق اسم المنشأة',
    amount_threshold_exceeded: 'المبلغ يتجاوز حد المراجعة المحدد',
    user_flagged: 'تم الإبلاغ عن خطأ في هذه الفاتورة'
}

// Must match approvalRequiredFields in backend/src/invoices/invoices.service.ts
export const APPROVAL_REQUIRED_FIELDS: Record<'vendorName' | 'totalAmount' | 'invoiceDate', string> = {
    vendorName: 'اسم المورد',
    totalAmount: 'المبلغ الإجمالي',
    invoiceDate: 'تاريخ الفاتورة'
}

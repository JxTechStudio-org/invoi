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
    AED: 'درهم إماراتي (AED)',
    EUR: 'يورو (EUR)',
    GBP: 'جنيه إسترليني (GBP)',
    KWD: 'دينار كويتي (KWD)',
    QAR: 'ريال قطري (QAR)',
    BHD: 'دينار بحريني (BHD)',
    OMR: 'ريال عماني (OMR)',
    EGP: 'جنيه مصري (EGP)',
    JOD: 'دينار أردني (JOD)',
    CNY: 'يوان صيني (CNY)',
    INR: 'روبية هندية (INR)'
}

export const toOptions = (labels: Record<string, string>) =>
    Object.entries(labels).map(([value, label]) => ({ value, label }))

// Reason codes from backend/src/invoices/invoice-review.ts
export const REVIEW_REASON_LABELS: Record<string, string> = {
    low_confidence: 'بعض الحقول المستخرجة بدرجة ثقة منخفضة',
    customer_name_mismatch: 'اسم العميل في الفاتورة لا يطابق اسم المنشأة',
    amount_threshold_exceeded: 'المبلغ يتجاوز حد المراجعة المحدد',
    user_flagged: 'تم الإبلاغ عن خطأ في هذه الفاتورة',
    extraction_failed: 'تعذّر استخراج بيانات الفاتورة تلقائياً، يرجى إدخالها يدوياً',
    zero_total: 'المبلغ الإجمالي يساوي صفراً',
    tax_over_30_percent: 'مبلغ الضريبة يتجاوز 30% من الإجمالي',
    multiple_invoices: 'الملف يحتوي على أكثر من فاتورة، وتم استخراج الأولى فقط'
}

// Must match approvalRequiredFields in backend/src/invoices/invoices.service.ts
export const APPROVAL_REQUIRED_FIELDS: Record<'vendorName' | 'totalAmount' | 'invoiceDate', string> = {
    vendorName: 'اسم المورد',
    totalAmount: 'المبلغ الإجمالي',
    invoiceDate: 'تاريخ الفاتورة'
}

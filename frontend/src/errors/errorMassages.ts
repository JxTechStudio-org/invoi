export const ERROR_MESSAGES: Record<string, string> = {
    // عامة (كل المشروع)
    NETWORK_ERROR: 'تعذر الاتصال بالخادم. تحققي من اتصالك بالإنترنت.',
    UNAUTHORIZED: 'انتهت صلاحية الجلسة. الرجاء تسجيل الدخول مرة أخرى.',
    FORBIDDEN: 'ليس لديك صلاحية للقيام بهذا الإجراء.',
    NOT_FOUND: 'العنصر المطلوب غير موجود.',
    CONFLICT: 'يوجد تعارض في البيانات. تحققي من المدخلات.',
    TOO_MANY_REQUESTS: 'عدد المحاولات كبير جدًا. الرجاء الانتظار قليلاً.',
    BAD_REQUEST: 'البيانات المُرسلة غير صحيحة.',
    SERVER_ERROR: 'حدث خطأ من جهة الخادم. حاولي مرة أخرى لاحقًا.',
    UNKNOWN_ERROR: 'حدث خطأ غير متوقع.',

    // خاصة برفع الفواتير — تتفعّل فقط لو الباك إند يرجّع هذا الكود صراحة بالـ response
    INVALID_FILE_TYPE: 'نوع الملف غير مدعوم أو الملف غير صالح.',
    FILE_TOO_LARGE: 'حجم الملف يتجاوز الحد المسموح.',
    UPLOAD_FAILED: 'فشل رفع الملف. حاولي مرة أخرى.',

    // خاصة بالموردين — مثال جاهز لـ CONFLICT لو الباك إند يفرّق بينهم
    DUPLICATE_VENDOR: 'يوجد مورّد مكرر بنفس البيانات.'
}

export function getErrorMessage(code: string): string {
    return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR
}

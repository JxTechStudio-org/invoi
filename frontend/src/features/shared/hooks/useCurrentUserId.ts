/**
 * مؤقت فقط: الباك إند حاليًا ما يدعم مصادقة فعلية (Authentication)،
 * فالـ userId يُمرر مباشرة من الفرونت إند بدون تحقق هوية حقيقي —
 * هذا موثّق صراحة بتوثيق الـ API كسلوك مؤقت.
 * لازم يُستبدل لاحقًا بمعرف المستخدم الفعلي القادم من نظام
 * تسجيل الدخول بعد اكتماله (على الأرجح عبر Context أو Zustand/Redux).
 */
export function useCurrentUserId(): string {
    return import.meta.env.VITE_TEMP_USER_ID
}

import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { runAnalysis } from '../api/analyticsApi'

function getErrorMessage(error: unknown): string {
    if (isAxiosError(error)) {
        const status = error.response?.status
        if (status === 504 || error.code === 'ECONNABORTED') {
            return 'التحليل أخذ وقتاً أطول من المتوقع، حاول مرة ثانية'
        }
        if (status === 502) return 'تعذر إكمال التحليل حالياً، حاول مرة ثانية'
        if (status === 429) return 'طلبات كثيرة خلال وقت قصير، انتظر قليلاً ثم حاول مرة ثانية'
        if (status === 400) return 'طلب التحليل غير صالح'
        if (!error.response) return 'تعذر الاتصال بالخادم، تحقق من الاتصال وحاول مرة ثانية'
    }
    return 'حدث خطأ غير متوقع، حاول مرة ثانية'
}

export function useAnalytics() {
    const mutation = useMutation({ mutationFn: runAnalysis })

    const run: typeof mutation.mutate = (body, options) => {
        // منع الضغط المكرر أثناء التحليل
        if (mutation.isPending) return
        mutation.mutate(body, options)
    }

    const retry = () => {
        if (mutation.variables && !mutation.isPending) {
            mutation.mutate(mutation.variables)
        }
    }

    return {
        run,
        retry,
        result: mutation.data,
        isPending: mutation.isPending,
        activeType: mutation.isPending ? mutation.variables?.type : undefined,
        errorMessage: mutation.isError ? getErrorMessage(mutation.error) : null
    }
}
import { useQuery } from '@tanstack/react-query'
import { invoiceStatusApi } from '../api/invoiceStatusApi'
import { POLL_INTERVAL_MS } from '../constants/polling'
import { usePollingWindow } from './usePollingWindow'

/**
 * Detail page polling (D14): asks GET /invoices/:id/status while the invoice is processing.
 * It always asks once, to learn whether a job is running; it keeps asking every 5 s only
 * when extraction runs for this account, and stops after 2 minutes.
 */
export function useInvoiceStatusPolling(id: string | undefined, isProcessing: boolean, canPoll: boolean) {
    const { withinWindow, timedOut } = usePollingWindow(isProcessing && canPoll)

    const query = useQuery({
        queryKey: ['invoice-status', id],
        queryFn: async () => (await invoiceStatusApi.get(id!)).data,
        enabled: Boolean(id) && isProcessing,
        refetchInterval: (current) =>
            withinWindow && current.state.data?.status !== 'completed' && current.state.data?.status !== 'needs_review'
                ? POLL_INTERVAL_MS
                : false
    })

    return {
        status: query.data?.status,
        extractionState: query.data?.extractionState ?? null,
        timedOut
    }
}

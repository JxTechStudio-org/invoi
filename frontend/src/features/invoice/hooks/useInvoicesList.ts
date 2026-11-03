import { useQuery } from '@tanstack/react-query'
import { invoicesListApi } from '../api/invoicesListApi'
import type { InvoicesListFilters } from '../api/invoicesListApi'
import { mapAxiosErrorToCode } from '../../../services/api/mapAxiosError'
import { getErrorMessage } from '../../../errors/errorMassages'
import { POLL_INTERVAL_MS } from '../constants/polling'
import { usePollingWindow } from './usePollingWindow'

// pollWhileProcessing: refetch the whole list every 5 s while any row is processing, for at
// most 2 minutes (D14). Only worth it when extraction runs for the account.
export function useInvoicesList(filters?: InvoicesListFilters, { pollWhileProcessing = false } = {}) {
    const query = useQuery({
        queryKey: ['invoices', filters],
        queryFn: async () => {
            const response = await invoicesListApi.getList(filters)
            return response.data
        },
        refetchInterval: () => (withinWindow ? POLL_INTERVAL_MS : false)
    })

    const hasProcessing = Boolean(query.data?.some((invoice) => invoice.status === 'processing'))
    const { withinWindow } = usePollingWindow(pollWhileProcessing && hasProcessing)

    const errorMessage = query.error ? getErrorMessage(mapAxiosErrorToCode(query.error)) : null

    return {
        invoices: query.data ?? [],
        isLoading: query.isLoading,
        errorMessage
    }
}

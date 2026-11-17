import { useQuery, useQueryClient } from '@tanstack/react-query'
import { invoicesListApi } from '../api/invoicesListApi'
import type { Invoice, InvoicesListFilters } from '../api/invoicesListApi'
import { mapAxiosErrorToCode } from '../../../services/api/mapAxiosError'
import { getErrorMessage } from '../../../errors/errorMassages'
import { POLL_INTERVAL_MS } from '../constants/polling'
import { usePollingWindow } from './usePollingWindow'

// pollWhileProcessing: refetch the whole list every 5 s while any row is processing, for at
// most 2 minutes (D14). Only worth it when extraction runs for the account.
export function useInvoicesList(filters?: InvoicesListFilters, { pollWhileProcessing = false } = {}) {
    const queryClient = useQueryClient()
    const queryKey = ['invoices', filters]

    // The polling window must be known before useQuery: React Query evaluates refetchInterval
    // while creating the observer during render. Read the rows from the cache (this component
    // re-renders whenever they change) instead of from the query result declared below.
    const cached = queryClient.getQueryData<Invoice[]>(queryKey)
    const hasProcessing = Boolean(cached?.some((invoice) => invoice.status === 'processing'))
    const { withinWindow } = usePollingWindow(pollWhileProcessing && hasProcessing)

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            const response = await invoicesListApi.getList(filters)
            return response.data
        },
        refetchInterval: withinWindow ? POLL_INTERVAL_MS : false
    })

    const errorMessage = query.error ? getErrorMessage(mapAxiosErrorToCode(query.error)) : null

    return {
        invoices: query.data ?? [],
        isLoading: query.isLoading,
        errorMessage
    }
}

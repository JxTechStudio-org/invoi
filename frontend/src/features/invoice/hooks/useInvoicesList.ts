import { useQuery } from '@tanstack/react-query'
import { invoicesListApi } from '../api/invoicesListApi'
import type { InvoicesListFilters } from '../api/invoicesListApi'
import { mapAxiosErrorToCode } from '../../../services/api/mapAxiosError'
import { getErrorMessage } from '../../../errors/errorMassages'

export function useInvoicesList(filters?: InvoicesListFilters) {
    const query = useQuery({
        queryKey: ['invoices', filters],
        queryFn: async () => {
            const response = await invoicesListApi.getList(filters)
            return response.data
        }
    })

    const errorMessage = query.error ? getErrorMessage(mapAxiosErrorToCode(query.error)) : null

    return {
        invoices: query.data ?? [],
        isLoading: query.isLoading,
        errorMessage
    }
}

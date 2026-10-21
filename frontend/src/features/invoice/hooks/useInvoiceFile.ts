import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { invoiceFileApi } from '../api/invoiceFileApi'
import { mapAxiosErrorToCode } from '../../../services/api/mapAxiosError'
import { getErrorMessage } from '../../../errors/errorMassages'

/** Loads an invoice's original file and exposes it as an object URL for previews. */
export function useInvoiceFile(id: string | undefined) {
    const query = useQuery({
        queryKey: ['invoice-file', id],
        queryFn: async () => (await invoiceFileApi.getFile(id!)).data,
        enabled: Boolean(id),
        retry: false,
        staleTime: Infinity
    })

    const [url, setUrl] = useState<string | null>(null)
    useEffect(() => {
        if (!query.data) return
        const objectUrl = URL.createObjectURL(query.data)
        setUrl(objectUrl)
        return () => URL.revokeObjectURL(objectUrl)
    }, [query.data])

    return {
        url,
        contentType: query.data?.type ?? null,
        isLoading: query.isLoading,
        errorMessage: query.error ? getErrorMessage(mapAxiosErrorToCode(query.error)) : null
    }
}

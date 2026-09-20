import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { uploadInvoice } from '../api/uploadInvoicesApi'
import { mapAxiosErrorToCode } from '../../../services/api/mapAxiosError'
import { getErrorMessage } from '../../../errors/errorMassages'
import { useCurrentUserId } from '../../shared/hooks/useCurrentUserId'

export function useUploadInvoice() {
    const [progress, setProgress] = useState(0)
    const userId = useCurrentUserId()

    const mutation = useMutation({
        mutationFn: async (file: File) => {
            setProgress(0)
            const response = await uploadInvoice(file, userId, setProgress)
            return response.data
        },
        onError: (error) => {
            const code = mapAxiosErrorToCode(error)
            console.error(`[useUploadInvoice] ${code}:`, getErrorMessage(code))
        }
    })

    const errorMessage = mutation.error ? getErrorMessage(mapAxiosErrorToCode(mutation.error)) : null

    return {
        upload: mutation.mutateAsync,
        isUploading: mutation.isPending,
        errorMessage,
        progress
    }
}


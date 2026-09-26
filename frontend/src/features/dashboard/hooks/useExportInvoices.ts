
import { useState } from 'react'
import { dashboardApi } from '../api/dashboardApi'
import { mapAxiosErrorToCode } from '../../../services/api/mapAxiosError'
import { getErrorMessage } from '../../../errors/errorMassages'

export function useExportInvoices() {
    const [isExporting, setIsExporting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const exportInvoices = async () => {
        setIsExporting(true)
        setErrorMessage(null)
        try {
            const response = await dashboardApi.exportInvoices()
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `invoices-${new Date().toISOString().slice(0, 10)}.csv`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            const code = mapAxiosErrorToCode(error)
            setErrorMessage(getErrorMessage(code))
        } finally {
            setIsExporting(false)
        }
    }

    return { exportInvoices, isExporting, errorMessage }
}

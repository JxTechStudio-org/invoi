import { useMemo } from 'react'
import { useInvoicesList } from '../../invoice/hooks/useInvoicesList'
import { calculateVendorSummaries } from '../utils/vendorCalculations'

/**
 * ⚠️ لا يوجد endpoint مخصص للموردين بالباك إند حاليًا.
 * البيانات مُشتقة بالكامل من GET /invoices، بنفس أسلوب
 * "أكثر الموردين تكرارًا" بالداشبورد.
 */
export function useVendorsList() {
    const { invoices, isLoading, errorMessage } = useInvoicesList({})
    const vendors = useMemo(() => calculateVendorSummaries(invoices), [invoices])

    return { vendors, isLoading, errorMessage }
}

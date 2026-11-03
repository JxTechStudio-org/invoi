import { apiClient } from '../../../services/api/client'

export type ExtractionUnavailableReason = 'disabled' | 'demo_account' | 'not_allowed' | 'budget_reached'

export interface CurrentUser {
    id: string
    email: string
    businessName: string
    firstName: string
    lastName: string
    username: string
    phone: string
    // English name as printed on invoices; the customer-name check accepts either name (F19).
    businessNameEn: string | null
    // Decimal as a string; invoices above it go to review. null = rule off.
    reviewAmountThreshold: string | null
    // Whether a re-extract request would be accepted for this account right now.
    extractionAvailable: boolean
    extractionUnavailableReason: ExtractionUnavailableReason | null
}

export type ProfileUpdate = Partial<{
    businessName: string
    businessNameEn: string | null
    reviewAmountThreshold: string | null
}>

export const currentUserApi = {
    get: () => apiClient.get<CurrentUser>('/auth/me'),
    // recheckedInvoices: needs_review invoices whose review reasons actually changed.
    update: (changes: ProfileUpdate) =>
        apiClient.patch<CurrentUser & { recheckedInvoices: number }>('/auth/me', changes)
}

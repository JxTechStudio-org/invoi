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
    // Whether a re-extract request would be accepted for this account right now.
    extractionAvailable: boolean
    extractionUnavailableReason: ExtractionUnavailableReason | null
}

export const currentUserApi = {
    get: () => apiClient.get<CurrentUser>('/auth/me')
}

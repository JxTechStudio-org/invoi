
import axios from 'axios'

export function mapAxiosErrorToCode(error: unknown): string {
    if (axios.isAxiosError(error)) {
        if (!error.response) return 'NETWORK_ERROR'

        const statusCode = error.response.status
        const backendCode = error.response.data?.code

        if (backendCode) return backendCode

        switch (statusCode) {
            case 400:
            case 422:
                return 'BAD_REQUEST'
            case 401:
                return 'UNAUTHORIZED'
            case 403:
                return 'FORBIDDEN'
            case 404:
                return 'NOT_FOUND'
            case 409:
                return 'CONFLICT'
            case 413:
                return 'PAYLOAD_TOO_LARGE'
            case 429:
                return 'TOO_MANY_REQUESTS'
            default:
                if (statusCode >= 500) return 'SERVER_ERROR'
                return 'UNKNOWN_ERROR'
        }
    }
    return 'UNKNOWN_ERROR'
}

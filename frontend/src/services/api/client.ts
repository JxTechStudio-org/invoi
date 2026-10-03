import axios from 'axios'
import { queryClient } from './queryClient'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const originalRequest = error.config;

        // check for 401 error and exclude auth login/register endpoints to prevent loops
        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest.url.includes('/auth/login') &&
            !originalRequest.url.includes('/auth/register')
        ) {
            localStorage.removeItem('authToken')
            queryClient.clear()
            // pass the reason via URL query parameter
            window.location.href = '/auth/login?reason=session_expired'
        }

        return Promise.reject(error)
    }
)

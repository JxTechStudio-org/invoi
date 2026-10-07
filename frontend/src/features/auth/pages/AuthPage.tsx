import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Form } from 'antd'
import { apiClient } from '../../../services/api/client'
import { ERROR_MESSAGES } from '../../../errors/errorMassages'
import AuthLayout from '../components/AuthLayout'
import LoginForm from '../components/LoginForm'
import RegisterForm from '../components/RegisterForm'
import MainAlert from '../../shared/components/MainAlert'
import axios from 'axios'

interface AuthFormValues {
    email: string
    password: string
    businessName?: string
    firstName?: string
    lastName?: string
    username?: string
    phone?: string
    confirm_password?: string
    [key: string]: unknown
}

export default function AuthPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const [form] = Form.useForm()
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [searchParams, setSearchParams] = useSearchParams()

    const [loading, setLoading] = useState(false)
    const isLoginMode = location.pathname.includes('login')

    // redirect to dashboard if user is already logged in
    useEffect(() => {
        const token = localStorage.getItem('authToken')
        if (token) {
            navigate('/dashboard', { replace: true })
        }
    }, [navigate])

    // handle expired session alert from apiClient using URL search params and clean up the query param to prevent duplicate alerts on browser back navigation
    useEffect(() => {
        const reason = searchParams.get('reason')
        if (reason === 'session_expired') {
            setSubmitError(ERROR_MESSAGES.UNAUTHORIZED)

            searchParams.delete('reason')
            setSearchParams(searchParams, { replace: true })
        }
    }, [searchParams, setSearchParams])

    const onFinish = async (values: AuthFormValues) => {
        setSubmitError(null)
        setLoading(true)
        try {
            if (isLoginMode) {
                const response = await apiClient.post('/auth/login', {
                    email: values.email,
                    password: values.password
                })
                localStorage.setItem('authToken', response.data.access_token)

                const redirectTo = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard'
                navigate(redirectTo, { replace: true })

            } else {
                const { confirm_password, ...registerData } = values
                await apiClient.post('/auth/register', registerData)

                navigate('/auth/login')
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (!error.response) {
                    setSubmitError(ERROR_MESSAGES.NETWORK_ERROR)
                    return
                }

                const responseStatus = error.response?.status
                const errData = error.response?.data as { message?: string; detail?: string; email?: string[]; non_field_errors?: string[] }

                if (responseStatus === 429) {
                    setSubmitError(ERROR_MESSAGES.TOO_MANY_REQUESTS)
                    return
                }

                if (responseStatus >= 500) {
                    setSubmitError(ERROR_MESSAGES.SERVER_ERROR)
                    return
                }

                if (isLoginMode) {
                    setSubmitError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
                    return
                }

                const rawMsg =
                    errData?.message ||
                    errData?.detail ||
                    (Array.isArray(errData?.email) ? errData.email[0] : '') ||
                    (Array.isArray(errData?.non_field_errors) ? errData.non_field_errors[0] : '')

                const isEmailDuplicate = rawMsg.toLowerCase().includes('email') || rawMsg.toLowerCase().includes('exist')

                setSubmitError(
                    isEmailDuplicate
                        ? 'البريد الإلكتروني مستخدم مسبقاً، يرجى تسجيل الدخول'
                        : (rawMsg || ERROR_MESSAGES.SERVER_ERROR)
                )
            } else {
                setSubmitError(ERROR_MESSAGES.UNKNOWN_ERROR)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout
            maxWidth={isLoginMode ? 460 : 720}
            title={isLoginMode ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            subtitle={isLoginMode ? 'مرحبًا بعودتك، سجل الدخول لمتابعة إدارة فواتيرك' : 'أنشئ حسابك للبدء بإدارة فواتيرك تلقائيًا'}
        >
            {submitError && (
                <div style={{ marginBottom: 20 }}>
                    <MainAlert alertMessage={submitError} alertType="error" closeAction={() => setSubmitError(null)} />
                </div>
            )}
            <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off" requiredMark={false}>
                {isLoginMode ? <LoginForm loading={loading} /> : <RegisterForm isMobile={window.innerWidth < 768} loading={loading} />}
            </Form>
        </AuthLayout>
    )
}

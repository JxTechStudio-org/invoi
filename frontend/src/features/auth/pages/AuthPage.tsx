import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Form } from 'antd'
import { apiClient } from '../../../services/api/client'
import { ERROR_MESSAGES } from '../../../errors/errorMassages'
import AuthLayout from '../components/AuthLayout'
import LoginForm from '../components/LoginForm'
import RegisterForm from '../components/RegisterForm'
import MainAlert from '../../shared/components/MainAlert'


export default function AuthPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const [form] = Form.useForm()
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [searchParams, setSearchParams] = useSearchParams()

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

    const onFinish = async (values: any) => {
        setSubmitError(null)
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
            setSubmitError(isLoginMode ? 'خطأ في تسجيل الدخول' : 'خطأ في إنشاء الحساب')
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
                {isLoginMode ? <LoginForm /> : <RegisterForm isMobile={window.innerWidth < 768} />}
            </Form>
        </AuthLayout>
    )
}

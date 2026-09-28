import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Form } from 'antd'
import AuthLayout from '../components/AuthLayout'
import LoginForm from '../components/LoginForm'
import RegisterForm from '../components/RegisterForm'
import MainAlert from '../../shared/components/MainAlert'
import { apiClient } from '../../../services/api/client'

export default function AuthPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const [form] = Form.useForm()
    const [submitError, setSubmitError] = useState<string | null>(null)

    const isLoginMode = location.pathname.includes('login')

    const onFinish = async (values: { email?: string; password?: string }) => {
        setSubmitError(null)
        try {
            if (isLoginMode) {
                const response = await apiClient.post('/auth/login', {
                    email: values.email,
                    password: values.password
                })
                localStorage.setItem('authToken', response.data.access_token)
                navigate('/dashboard')
            } else {
                navigate('/login')
            }
        } catch (error) {
            setSubmitError('خطأ في تسجيل الدخول')
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

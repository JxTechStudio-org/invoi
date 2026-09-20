import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Form } from 'antd'
import AuthLayout from '../components/AuthLayout'
import LoginForm from '../components/LoginForm'
import RegisterForm from '../components/RegisterForm'
import MainAlert from '../../shared/components/MainAlert'

export default function AuthPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const [form] = Form.useForm()
    const [submitError, setSubmitError] = useState<string | null>(null)

    const isLoginMode = location.pathname === '/login'

    const onFinish = async (values: unknown) => {
        setSubmitError(null)
        console.log('Success:', values)
        navigate(isLoginMode ? '/dashboard' : '/login')
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

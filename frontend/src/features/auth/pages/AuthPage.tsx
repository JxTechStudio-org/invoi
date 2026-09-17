import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Form, Input, Typography, Card, theme } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons'
import logoWordmark from '../../../assets/invoi-logo-wordmark.svg'
import MainButton from '../../shared/components/MainButton'
import MainAlert from '../../shared/components/MainAlert'

const { Title, Text } = Typography

interface RegisterFormValues {
    first_name: string
    last_name: string
    username: string
    phone: string
    email: string
    password: string
    confirm_password: string
}

interface LoginFormValues {
    email: string
    password: string
}

export default function AuthPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const { token } = theme.useToken()
    const [form] = Form.useForm()
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const currentPath = location.pathname
    const isLoginMode = currentPath === '/login'

    const onFinish = async (values: LoginFormValues | RegisterFormValues) => {
        setSubmitError(null)
        try {
            console.log('Success:', values)
            navigate(isLoginMode ? '/dashboard' : '/login')
        } catch {
            setSubmitError('حدث خطأ أثناء المعالجة. حاول مرة أخرى.')
        }
    }

    const onFinishFailed = () => {
        console.log('Failed: validation errors present')
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(${token.colorPrimaryBg})`,
                padding: '24px 16px'
            }}
        >
            <Card
                style={{
                    width: '100%',
                    maxWidth: isLoginMode ? 460 : 720,
                    borderRadius: 24,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    boxShadow: token.boxShadowSecondary,
                    transition: 'all 0.3s ease-in-out'
                }}
                styles={{ 
                    body: { 
                        padding: isMobile ? '28px 20px' : (isLoginMode ? '40px 36px' : '44px 48px') 
                    } 
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{ display: 'inline-block', marginBottom: 14 }}>
                        <img 
                            src={logoWordmark} 
                            alt="Invoi Logo" 
                            style={{ height: isMobile ? 32 : 38, objectFit: 'contain' }} 
                        />
                    </div>
                    <Title level={isMobile ? 4 : 3} style={{ margin: '0 0 6px 0', color: token.colorText, fontWeight: 700, letterSpacing: '-0.5px' }}>
                        {isLoginMode ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
                    </Title>
                    <Text type="secondary" style={{ fontSize: isMobile ? 13 : 14 }}>
                        {isLoginMode
                            ? 'مرحبًا بعودتك، سجل الدخول لمتابعة إدارة فواتيرك'
                            : 'أنشئ حسابك للبدء بإدارة فواتيرك تلقائيًا'}
                    </Text>
                </div>

                {submitError && (
                    <div style={{ marginBottom: 20 }}>
                        <MainAlert alertMessage={submitError} alertType="error" closeAction={() => setSubmitError(null)} />
                    </div>
                )}

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                    requiredMark={false}
                >
                    {!isLoginMode ? (
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                            gap: isMobile ? '0px' : '0 16px' 
                        }}>
                            <Form.Item
                                label={<span style={{ fontWeight: 500, color: token.colorTextSecondary }}>الاسم الأول</span>}
                                name="first_name"
                                validateTrigger="onChange"
                                rules={[
                                    { required: true, message: 'الرجاء إدخال الاسم الأول' },
                                    { pattern: /^[\u0621-\u064A\s]+$/, message: 'يجب إدخال أحرف عربية فقط' },
                                    {
                                        validator: (_, value) => {
                                            if (!value) return Promise.resolve()
                                            if (value.length < 2) {
                                                return Promise.reject(new Error('يجب أن يتكون الاسم من حرفين على الأقل'))
                                            }
                                            if (value.startsWith(' ') || value.endsWith(' ')) {
                                                return Promise.reject(new Error('يجب ألا يبدأ أو ينتهي الاسم بمسافة'))
                                            }
                                            return Promise.resolve()
                                        }
                                    }
                                ]}
                                hasFeedback
                            >
                                <Input placeholder="مثال: أحمد" style={{ height: 42, borderRadius: 10, backgroundColor: token.colorFillQuaternary, border: `1px solid ${token.colorBorderSecondary}` }} />
                            </Form.Item>

                            <Form.Item
                                label={<span style={{ fontWeight: 500, color: token.colorTextSecondary }}>الاسم الأخير</span>}
                                name="last_name"
                                validateTrigger="onChange"
                                rules={[
                                    { required: true, message: 'الرجاء إدخال الاسم الأخير' },
                                    { pattern: /^[\u0621-\u064A\s]+$/, message: 'يجب إدخال أحرف عربية فقط' },
                                    {
                                        validator: (_, value) => {
                                            if (!value) return Promise.resolve()
                                            if (value.length < 2) {
                                                return Promise.reject(new Error('يجب أن يتكون الاسم من حرفين على الأقل'))
                                            }
                                            if (value.startsWith(' ') || value.endsWith(' ')) {
                                                return Promise.reject(new Error('يجب ألا يبدأ أو ينتهي الاسم بمسافة'))
                                            }
                                            return Promise.resolve()
                                        }
                                    }
                                ]}
                                hasFeedback
                            >
                                <Input placeholder="مثال: العتيبي" style={{ height: 42, borderRadius: 10, backgroundColor: token.colorFillQuaternary, border: `1px solid ${token.colorBorderSecondary}` }} />
                            </Form.Item>

                            <Form.Item
                                label={<span style={{ fontWeight: 500, color: token.colorTextSecondary }}>اسم المستخدم (بالإنجليزية)</span>}
                                name="username"
                                validateTrigger="onChange"
                                rules={[
                                    { required: true, message: 'الرجاء إدخال اسم المستخدم' },
                                    {
                                        pattern: /^[A-Za-z0-9_]+$/,
                                        message: 'يجب إدخال أحرف إنجليزية أو أرقام أو شرطة سفلية فقط'
                                    },
                                    {
                                        validator: (_, value) => {
                                            if (!value) return Promise.resolve()
                                            if (value.length < 3) {
                                                return Promise.reject(new Error('يجب أن يتكون اسم المستخدم من 3 خانات على الأقل'))
                                            }
                                            return Promise.resolve()
                                        }
                                    }
                                ]}
                                hasFeedback
                            >
                                <Input prefix={<UserOutlined style={{ color: token.colorTextTertiary }} />} placeholder="ahmad_alotaibi" style={{ height: 42, borderRadius: 10, backgroundColor: token.colorFillQuaternary, border: `1px solid ${token.colorBorderSecondary}` }} />
                            </Form.Item>

                            <Form.Item
                                label={<span style={{ fontWeight: 500, color: token.colorTextSecondary }}>رقم الهاتف</span>}
                                name="phone"
                                initialValue="+966"
                                validateTrigger="onChange"
                                hasFeedback
                                rules={[
                                    { required: true, message: 'الرجاء إدخال رقم الهاتف' },
                                    {
                                        validator: (_, value) => {
                                            if (value && /[^\d+]/.test(value)) {
                                                return Promise.reject(new Error('يجب إدخال أرقام فقط'))
                                            }
                                            if (!value || value === '+966') return Promise.resolve()
                                            if (!value.startsWith('+9665')) {
                                                return Promise.reject(new Error('يجب أن يبدأ الرقم بـ 5 بعد الرمز الدولي'))
                                            }
                                            if (value.length !== 13) {
                                                return Promise.reject(new Error('يجب أن يتكون رقم الهاتف من 9 خانات بعد الرمز الدولي'))
                                            }
                                            return Promise.resolve()
                                        }
                                    }
                                ]}
                                normalize={(value) => {
                                    if (/[^\d+]/.test(value)) return value.substring(0, 14)
                                    let num = value.replace(/\D/g, '')
                                    if (!num) return '+966'
                                    if (num.startsWith('966')) num = num.substring(3)
                                    while (num.startsWith('0')) num = num.substring(1)
                                    return '+966' + num.substring(0, 9)
                                }}
                            >
                                <Input
                                    prefix={<PhoneOutlined style={{ color: token.colorTextTertiary }} />}
                                    placeholder="555555555"
                                    inputMode="numeric"
                                    maxLength={14}
                                    style={{ height: 42, borderRadius: 10, backgroundColor: token.colorFillQuaternary, border: `1px solid ${token.colorBorderSecondary}` }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Backspace' && e.currentTarget.value.length <= 4) {
                                            e.preventDefault()
                                        }
                                    }}
                                />
                            </Form.Item>

                            <Form.Item
                                label={<span style={{ fontWeight: 500, color: token.colorTextSecondary }}>البريد الإلكتروني</span>}
                                name="email"
                                style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}
                                validateTrigger="onChange"
                                rules={[
                                    { required: true, message: 'الرجاء إدخال البريد الإلكتروني' },
                                    {
                                        validator: (_, value) => {
                                            if (!value) return Promise.resolve()
                                            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
                                            if (!emailRegex.test(value)) {
                                                return Promise.reject(new Error('الرجاء إدخال بريد إلكتروني صحيح (مثال: example@gmail.com)'))
                                            }
                                            return Promise.resolve()
                                        }
                                    }
                                ]}
                                hasFeedback
                            >
                                <Input prefix={<MailOutlined style={{ color: token.colorTextTertiary }} />} placeholder="example@gmail.com" style={{ height: 42, borderRadius: 10, backgroundColor: token.colorFillQuaternary, border: `1px solid ${token.colorBorderSecondary}` }} />
                            </Form.Item>

                            <Form.Item
                                label={<span style={{ fontWeight: 500, color: token.colorTextSecondary }}>كلمة المرور</span>}
                                name="password"
                                validateTrigger="onChange"
                                rules={[
                                    { required: true, message: 'الرجاء إدخال كلمة المرور' },
                                    {
                                        validator: (_, value) => {
                                            if (!value) return Promise.resolve()
                                            if (value.includes(' ')) {
                                                return Promise.reject(new Error('يجب ألا تحتوي كلمة المرور على مسافات'))
                                            }
                                            if (value.length < 8) {
                                                return Promise.reject(new Error('يجب أن تتكون كلمة المرور من 8 خانات على الأقل'))
                                            }
                                            const passwordRegex = /^(?=\S+$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!\%*?&]).{8,}$/
                                            if (!passwordRegex.test(value)) {
                                                return Promise.reject(new Error('يجب أن تشمل كلمة المرور حرفًا صغيرًا وحرفًا كبيرًا ورقمًا ورمزًا خاصًا'))
                                            }
                                            return Promise.resolve()
                                        }
                                    }
                                ]}
                                hasFeedback
                            >
                                <Input.Password prefix={<LockOutlined style={{ color: token.colorTextTertiary }} />} placeholder="Password@12" style={{ height: 42, borderRadius: 10, backgroundColor: token.colorFillQuaternary, border: `1px solid ${token.colorBorderSecondary}` }} />
                            </Form.Item>

                            <Form.Item
                                label={<span style={{ fontWeight: 500, color: token.colorTextSecondary }}>تأكيد كلمة المرور</span>}
                                name="confirm_password"
                                dependencies={['password']}
                                validateTrigger="onChange"
                                rules={[
                                    { required: true, message: 'الرجاء تأكيد كلمة المرور' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('password') === value) {
                                                return Promise.resolve()
                                            }
                                            return Promise.reject(new Error('كلمتا المرور غير متطابقتين'))
                                        }
                                    })
                                ]}
                                hasFeedback
                            >
                                <Input.Password prefix={<LockOutlined style={{ color: token.colorTextTertiary }} />} placeholder="إعادة إدخال كلمة المرور" style={{ height: 42, borderRadius: 10, backgroundColor: token.colorFillQuaternary, border: `1px solid ${token.colorBorderSecondary}` }} />
                            </Form.Item>

                            <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2', marginTop: 12 }}>
                                <MainButton
                                    text="إنشاء الحساب"
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    style={{ height: 46, fontSize: 16, borderRadius: 10, fontWeight: 600 }}
                                />
                                <Text style={{ display: 'block', textAlign: 'center', marginTop: 20, fontSize: 14 }}>
                                    عندك حساب بالفعل؟{' '}
                                    <Link to="/login" style={{ color: token.colorPrimary, fontWeight: 600 }}>
                                        سجل الدخول
                                    </Link>
                                </Text>
                            </div>
                        </div>
                    ) : (
                        <>
                            <Form.Item
                                label={<span style={{ fontWeight: 500, color: token.colorTextSecondary }}>البريد الإلكتروني</span>}
                                name="email"
                                validateTrigger="onChange"
                                rules={[
                                    { required: true, message: 'الرجاء إدخال البريد الإلكتروني' },
                                    {
                                        validator: (_, value) => {
                                            if (!value) return Promise.resolve()
                                            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
                                            if (!emailRegex.test(value)) {
                                                return Promise.reject(new Error('الرجاء إدخال بريد إلكتروني صحيح (مثال: example@gmail.com)'))
                                            }
                                            return Promise.resolve()
                                        }
                                    }
                                ]}
                                hasFeedback
                            >
                                <Input prefix={<MailOutlined style={{ color: token.colorTextTertiary }} />} placeholder="example@gmail.com" style={{ height: 44, borderRadius: 10, backgroundColor: token.colorFillQuaternary, border: `1px solid ${token.colorBorderSecondary}` }} />
                            </Form.Item>

                            <Form.Item
                                label={<span style={{ fontWeight: 500, color: token.colorTextSecondary }}>كلمة المرور</span>}
                                name="password"
                                validateTrigger="onChange"
                                rules={[
                                    { required: true, message: 'الرجاء إدخال كلمة المرور' },
                                    {
                                        validator: (_, value) => {
                                            if (!value) return Promise.resolve()
                                            if (value.includes(' ')) {
                                                return Promise.reject(new Error('يجب ألا تحتوي كلمة المرور على مسافات'))
                                            }
                                            if (value.length < 8) {
                                                return Promise.reject(new Error('يجب أن تتكون كلمة المرور من 8 خانات على الأقل'))
                                            }
                                            const passwordRegex = /^(?=\S+$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!\%*?&]).{8,}$/
                                            if (!passwordRegex.test(value)) {
                                                return Promise.reject(new Error('يجب أن تشمل كلمة المرور حرفًا صغيرًا وحرفًا كبيرًا ورقمًا ورمزًا خاصًا'))
                                            }
                                            return Promise.resolve()
                                        }
                                    }
                                ]}
                                hasFeedback
                            >
                                <Input.Password prefix={<LockOutlined style={{ color: token.colorTextTertiary }} />} placeholder="Ex: Password@12" style={{ height: 44, borderRadius: 10, backgroundColor: token.colorFillQuaternary, border: `1px solid ${token.colorBorderSecondary}` }} />
                            </Form.Item>

                            <div style={{ textAlign: 'left', marginBottom: 24 }}>
                                <Link to="/forgot-password" style={{ color: token.colorPrimary, fontSize: 14, fontWeight: 500 }}>
                                    نسيت كلمة المرور؟
                                </Link>
                            </div>

                            <MainButton
                                text="تسجيل الدخول"
                                type="primary"
                                htmlType="submit"
                                block
                                style={{ height: 46, fontSize: 16, borderRadius: 10, fontWeight: 600 }}
                            />

                            <Text style={{ display: 'block', textAlign: 'center', marginTop: 24, fontSize: 14 }}>
                                ما عندك حساب؟{' '}
                                <Link to="/register" style={{ color: token.colorPrimary, fontWeight: 600 }}>
                                    سجل الآن
                                </Link>
                            </Text>
                        </>
                    )}
                </Form>
            </Card>
        </div>
    )
}

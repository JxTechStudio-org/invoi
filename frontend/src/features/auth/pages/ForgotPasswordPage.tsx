import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Alert, Form, Input, Typography, Card, theme } from 'antd'
import { MailOutlined } from '@ant-design/icons'
import logoWordmark from '../../../assets/invoi-logo-wordmark.svg'
import MainButton from '../../shared/components/MainButton'
import MainAlert from '../../shared/components/MainAlert'

const { Title, Text } = Typography

export default function ForgotPasswordPage() {
    const { token } = theme.useToken()
    const [form] = Form.useForm()
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [isUnavailable, setIsUnavailable] = useState(false)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // There is no password-reset endpoint yet (roadmap phase 2), so say so instead of faking success.
    const onFinish = () => {
        setSubmitError(null)
        setIsUnavailable(true)
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
                    maxWidth: 460,
                    borderRadius: 24,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    boxShadow: token.boxShadowSecondary,
                    transition: 'all 0.3s ease-in-out'
                }}
                styles={{ 
                    body: { 
                        padding: isMobile ? '28px 20px' : '40px 36px' 
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
                        استعادة كلمة المرور
                    </Title>
                    <Text type="secondary" style={{ fontSize: isMobile ? 13 : 14 }}>
                        أدخل بريدك الإلكتروني وسنرسل لك تعليمات استعادة الحساب
                    </Text>
                </div>

                {submitError && (
                    <div style={{ marginBottom: 20 }}>
                        <MainAlert alertMessage={submitError} alertType="error" closeAction={() => setSubmitError(null)} />
                    </div>
                )}

                {isUnavailable && (
                    <Alert
                        type="info"
                        showIcon
                        style={{ marginBottom: 20 }}
                        title="استعادة كلمة المرور غير متاحة حاليًا"
                        description="نعمل على إتاحة هذه الخدمة قريبًا. للمساعدة في استعادة حسابك تواصل مع فريق الدعم."
                    />
                )}

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    autoComplete="off"
                    requiredMark={false}
                >
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

                    <div style={{ marginTop: 40 , display:'flex' , justifyContent:'center' , alignItems:'center ' }}>
                        <MainButton
                            text="إرسال تعليمات الاستعادة"
                            type="primary"
                            htmlType="submit"
                            block
                            style={{ height: 46, fontSize: 16, borderRadius: 10, fontWeight: 600 }}
                        />
                    </div>

                    <Text style={{ display: 'block', textAlign: 'center', marginTop: 24, fontSize: 14 }}>
                        تذكرت كلمة المرور؟{' '}
                        <Link to="/auth/login" style={{ color: token.colorPrimary, fontWeight: 600 }}>
                            سجل الدخول
                        </Link>
                    </Text>
                </Form>
            </Card>
        </div>
    )
}

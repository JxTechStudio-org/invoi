import { Form, Typography, theme } from 'antd'
import { Link } from 'react-router-dom'
import MainButton from '../../shared/components/MainButton'
import NameFields from './NameFields'
import UsernameField from './UsernameField'
import BusinessNameField from './BusinessNameField'
import PhoneField from './PhoneField'
import EmailField from './EmailField'
import PasswordField from './PasswordField'
import ConfirmPasswordField from './ConfirmPasswordField'

const { Text } = Typography

interface RegisterFormProps {
    isMobile: boolean
}

export default function RegisterForm({ isMobile }: RegisterFormProps) {
    const { token } = theme.useToken()

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                columnGap: 20,
                rowGap: 4
            }}
        >
            <NameFields isMobile={isMobile} />

            <UsernameField />
            <PhoneField />

            <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                <BusinessNameField isMobile={isMobile} />
            </div>

            <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                <EmailField />
            </div>

            <PasswordField placeholder="Password@12" />
            <ConfirmPasswordField />

            <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2', marginTop: 16 }}>
                <MainButton
                    text="إنشاء الحساب"
                    type="primary"
                    htmlType="submit"
                    block
                    style={{ height: 46, fontSize: 16, borderRadius: 10, fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center ' }}
                />
                <Text style={{ display: 'block', textAlign: 'center', marginTop: 20, fontSize: 14 }}>
                    عندك حساب بالفعل؟{' '}
                    <Link to="/auth'/login" style={{ color: token.colorPrimary, fontWeight: 600 }}>
                        سجل الدخول
                    </Link>
                </Text>
            </div>
        </div>
    )
}

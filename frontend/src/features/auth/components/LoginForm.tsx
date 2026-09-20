import { Typography, theme } from 'antd'
import { Link } from 'react-router-dom'
import MainButton from '../../shared/components/MainButton'
import EmailField from './EmailField'
import PasswordField from './PasswordField'

const { Text } = Typography

export default function LoginForm() {
    const { token } = theme.useToken()

    return (
        <>
            <EmailField />
            <PasswordField placeholder="Ex: Password@12" />

            <div style={{ textAlign: 'left', marginBottom: 24 }}>
                <Link to="/auth'/forgot-password" style={{ color: token.colorPrimary, fontSize: 14, fontWeight: 500 }}>
                    نسيت كلمة المرور؟
                </Link>
            </div>

            <MainButton text="تسجيل الدخول" type="primary" htmlType="submit" block style={{ height: 46, fontSize: 16, borderRadius: 10, fontWeight: 600 }} />

            <Text style={{ display: 'block', textAlign: 'center', marginTop: 24, fontSize: 14 }}>
                لا يوجد لديك حساب؟{' '}
                <Link to="/auth'/register" style={{ color: token.colorPrimary, fontWeight: 600 }}>
                    سجل الآن
                </Link>
            </Text>
        </>
    )
}

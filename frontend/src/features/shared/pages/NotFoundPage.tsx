import { useNavigate } from 'react-router-dom'
import { theme } from 'antd'
import { FileSearchOutlined, HomeOutlined, ArrowRightOutlined } from '@ant-design/icons'
import MainButton from '../components/MainButton'

export default function NotFoundPage() {
    const { token } = theme.useToken()
    const navigate = useNavigate()

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: token.colorBgLayout,
                padding: '24px',
                textAlign: 'center',
                boxSizing: 'border-box', // لضمان احتساب الحشو ضمن العرض الكلي لتجنب أي انزياح
                margin: 0
            }}
        >
            <div
                style={{
                    position: 'relative',
                    width: 110,
                    height: 110,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: token.colorPrimaryBg,
                    boxShadow: `0 0 0 8px ${token.colorPrimaryBgHover}`,
                    marginBottom: 32,
                }}
            >
                <FileSearchOutlined 
                    style={{ 
                        fontSize: 48, 
                        color: token.colorPrimary 
                    }} 
                />
            </div>
            <div
                style={{
                    fontSize: 72,
                    fontWeight: 800,
                    color: token.colorTextHeading,
                    letterSpacing: '-2px',
                    lineHeight: 1,
                    marginBottom: 12
                }}
            >
                404
            </div>

            <h2
                style={{
                    fontSize: 22,
                    fontWeight: 600,
                    color: token.colorText,
                    margin: '0 0 12px'
                }}
            >
                الصفحة غير موجودة
            </h2>

            <p
                style={{
                    fontSize: 15,
                    color: token.colorTextSecondary,
                    maxWidth: 420,
                    lineHeight: 1.7,
                    marginBottom: 36
                }}
            >
                يبدو أن الرابط الذي تحاول الوصول إليه غير صحيح، أو أن الصفحة قد تم نقلها أو حذفها.
            </p>
            <div 
                style={{ 
                    display: 'flex', 
                    gap: 16, 
                    flexWrap: 'wrap', 
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    maxWidth: 400
                }}
            >
                <MainButton 
                    text="العودة للخلف" 
                    type="default" 
                    icon={<ArrowRightOutlined />} 
                    onClick={() => navigate(-1)} 
                />
                <MainButton 
                    text="الذهاب للوحة التحكم" 
                    type="primary" 
                    icon={<HomeOutlined />} 
                    onClick={() => navigate('/dashboard')} 
                />
            </div>
        </div>
    )
}

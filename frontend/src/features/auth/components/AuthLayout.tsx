import { Card, theme } from 'antd'
import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import logoWordmark from '../../../assets/invoi-logo-wordmark.svg'

interface AuthLayoutProps {
    maxWidth: number
    title: string
    subtitle: string
    children: ReactNode
}

export default function AuthLayout({ maxWidth, title, subtitle, children }: AuthLayoutProps) {
    const { token } = theme.useToken()
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

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
                    maxWidth,
                    borderRadius: 24,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    boxShadow: token.boxShadowSecondary,
                    transition: 'all 0.3s ease-in-out'
                }}
                styles={{ body: { padding: isMobile ? '28px 20px' : '40px 36px' } }}
            >
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{ display: 'inline-block', marginBottom: 14 }}>
                        <img src={logoWordmark} alt="Invoi Logo" style={{ height: isMobile ? 32 : 38, objectFit: 'contain' }} />
                    </div>
                    <h2 style={{ margin: '0 0 6px 0', color: token.colorText, fontWeight: 700, fontSize: isMobile ? 20 : 24, letterSpacing: '-0.5px' }}>
                        {title}
                    </h2>
                    <p style={{ color: token.colorTextSecondary, fontSize: isMobile ? 13 : 14, margin: 0 }}>{subtitle}</p>
                </div>
                {children}
            </Card>
        </div>
    )
}

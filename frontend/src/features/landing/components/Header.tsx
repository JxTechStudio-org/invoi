import React, { useState } from 'react';
import { Image, ConfigProvider, Button } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import logoWordmark from '../../../assets/invoi-logo-wordmark.svg';

const navLinks = [
    { name: 'الرئيسية', href: '#home' },
    { name: 'المميزات', href: '#features' },
    { name: 'كيف يعمل', href: '#how-it-works' },
    { name: 'الأسئلة الشائعة', href: '#faq' },
    
];

export const Header = () => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <ConfigProvider
            direction="rtl"
            theme={{
                token: {
                    colorPrimary: '#10B981',
                    fontFamily: "'IBM Plex Sans Arabic', 'Inter', sans-serif",
                    borderRadius: 6,
                },
            }}
        >
            <header
                style={{
                    width: '100%',
                    backgroundColor: '#FFFFFF',
                    borderBottom: '1px solid #CBD5E1',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    boxSizing: 'border-box'
                }}
            >
                <div
                    style={{
                        maxWidth: '1440px',
                        margin: '0 auto',
                        padding: '16px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '16px'
                    }}
                >
                    {/* invoi logo */}
                    <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <Image src={logoWordmark} alt="invoi logo" preview={false} width={85} />
                    </div>

                    {/* navbar links */}
                    <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                style={{
                                    color: '#64748B',
                                    textDecoration: 'none',
                                    fontSize: '15px',
                                    fontWeight: 500,
                                    transition: 'color 0.2s ease',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#10B981')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
                            >
                                {link.name}
                            </a>
                        ))}
                    </nav>

                    {/* login icon button*/}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<UserOutlined style={{ fontSize: '16px' }} />}
                            title="تسجيل الدخول"
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            style={{
                                backgroundColor: isHovered ? '#059669' : '#10B981',
                                borderColor: isHovered ? '#059669' : '#10B981',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: isHovered ? '0 6px 12px -2px rgba(16, 185, 129, 0.4)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
                                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                                transition: 'all 0.3s ease'
                            }}
                        />
                    </div>
                </div>
            </header>
        </ConfigProvider>
    );
};
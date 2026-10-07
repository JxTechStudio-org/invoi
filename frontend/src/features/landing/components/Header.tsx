import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, Button, Drawer } from 'antd';
import { UserOutlined, MenuOutlined } from '@ant-design/icons';
import logoWordmark from '../../../assets/invoi-logo-wordmark.svg';
import MainButton from '../../shared/components/MainButton';

const navLinks = [
    { name: 'الرئيسية', href: '#home' },
    { name: 'المميزات', href: '#features' },
    { name: 'كيف يعمل', href: '#how-it-works' },
    { name: 'الأسئلة الشائعة', href: '#faq' },
];

export const Header = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const isLoggedIn = Boolean(localStorage.getItem('authToken'));

    const handleUserAction = () => {
        navigate(isLoggedIn ? '/dashboard' : '/auth/login');
    };

    return (
        <header
            style={{
                width: '100%',
                backgroundColor: 'var(--bg-container)',
                borderBottom: '1px solid var(--border-color)',
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
                    boxSizing: 'border-box',
                    direction: 'rtl' // ضمان اتجاه العناصر يمين ويسار بشكل صحيح
                }}
            >
                {/* 1. invoi logo (يمين في الديسكتوب والجوال) */}
                <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <Image src={logoWordmark} alt="invoi logo" preview={false} width={85} />
                </div>

                {/* 2. navbar links - Desktop */}
                <nav
                    className="desktop-nav"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '32px'
                    }}
                >
                    {navLinks.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            style={{
                                color: 'var(--text-secondary)',
                                textDecoration: 'none',
                                fontSize: '15px',
                                fontWeight: 500,
                                transition: 'color 0.2s ease',
                                fontFamily: 'var(--sans)'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--emerald-500)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                        >
                            {link.name}
                        </a>
                    ))}
                </nav>

                {/* 3. Actions & Hamburger (يسار في الديسكتوب والجوال) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="desktop-user-btn">
                        <MainButton
                            text={isLoggedIn ? "لوحة التحكم" : "تسجيل الدخول"}
                            type="primary"
                            icon={<UserOutlined style={{ fontSize: '16px' }} />}
                            onClick={handleUserAction}
                            style={{
                                height: '40px',
                                paddingInline: '16px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                            }}
                        />
                    </div>

                    <div className="mobile-user-btn">
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<UserOutlined style={{ fontSize: '16px' }} />}
                            title={isLoggedIn ? "لوحة التحكم" : "تسجيل الدخول"}
                            onClick={handleUserAction}
                            style={{
                                backgroundColor: 'var(--emerald-500)',
                                borderColor: 'var(--emerald-500)',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                            }}
                        />
                    </div>

                    {/* Hamburger Button for Mobile */}
                    <Button
                        className="mobile-menu-btn"
                        type="text"
                        icon={<MenuOutlined style={{ fontSize: '20px', color: 'var(--text-primary)' }} />}
                        onClick={() => setMobileMenuOpen(true)}
                        style={{ display: 'none', padding: '4px' }}
                    />
                </div>
            </div>

            {/* Mobile Drawer Menu */}
            <Drawer
                title="القائمة"
                placement="right"
                onClose={() => setMobileMenuOpen(false)}
                open={mobileMenuOpen}
                styles={{ body: { padding: '24px' } }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {navLinks.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            onClick={() => setMobileMenuOpen(false)}
                            style={{
                                color: 'var(--text-primary)',
                                textDecoration: 'none',
                                fontSize: '18px',
                                fontWeight: 600,
                                fontFamily: 'var(--sans)'
                            }}
                        >
                            {link.name}
                        </a>
                    ))}
                </div>
            </Drawer>

            <style>{`
                .mobile-menu-btn,
                .mobile-user-btn {
                    display: none !important;
                }
                .desktop-user-btn {
                    display: block;
                }

                @media (max-width: 768px) {
                    .desktop-nav,
                    .desktop-user-btn {
                        display: none !important;
                    }
                    .mobile-menu-btn,
                    .mobile-user-btn {
                        display: flex !important;
                    }
                }
            `}</style>
        </header>
    );
};
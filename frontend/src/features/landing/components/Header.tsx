import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Image, Button, Drawer } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import logoWordmark from '../../../assets/invoi-logo-wordmark.svg';
import { hasAuthToken } from '../utils/auth';

// "/#..." so the links also work from other public pages (e.g. the privacy policy).
const navLinks = [
    { name: 'الرئيسية', href: '/#home' },
    { name: 'لمن هذا المنتج', href: '/#for-whom' },
    { name: 'المميزات', href: '/#features' },
    { name: 'التحقق من الفواتير', href: '/#verification' },
    { name: 'كيف يعمل', href: '/#how-it-works' },
    { name: 'الأسئلة الشائعة', href: '/#faq' },
];

export const Header = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const isLoggedIn = hasAuthToken();

    const go = (path: string) => {
        setMobileMenuOpen(false);
        navigate(path);
    };

    const actions = (stacked: boolean) => (
        <div style={{ display: 'flex', flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'stretch' : 'center', gap: '12px' }}>
            {isLoggedIn ? (
                <Button type="primary" onClick={() => go('/dashboard')} style={{ fontWeight: 600 }}>
                    لوحة التحكم
                </Button>
            ) : (
                <>
                    <Button onClick={() => go('/auth/login')} style={{ fontWeight: 600 }}>
                        تسجيل الدخول
                    </Button>
                    <Button type="primary" onClick={() => go('/auth/register')} style={{ fontWeight: 600 }}>
                        إنشاء حساب
                    </Button>
                </>
            )}
        </div>
    );

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
                    padding: '16px clamp(16px, 4vw, 24px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    boxSizing: 'border-box',
                    direction: 'rtl' // ضمان اتجاه العناصر يمين ويسار بشكل صحيح
                }}
            >
                {/* 1. invoi logo (يمين في الديسكتوب والجوال) */}
                <Link to="/" aria-label="invoi" style={{ display: 'flex', alignItems: 'center' }}>
                    <Image src={logoWordmark} alt="invoi" preview={false} width={85} />
                </Link>

                {/* 2. navbar links - Desktop */}
                <nav
                    className="desktop-nav"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'clamp(16px, 2vw, 28px)'
                    }}
                >
                    {navLinks.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            className="landing-nav-link"
                        >
                            {link.name}
                        </a>
                    ))}
                </nav>

                {/* 3. Actions & Hamburger (يسار في الديسكتوب والجوال) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="desktop-actions">{actions(false)}</div>

                    {/* Hamburger Button for Mobile */}
                    <Button
                        className="mobile-menu-btn"
                        type="text"
                        icon={<MenuOutlined style={{ fontSize: '20px', color: 'var(--text-primary)' }} />}
                        aria-label="القائمة"
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
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                        {actions(true)}
                    </div>
                </div>
            </Drawer>

            {/* CSS لتنظيم ظهور وإخفاء القائمة في الموبايل */}
            <style>{`
                .mobile-menu-btn {
                    display: none;
                }
                .landing-nav-link {
                    color: var(--text-secondary);
                    text-decoration: none;
                    font-size: 15px;
                    font-weight: 500;
                    white-space: nowrap;
                    transition: color 0.2s ease;
                    font-family: var(--sans);
                    border-radius: 4px;
                }
                .landing-nav-link:hover,
                .landing-nav-link:focus-visible {
                    color: var(--emerald-700);
                }
                .landing-nav-link:focus-visible {
                    outline: 2px solid var(--emerald-500);
                    outline-offset: 4px;
                }
                @media (max-width: 1100px) {
                    .desktop-nav {
                        display: none !important;
                    }
                    .mobile-menu-btn {
                        display: flex !important;
                    }
                }
                @media (max-width: 480px) {
                    .desktop-actions {
                        display: none;
                    }
                }
            `}</style>
        </header>
    );
};

import { Layout, Flex, theme, Switch, Drawer, Button } from 'antd'
import { NavLink, Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { SunOutlined, MoonOutlined, MenuOutlined } from '@ant-design/icons'
import { useThemeMode } from '../context/themContext'
import logoWordmark from '../../../assets/invoi-logo-wordmark.svg'
import MainButton from './MainButton'

const { Header, Content } = Layout
const { useToken } = theme

interface NavLinkItem {
    label: string
    path: string
}

const navLinks: NavLinkItem[] = [
    { label: 'لوحة التحكم', path: '/dashboard' },
    { label: 'الفواتير', path: '/invoices' },
    { label: 'الموردون', path: '/vendors' },
    { label: 'التحليلات', path: '/analytics' },
    { label: 'الإعدادات', path: '/settings' }
]

export default function NavBar() {
    const { token } = useToken()
    const { mode, toggleTheme } = useThemeMode()
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [drawerOpen, setDrawerOpen] = useState(false)

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return (
        <Layout style={{ minHeight: '100vh', background: token.colorBgLayout, width: '100%', margin: 0, padding: 0 }}>
            <Header
                style={{
                    background: token.colorBgContainer,
                    borderBottom: `1px solid ${token.colorBorder}`,
                    padding: '0 24px',
                    height: 72,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1000,
                    transition: 'background 0.3s, border-color 0.3s',
                    width: '100vw',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    margin: 0
                }}
            >
                <img src={logoWordmark} alt="Invoi" style={{ height: 28 }} />

                {!isMobile ? (
                    <Flex gap={28} align="center" style={{ height: '100%' }}>
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                style={({ isActive }) => ({
                                    fontSize: 15,
                                    fontWeight: 500,
                                    color: isActive ? token.colorPrimary : token.colorTextSecondary,
                                    textDecoration: 'none',
                                    transition: 'color 0.2s',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    position: 'relative',
                                    borderBottom: 'none',
                                    ...(isActive && {
                                        boxShadow: `inset 0 -2px 0 0 ${token.colorPrimary}`
                                    })
                                })}
                            >
                                {link.label}
                            </NavLink>
                        ))}
                    </Flex>
                ) : null}

                {!isMobile ? (
                    <Flex align="center" gap={16}>
                        <Switch
                            checked={mode === 'dark'}
                            onChange={toggleTheme}
                            checkedChildren={<MoonOutlined />}
                            unCheckedChildren={<SunOutlined />}
                        />
                        <MainButton text="+ رفع فاتورة" type="primary" />
                    </Flex>
                ) : (
                    /* تحسين أفضل الممارسات للجوال: وضع الـ Switch بجانب زر القائمة أو ترتيبها بمنطقة Header بشكل مريح */
                    <Flex align="center" gap={12}>
                        <Switch
                            checked={mode === 'dark'}
                            onChange={toggleTheme}
                            checkedChildren={<MoonOutlined />}
                            unCheckedChildren={<SunOutlined />}
                        />
                        <Button
                            type="text"
                            icon={<MenuOutlined style={{ fontSize: 20 }} />}
                            onClick={() => setDrawerOpen(true)}
                        />
                    </Flex>
                )}
            </Header>

            <Drawer
                title="القائمة"
                placement="right"
                onClose={() => setDrawerOpen(false)}
                open={drawerOpen}
                bodyStyle={{ padding: 16 }}
            >
                <Flex vertical gap={16}>
                    {/* في وضع الجوال، وضع زر "رفع فاتورة" في أعلى القائمة الجانبية يمنح تجربة استخدام أفضل (UX) لأنه إجراء رئيسي */}
                    <div style={{ marginBottom: 10 }}>
                        <MainButton text="+ رفع فاتورة" type="primary" />
                    </div>

                    {navLinks.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            onClick={() => setDrawerOpen(false)}
                            style={({ isActive }) => ({
                                fontSize: 16,
                                fontWeight: 500,
                                color: isActive ? token.colorPrimary : token.colorTextSecondary,
                                textDecoration: 'none',
                                padding: '8px 0'
                            })}
                        >
                            {link.label}
                        </NavLink>
                    ))}
                </Flex>
            </Drawer>

            <Content style={{ padding: '24px 32px', background: token.colorBgLayout, width: '100%', boxSizing: 'border-box' }}>
                <Outlet />
            </Content>
        </Layout>
    )
}


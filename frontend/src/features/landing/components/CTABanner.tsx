import React, { useState } from 'react';
import { Typography, ConfigProvider } from 'antd';
import { ArrowLeftOutlined, CheckOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const defaultFeatures = [
    "استخراج ذكي وسريع للفواتير",
    "تحكم كامل",
    "أمان عالي",
    "دعم للغتين العربية والإنجليزية",
];

export const CtaBanner: React.FC = () => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <ConfigProvider
            direction="rtl"
            theme={{
                token: {
                    colorPrimary: '#10B981',
                    fontFamily: "'IBM Plex Sans Arabic', 'Inter', sans-serif",
                    borderRadius: 8,
                },
            }}
        >
            <section style={{ padding: '80px 24px', backgroundColor: '#F8FAFC', direction: 'rtl' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: '100%', maxWidth: '1024px' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '32px',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: '16px',
                                    padding: '40px 48px',
                                    border: '1px solid #E2E8F0',
                                    boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)'
                                }}
                            >
                                {/* الجانب الأيمن: العنوان، الوصف والزر */}
                                <div style={{ flex: 1 }}>
                                    <Title
                                        level={3}
                                        style={{
                                            fontSize: '28px',
                                            fontWeight: 700,
                                            color: '#0F172A',
                                            marginBottom: '12px',
                                            fontFamily: 'IBM Plex Sans Arabic, sans-serif'
                                        }}
                                    >
                                        جاهز لتجربة استخراج الفواتير بذكاء؟
                                    </Title>
                                    <Paragraph
                                        style={{
                                            fontSize: '16px',
                                            color: '#64748B',
                                            marginBottom: '24px',
                                            fontFamily: 'IBM Plex Sans Arabic, sans-serif',
                                            lineHeight: '1.6'
                                        }}
                                    >
                                        انضم إلينا اليوم وابدأ في أتمتة إدارة فواتيرك بدقة عالية وسرعة فائقة بكل سهولة.
                                    </Paragraph>
                                    <button
                                        onMouseEnter={() => setIsHovered(true)}
                                        onMouseLeave={() => setIsHovered(false)}
                                        style={{
                                            backgroundColor: isHovered ? '#059669' : '#10B981',
                                            color: '#FFFFFF',
                                            border: 'none',
                                            height: '46px',
                                            paddingInline: '28px',
                                            fontSize: '15px',
                                            fontWeight: 600,
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            transition: 'all 0.2s ease',
                                            fontFamily: 'IBM Plex Sans Arabic, sans-serif'
                                        }}
                                    >
                                        <span>ابدأ الآن</span>
                                        <ArrowLeftOutlined style={{ transition: 'transform 0.2s ease', transform: isHovered ? 'translateX(-4px)' : 'none' }} />
                                    </button>
                                </div>

                                {/* الجانب الأيسر: قائمة المميزات */}
                                <div style={{ width: '350px' }}>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {defaultFeatures.map((item, idx) => (
                                            <li
                                                key={idx}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    fontSize: '14px',
                                                    fontWeight: 500,
                                                    color: '#334155',
                                                    fontFamily: 'IBM Plex Sans Arabic, sans-serif'
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: '20px',
                                                        height: '20px',
                                                        borderRadius: '50%',
                                                        backgroundColor: '#ECFDF5',
                                                        color: '#10B981',
                                                        marginLeft: '12px',
                                                        flexShrink: 0,
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    <CheckOutlined />
                                                </span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </ConfigProvider>
    );
};
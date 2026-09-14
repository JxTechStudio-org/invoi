import React from 'react';
import { Button, Typography } from 'antd';
import { ArrowLeftOutlined, CheckOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const defaultFeatures = [
    "استخراج ذكي وسريع للفواتير",
    "تحكم كامل",
    "أمان عالي",
    "دعم للغتين العربية والإنجليزية",
];

export const CTABanner: React.FC = () => {
    return (
        <section style={{ padding: '80px 24px', backgroundColor: 'var(--bg-main)', direction: 'rtl' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '100%', maxWidth: '1024px' }}>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                flexWrap: 'wrap', // يسمح للعناصر بالنزول تحت بعضها بسلاسة في الشاشات الصغيرة
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '32px',
                                backgroundColor: 'var(--bg-container)',
                                borderRadius: '16px',
                                padding: '40px 48px',
                                border: '1px solid var(--border-color)',
                                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)'
                            }}
                        >
                            {/* الجانب الأيمن: العنوان، الوصف والزر */}
                            <div style={{ flex: '1 1 300px' }}>
                                <Title
                                    level={3}
                                    style={{
                                        fontSize: 'clamp(22px, 4vw, 28px)', // حجم خط متجاوب يمنع تكسر الكلمات بشكل مزعج
                                        fontWeight: 700,
                                        color: 'var(--text-primary)',
                                        marginBottom: '12px',
                                        fontFamily: 'var(--sans)',
                                        wordBreak: 'normal'
                                    }}
                                >
                                    جاهز لتجربة استخراج الفواتير بذكاء؟
                                </Title>
                                <Paragraph
                                    style={{
                                        fontSize: '16px',
                                        color: 'var(--text-secondary)',
                                        marginBottom: '24px',
                                        fontFamily: 'var(--sans)',
                                        lineHeight: '1.6'
                                    }}
                                >
                                    انضم إلينا اليوم وابدأ في أتمتة إدارة فواتيرك بدقة عالية وسرعة فائقة بكل سهولة.
                                </Paragraph>
                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<ArrowLeftOutlined />}
                                    style={{
                                        height: '40px',
                                        paddingInline: '24px',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                        borderRadius: '8px'
                                    }}
                                >
                                    ابدأ الآن
                                </Button>
                            </div>

                            {/* الجانب الأيسر: قائمة المميزات */}
                            <div style={{ flex: '1 1 280px', maxWidth: '350px' }}>
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
                                                fontFamily: 'var(--sans)'
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
                                                    color: 'var(--emerald-500)',
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
    );
};
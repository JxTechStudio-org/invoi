import React from 'react';
import { Typography, Card, Row, Col } from 'antd';
import { ThunderboltOutlined, LockOutlined, AppstoreOutlined, SafetyCertificateOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export default function Features() {
    const featuresList = [
        {
            icon: <ThunderboltOutlined style={{ fontSize: '28px', color: 'var(--emerald-500)' }} />,
            title: 'استخراج ذكي وسريع',
            description: 'تخلص من الأخطاء البشرية والإدخال اليدوي.',
        },
        {
            icon: <LockOutlined style={{ fontSize: '28px', color: 'var(--emerald-500)' }} />,
            title: 'تحكم كامل',
            description: 'راجع وعدل أي تفاصيل بكل مرونة.',
        },
        {
            icon: <AppstoreOutlined style={{ fontSize: '28px', color: 'var(--emerald-500)' }} />,
            title: 'معالجة كميات كبيرة',
            description: 'مثالية للشركات التي تتعامل مع مئات الفواتير يومياً.',
        },
        {
            icon: <SafetyCertificateOutlined style={{ fontSize: '28px', color: 'var(--emerald-500)' }} />,
            title: 'دعم وموثوقية',
            description: 'أمان عالي ودعم كامل لكافة أنواع الملفات.',
        },
    ];

    return (
        <section id="features" style={{ padding: '96px 0', background: 'var(--bg-main)', direction: 'rtl' }}>
            <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 48px', boxSizing: 'border-box' }}>

                <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                    <Title
                        level={2}
                        style={{
                            fontSize: '32px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            marginBottom: '12px',
                            fontFamily: 'var(--sans)',
                        }}
                    >
                        مميزات invoi
                    </Title>
                    <Paragraph
                        style={{
                            fontSize: '16px',
                            color: 'var(--var(--text-secondary))',
                            fontFamily: 'var(--sans)',
                        }}
                    >
                        كل ما تحتاجه لاستخراج بيانات الفواتير بسهولة وكفاءة
                    </Paragraph>
                </div>

                <Row gutter={[24, 24]} justify="center">
                    {featuresList.map((item, index) => (
                        <Col xs={24} sm={12} lg={6} key={index}>
                            <Card
                                variant="borderless"
                                style={{
                                    background: ' var(--bg-container)',
                                    borderRadius: '12px',
                                    height: '100%',
                                    textAlign: 'center',
                                    border: '1px solid var(-border-color)',
                                    boxSizing: 'border-box',
                                }}
                                styles={{body:{ padding: '32px 24px'} }}
                            >
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    background: '#ECFDF5',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 20px auto'
                                }}>
                                    {item.icon}
                                </div>

                                <Title
                                    level={4}
                                    style={{
                                        fontSize: '18px',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        marginBottom: '12px',
                                        fontFamily: 'var(--sans)',
                                    }}
                                >
                                    {item.title}
                                </Title>

                                <Paragraph
                                    style={{
                                        fontSize: '14px',
                                        color: 'var(--var(--text-secondary))',
                                        margin: 0,
                                        lineHeight: 1.5,
                                        fontFamily: 'var(--sans)',
                                    }}
                                >
                                    {item.description}
                                </Paragraph>
                            </Card>
                        </Col>
                    ))}
                </Row>

            </div>
        </section>
    );
}
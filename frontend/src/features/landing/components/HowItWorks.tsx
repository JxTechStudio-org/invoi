import React from 'react';
import { Typography, ConfigProvider, Row, Col } from 'antd';
import { CloudUploadOutlined, ThunderboltOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export default function HowItWorks() {
    const steps = [
        {
            stepNumber: '1',
            icon: <CloudUploadOutlined style={{ fontSize: '24px', color: '#10B981' }} />,
            title: 'ارفع الفاتورة',
            description: 'قم برفع ملف الفاتورة بصيغة PDF أو صورة.',
        },
        {
            stepNumber: '2',
            icon: <ThunderboltOutlined style={{ fontSize: '24px', color: '#10B981' }} />,
            title: 'استخراج تلقائي',
            description: 'يقوم النظام باستخراج البيانات بشكل تلقائي وبدقة عالية.',
        },
        {
            stepNumber: '3',
            icon: <CheckCircleOutlined style={{ fontSize: '24px', color: '#10B981' }} />,
            title: 'تصدير البيانات',
            description: 'احفظ البيانات بصيغة تناسبك (مثل Excel أو CSV).',
        },
    ];

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
            <section id="how-it-works" style={{ padding: '96px 0', background: '#F8FAFC', direction: 'rtl' }}>
                <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 48px', boxSizing: 'border-box' }}>

                    <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                        <Title
                            level={2}
                            style={{
                                fontSize: '32px',
                                fontWeight: 700,
                                color: '#0F172A',
                                marginBottom: '12px',
                                fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                            }}
                        >
                            كيف يعمل invoi ؟
                        </Title>
                        <Paragraph
                            style={{
                                fontSize: '16px',
                                color: '#475569',
                                fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                            }}
                        >
                            ثلاث خطوات بسيطة لاستخراج بيانات الفواتير
                        </Paragraph>
                    </div>

                    <Row gutter={[24, 24]} justify="center">
                        {steps.map((item, index) => (
                            <Col xs={24} md={8} key={index}>
                                <div
                                    style={{
                                        background: '#FFFFFF',
                                        borderRadius: '12px',
                                        padding: '32px 24px',
                                        textAlign: 'center',
                                        border: '1px solid #E2E8F0',
                                        height: '100%',
                                        boxSizing: 'border-box',
                                    }}
                                >
                                    <div style={{
                                        width: '56px',
                                        height: '56px',
                                        background: '#ECFDF5',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 20px auto'
                                    }}>
                                        {item.icon}
                                    </div>

                                    <div style={{
                                        fontSize: '12px',
                                        color: '#10B981',
                                        fontWeight: 700,
                                        marginBottom: '8px',
                                        fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                                    }}>
                                        الخطوة {item.stepNumber}
                                    </div>

                                    <Title
                                        level={4}
                                        style={{
                                            fontSize: '18px',
                                            fontWeight: 600,
                                            color: '#0F172A',
                                            marginBottom: '12px',
                                            fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                                        }}
                                    >
                                        {item.title}
                                    </Title>

                                    <Paragraph
                                        style={{
                                            fontSize: '14px',
                                            color: '#475569',
                                            margin: 0,
                                            lineHeight: 1.5,
                                            fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                                        }}
                                    >
                                        {item.description}
                                    </Paragraph>
                                </div>
                            </Col>
                        ))}
                    </Row>

                </div>
            </section>
        </ConfigProvider>
    );
}
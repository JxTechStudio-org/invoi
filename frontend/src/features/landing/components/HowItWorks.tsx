import React from 'react';
import { Typography, Row, Col } from 'antd';
import { CloudUploadOutlined, ThunderboltOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export default function HowItWorks() {
    const steps = [
        {
            stepNumber: '1',
            icon: <CloudUploadOutlined style={{ fontSize: '24px', color: 'var(--emerald-500)' }} />,
            title: 'ارفع الفاتورة',
            description: 'قم برفع ملف الفاتورة بصيغة PDF أو صورة.',
        },
        {
            stepNumber: '2',
            icon: <ThunderboltOutlined style={{ fontSize: '24px', color: 'var(--emerald-500)' }} />,
            title: 'استخراج تلقائي',
            description: 'يقوم النظام باستخراج البيانات بشكل تلقائي وبدقة عالية.',
        },
        {
            stepNumber: '3',
            icon: <CheckCircleOutlined style={{ fontSize: '24px', color: 'var(--emerald-500)' }} />,
            title: 'تصدير البيانات',
            description: 'احفظ البيانات بصيغة تناسبك (مثل Excel أو CSV).',
        },
    ];

    return (
        <section id="how-it-works" style={{ padding: '96px 0', background: 'var(--bg-main)', direction: 'rtl' }}>
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
                        كيف يعمل invoi ؟
                    </Title>
                    <Paragraph
                        style={{
                            fontSize: '16px',
                            color: 'var(--var(--text-secondary))',
                            fontFamily: 'var(--sans)',
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
                                    background: ' var(--bg-container)',
                                    borderRadius: '12px',
                                    padding: '32px 24px',
                                    textAlign: 'center',
                                    border: '1px solid var(-border-color)',
                                    height: '100%',
                                    boxSizing: 'border-box',
                                }}
                            >
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    background: 'var(--bg-container)',
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
                                    color: 'var(--emerald-500)',
                                    fontWeight: 700,
                                    marginBottom: '8px',
                                    fontFamily: 'var(--sans)',
                                }}>
                                    الخطوة {item.stepNumber}
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
                            </div>
                        </Col>
                    ))}
                </Row>

            </div>
        </section>
    );
}
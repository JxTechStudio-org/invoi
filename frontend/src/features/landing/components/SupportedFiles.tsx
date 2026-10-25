import React from 'react';
import { Typography, Card, Row, Col } from 'antd';
import { FilePdfOutlined, FileImageOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export const SupportedFiles = () => {
    const fileFormats = [
        {
            title: 'PDF',
            icon: <FilePdfOutlined style={{ fontSize: '32px', color: '#DC2626' }} />,
            bg: '#FEF2F2',
            border: '#FCA5A5',
        },
        {
            title: 'JPG',
            icon: <FileImageOutlined style={{ fontSize: '32px', color: '#2563EB' }} />,
            bg: '#EFF6FF',
            border: '#93C5FD',
        },
        {
            title: 'PNG',
            icon: <FileImageOutlined style={{ fontSize: '32px', color: '#16A34A' }} />,
            bg: '#F0FDF4',
            border: '#86EFAC',
        },
    ];

    return (
        <section
            style={{
                backgroundColor: 'var(--bg-main)',
                padding: 'clamp(48px, 8vw, 80px) clamp(16px, 4vw, 24px)',
                direction: 'rtl',
                borderTop: '1px solid var(--border-color)',
                borderBottom: '1px solid var(--border-color)'
            }}
        >
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <Title
                        level={2}
                        style={{
                            fontSize: '32px',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            marginBottom: '12px',
                            fontFamily: 'var(--sans)'
                        }}
                    >
                        صيغ الملفات المدعومة
                    </Title>
                    <Paragraph
                        style={{
                            fontSize: '16px',
                            color: 'var(--text-secondary)',
                            fontFamily: 'var(--sans)',
                            margin: 0
                        }}
                    >
                        قم برفع فواتيرك بكل سهولة بأي من الصيغ التالية لبدء الاستخراج التلقائي
                    </Paragraph>
                </div>

                <Row gutter={[24, 24]} justify="center">
                    {fileFormats.map((file, index) => {
                        return (
                            <Col xs={24} sm={8} key={index}>
                                <Card
                                    variant="borderless"
                                    style={{
                                        background: ' var(--bg-container)',
                                        borderRadius: '16px',
                                        border: `1px solid ${file.border}`,
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                        textAlign: 'center',
                                        height: '100%'
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '64px',
                                            height: '64px',
                                            borderRadius: '12px',
                                            background: file.bg,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 16px auto'
                                        }}
                                    >
                                        {file.icon}
                                    </div>
                                    <Title
                                        level={4}
                                        style={{
                                            color: 'var(--text-primary)',
                                            margin: 0,
                                            fontFamily: 'var(--sans)'
                                        }}
                                    >
                                        {file.title}
                                    </Title>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            </div>
        </section>
    );
};
import React, { useState } from 'react';
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

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <section
            style={{
                backgroundColor: '#F8FAFC',
                padding: '80px 24px',
                direction: 'rtl',
                borderTop: '1px solid #E2E8F0',
                borderBottom: '1px solid #E2E8F0'
            }}
        >
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <Title
                        level={2}
                        style={{
                            fontSize: '32px',
                            fontWeight: 800,
                            color: '#0F172A',
                            marginBottom: '12px',
                            fontFamily: 'IBM Plex Sans Arabic, sans-serif'
                        }}
                    >
                        صيغ الملفات المدعومة
                    </Title>
                    <Paragraph
                        style={{
                            fontSize: '16px',
                            color: '#475569',
                            fontFamily: 'IBM Plex Sans Arabic, sans-serif',
                            margin: 0
                        }}
                    >
                        قم برفع فواتيرك بكل سهولة بأي من الصيغ التالية لبدء الاستخراج التلقائي
                    </Paragraph>
                </div>

                <Row gutter={[24, 24]} justify="center">
                    {fileFormats.map((file, index) => {
                        const isHovered = hoveredIndex === index;
                        return (
                            <Col xs={24} sm={8} key={index}>
                                <Card
                                    hoverable
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                    bordered={false}
                                    style={{
                                        background: '#FFFFFF',
                                        borderRadius: '16px',
                                        border: `1px solid ${file.border}`,
                                        boxShadow: isHovered
                                            ? '0 12px 20px -3px rgba(0, 0, 0, 0.1)'
                                            : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                        textAlign: 'center',
                                        height: '100%',
                                        transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer'
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
                                            margin: '0 auto 16px auto',
                                            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                                            transition: 'transform 0.3s ease'
                                        }}
                                    >
                                        {file.icon}
                                    </div>
                                    <Title
                                        level={4}
                                        style={{
                                            color: '#0F172A',
                                            marginBottom: '8px',
                                            fontFamily: 'IBM Plex Sans Arabic, sans-serif'
                                        }}
                                    >
                                        {file.title}
                                    </Title>
                                    <Paragraph
                                        style={{
                                            color: '#475569',
                                            fontSize: '14px',
                                            margin: 0,
                                            fontFamily: 'IBM Plex Sans Arabic, sans-serif'
                                        }}
                                    >

                                    </Paragraph>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            </div>
        </section>
    );
};
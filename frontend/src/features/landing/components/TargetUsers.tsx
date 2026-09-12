import React from 'react';
import { Row, Col, Card, Typography } from 'antd';
import { ShopOutlined, CalculatorOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export default function TargetUsers() {
    return (
        <section style={{ backgroundColor: '#F8FAFC', padding: '80px 24px', direction: 'rtl' }}>
            <div style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', textAlign: 'center' }}>

                {/* عنوان القسم */}
                <Title level={2} style={{ color: '#0F172A', marginBottom: '16px' }}>
                    لمن هذا المنتج؟
                </Title>

                {/* cards*/}
                <Row gutter={[32, 32]} justify="center">

                    {/* card 1: small businesses*/}
                    <Col xs={24} md={12}>
                        <Card
                            bordered={false}
                            style={{
                                backgroundColor: '#FFFFFF',
                                borderRadius: '16px',
                                textAlign: 'right',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                height: '100%'
                            }}
                        >
                            <div
                                style={{
                                    width: '56px',
                                    height: '56px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '20px',
                                    color: '#10B981',
                                    fontSize: '28px'
                                }}
                            >
                                <ShopOutlined />
                            </div>
                            <Title level={3} style={{ color: '#0F172A', marginTop: 0, marginBottom: '12px', fontSize: '20px' }}>
                                أصحاب الأعمال الصغيرة
                            </Title>
                            <Paragraph style={{ color: '#475569', fontSize: '16px', margin: 0, lineHeight: '1.5' }}>
                                لمن لا يمتلكون خبرة محاسبية عميقة أو فريق مالية مخصص، ويحتاجون إلى طريقة سهلة لإدارة فواتيرهم الواردة وتوفير الوقت بدلاً من إدارتها يدوياً.
                            </Paragraph>
                        </Card>
                    </Col>

                    {/* card 2: accountants*/}
                    <Col xs={24} md={12}>
                        <Card
                            bordered={false}
                            style={{
                                backgroundColor: '#FFFFFF',
                                borderRadius: '16px',
                                textAlign: 'right',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                height: '100%'
                            }}
                        >
                            <div
                                style={{
                                    width: '56px',
                                    height: '56px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '20px',
                                    color: '#10B981',
                                    fontSize: '28px'
                                }}
                            >
                                <CalculatorOutlined />
                            </div>
                            <Title level={3} style={{ color: '#0F172A', marginTop: 0, marginBottom: '12px', fontSize: '20px' }}>
                                المحاسبون
                            </Title>
                            <Paragraph style={{ color: '#475569', fontSize: '16px', margin: 0, lineHeight: '1.5' }}>
                                يساعد المحاسبين في تسريع عملية التعامل مع الفواتير الواردة وتنظيمها بشكل آلي ومبسط دون الحاجة للمعالجة اليدوية لكل فاتورة على حدة.
                            </Paragraph>
                        </Card>
                    </Col>

                </Row>
            </div>
        </section>
    );
}
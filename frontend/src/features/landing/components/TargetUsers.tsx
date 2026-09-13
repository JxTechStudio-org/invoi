import React from 'react';
import { Row, Col, Typography } from 'antd';
import { ShopOutlined, CalculatorOutlined } from '@ant-design/icons';

import meeting from '../../../assets/landing-assets/meeting.jpeg';
import accountant from '../../../assets/landing-assets/accountant.jpeg';

const { Title, Paragraph } = Typography;

export default function TargetUsers() {
    return (
        <section style={{ backgroundColor: 'var(--bg-main)', padding: 'clamp(48px, 8vw, 88px) clamp(16px, 4vw, 24px)' }}>
            <div style={{ maxWidth: '1440px', width: '100%', margin: '0 auto' }}>

                {/* section title */}
                <Title level={2} style={{ color: 'var(--text-primary)', fontSize: 'clamp(26px, 4vw, 32px)', textAlign: 'center', marginBottom: 'clamp(32px, 5vw, 48px)' }}>
                    لمن هذا المنتج؟
                </Title>

                {/* cards */}
                <Row gutter={[32, 32]} justify="center">

                    {/* card 1: small businesses */}
                    <Col xs={24} md={12}>
                        <div style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            border: '1px solid #f0f0f0',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                            position: 'relative'
                        }}>
                            {/* meeeting picture */}
                            <div style={{ width: '100%', height: '220px', overflow: 'hidden', position: 'relative' }}>
                                <img
                                    src={meeting}
                                    alt="أصحاب الأعمال الصغيرة"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
                                />
                            </div>

                            {/* card contents*/}
                            <div style={{ padding: 'clamp(20px, 3vw, 24px)', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                <div style={{
                                    position: 'absolute',
                                    top: '-28px',
                                    right: '24px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    backdropFilter: 'blur(8px)',
                                    padding: '10px',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    color: 'var(--emerald-600)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <ShopOutlined style={{ fontSize: '24px', color: 'var(--emerald-600)' }} />
                                </div>

                                <div style={{ marginTop: '0px' }}>
                                    <Title level={4} style={{ marginTop: '4px', marginBottom: '8px' }}>أصحاب الأعمال الصغيرة</Title>
                                    <Paragraph style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
                                        لمن لا يمتلكون خبرة محاسبية عميقة أو فريق مالية مخصص، ويحتاجون إلى طريقة سهلة لإدارة فواتيرهم الواردة وتوفير الوقت بدلاً من إدارتها يدويّاً.
                                    </Paragraph>
                                </div>
                            </div>
                        </div>
                    </Col>

                    {/* card 2: accountants */}
                    <Col xs={24} md={12}>
                        <div style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            border: '1px solid #f0f0f0',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                            position: 'relative'
                        }}>
                            {/* accountant picture*/}
                            <div style={{ width: '100%', height: '220px', overflow: 'hidden', position: 'relative' }}>
                                <img
                                    src={accountant}
                                    alt="المحاسبون"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
                                />
                            </div>

                            {/* card contents*/}
                            <div style={{ padding: 'clamp(20px, 3vw, 24px)', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                <div style={{
                                    position: 'absolute',
                                    top: '-28px',
                                    right: '24px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    backdropFilter: 'blur(8px)',
                                    padding: '10px',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    color: 'var(--emerald-600)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <CalculatorOutlined style={{ fontSize: '24px', color: 'var(--emerald-600)' }} />
                                </div>

                                <div style={{ marginTop: '0px' }}>
                                    <Title level={4} style={{ marginTop: '4px', marginBottom: '8px' }}>المحاسبون</Title>
                                    <Paragraph style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
                                        يساعد المحاسبين في تسريع عملية التعامل مع الفواتير الواردة وتنظيمها بشكل آلي ومبسط دون الحاجة للمعالجة اليدوية لكل فاتورة على حدة.
                                    </Paragraph>
                                </div>
                            </div>
                        </div>
                    </Col>

                </Row>

            </div>
        </section>
    );
}
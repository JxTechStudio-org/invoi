import React from 'react';
import { Typography, Card, Row, Col } from 'antd';
import {
    RobotOutlined,
    QrcodeOutlined,
    PercentageOutlined,
    AlertOutlined,
    TranslationOutlined,
    AuditOutlined,
    AppstoreOutlined,
    SafetyCertificateOutlined,
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export default function Features() {
    const iconStyle = { fontSize: '28px', color: 'var(--emerald-500)' };
    const featuresList = [
        {
            icon: <RobotOutlined style={iconStyle} />,
            title: 'استخراج بالذكاء الاصطناعي',
            description: 'يقرأ invoi الفاتورة بالذكاء الاصطناعي، ويستخرج منها 12 حقلاً: اسم المورد، ورقم الفاتورة، وتاريخ الفاتورة وتاريخ الاستحقاق، والإجمالي ومبلغ الضريبة، والعملة، وحالة الدفع وطريقته، واسم العميل، والرقم الضريبي والسجل التجاري للمورد.',
        },
        {
            icon: <QrcodeOutlined style={iconStyle} />,
            title: 'استخراج بيانات رمز QR',
            description: 'يقرأ invoi رمز QR في الفاتورة الإلكترونية ويأخذ منه اسم المورد والرقم الضريبي وتاريخ الفاتورة والإجمالي ومبلغ الضريبة، لتقليل الإدخال اليدوي.',
        },
        {
            icon: <PercentageOutlined style={iconStyle} />,
            title: 'التحقق من ضريبة القيمة المضافة',
            description: 'يتحقق invoi من صحة الرقم الضريبي للمورد، ومن أن الضريبة تساوي 15% في الفواتير بالريال السعودي من الموردين المسجلين في ضريبة القيمة المضافة، وينبّهك إذا تجاوزت الضريبة 30% من إجمالي أي فاتورة.',
        },
        {
            icon: <AlertOutlined style={iconStyle} />,
            title: 'تنبيهات واضحة للمراجعة',
            description: 'تعرّف على الفواتير التي تحتاج إلى مراجعة مع سبب كل تنبيه، مثل بيانات غير مؤكدة، أو اسم عميل لا يطابق اسم منشأتك، أو ضريبة غير منطقية.',
        },
        {
            icon: <TranslationOutlined style={iconStyle} />,
            title: 'فواتير عربية وإنجليزية',
            description: 'يقرأ invoi الفواتير باللغتين العربية والإنجليزية، ويدعم الأرقام العربية (١٢٣) والتواريخ الهجرية والميلادية بصيغها المختلفة.',
        },
        {
            icon: <AuditOutlined style={iconStyle} />,
            title: 'مراجعة الفاتورة واعتمادها',
            description: 'راجع البيانات المستخرجة وعدّلها عند الحاجة، ثم اعتمد الفاتورة أو أبلغ عن وجود خطأ.',
        },
        {
            icon: <AppstoreOutlined style={iconStyle} />,
            title: 'معالجة كميات كبيرة',
            description: 'مثالية للشركات التي تتعامل مع مئات الفواتير يومياً.',
        },
        {
            icon: <SafetyCertificateOutlined style={iconStyle} />,
            title: 'دعم وموثوقية',
            description: 'أمان عالي ودعم كامل لكافة أنواع الملفات.',
        },
    ];

    return (
        <section id="features" style={{ padding: 'clamp(56px, 9vw, 96px) 0', background: 'var(--bg-main)', direction: 'rtl' }}>
            <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 clamp(16px, 4vw, 48px)', boxSizing: 'border-box' }}>

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
                            color: 'var(--text-secondary)',
                            fontFamily: 'var(--sans)',
                        }}
                    >
                        يستخرج invoi بيانات فواتيرك ويتحقق منها، ويوضّح لك الحالات التي تحتاج إلى مراجعتك.
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
                                    border: '1px solid var(--border-color)',
                                    boxSizing: 'border-box',
                                }}
                                styles={{body:{ padding: '32px 24px'} }}
                            >
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    background: 'var(--primary-soft)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 20px auto'
                                }}>
                                    {item.icon}
                                </div>

                                <Title
                                    level={3}
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
                                        color: 'var(--text-secondary)',
                                        margin: 0,
                                        lineHeight: 1.7,
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
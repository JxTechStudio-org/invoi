import React from 'react';
import { Typography, Collapse } from 'antd';

const { Title, Paragraph } = Typography;

export const FAQ = () => {
    const faqItems = [
        {
            key: '1',
            label: 'ما هي أنواع الفواتير التي يدعمها النظام؟',
            children: (
                <Paragraph style={{ color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--sans)', lineHeight: 1.7 }}>
                    يوفر النظام حالياً دعماً كاملاً للفواتير الواردة فقط التي تتلقاها من الموردين والمصروفات.
                </Paragraph>
            ),
        },
        {
            key: '2',
            label: 'ما هي صيغ الملفات المدعومة لرفع الفواتير؟',
            children: (
                <Paragraph style={{ color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--sans)', lineHeight: 1.7 }}>
                    يمكنك رفع الفواتير بكل سهولة إما على شكل صور (JPG / PNG) أو ملفات (PDF) لبدء عملية الاستخراج التلقائي.
                </Paragraph>
            ),
        },
        {
            key: '3',
            label: 'هل يدعم النظام الفواتير باللغة العربية؟',
            children: (
                <Paragraph style={{ color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--sans)', lineHeight: 1.7 }}>
                    نعم، يدعم النظام الفواتير باللغتين العربية والإنجليزية بشكل كامل ومتساوٍ من اليوم الأول دون أي فرق في مستوى المعالجة.
                </Paragraph>
            ),
        },
        {
            key: '4',
            label: 'كيف يضمن النظام دقة البيانات وأمانها؟',
            children: (
                <Paragraph style={{ color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--sans)', lineHeight: 1.7 }}>
                    يقوم الذكاء الاصطناعي باستخراج البيانات تلقائياً، مع وجود نظام مراجعة يضع علامات وتنبيهات على أي حقل لضمان المراجعة اليدوية والتحكم الكامل قبل الاعتماد.
                </Paragraph>
            ),
        },
    ];

    return (
        <section
            id="faq"
            style={{
                backgroundColor: 'var(--bg-main)',
                padding: '80px 24px',
                direction: 'rtl',
                borderTop: '1px solid var(-border-color)'
            }}
        >
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
                        الأسئلة الشائعة
                    </Title>
                    <Paragraph
                        style={{
                            fontSize: '16px',
                            color: 'var(--text-secondary)',
                            fontFamily: 'var(--sans)',
                            margin: 0
                        }}
                    >
                        كل ما تحتاج لمعرفته حول منصة invoi وكيفية عملها.
                    </Paragraph>
                </div>

                <Collapse
                    accordion
                    bordered={false}
                    defaultActiveKey={['1']}
                    style={{ background: 'transparent' }}
                    items={faqItems.map(item => ({
                        key: item.key,
                        label: (
                            <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--sans)' }}>
                                {item.label}
                            </span>
                        ),
                        children: item.children,
                        style: {
                            background: 'var(--bg-main)',
                            borderRadius: '12px',
                            marginBottom: '16px',
                            border: '1px solid var(-border-color)',
                            overflow: 'hidden',
                        }
                    }))}
                />
            </div>
        </section>
    );
};

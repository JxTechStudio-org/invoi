import React from 'react';
import { Typography, Collapse } from 'antd';
import { useAppTranslation } from '../../shared/hooks/useAppTranslation';

const { Title, Paragraph } = Typography;

export const FAQ = () => {
    const { t, isRtl } = useAppTranslation('landing', 'faq');
    const faqItems = [
        {
            key: '1',
            label: t('q1Title'),
            children: (
                <Paragraph style={{ color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--sans)', lineHeight: 1.7 }}>
                    {t('q1Desc')}
                </Paragraph>
            ),
        },
        {
            key: '2',
            label: t('q2Title'),
            children: (
                <Paragraph style={{ color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--sans)', lineHeight: 1.7 }}>
                    {t('q2Desc')}
                </Paragraph>
            ),
        },
        {
            key: '3',
            label: t('q3Title'),
            children: (
                <Paragraph style={{ color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--sans)', lineHeight: 1.7 }}>
                    {t('q3Desc')}
                </Paragraph>
            ),
        },
        {
            key: '4',
            label: t('q4Title'),
            children: (
                <Paragraph style={{ color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--sans)', lineHeight: 1.7 }}>
                    {t('q4Desc')}
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
                direction: isRtl ? 'rtl' : 'ltr',
                borderTop: '1px solid var(--border-color)'
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
                        {t('title')}
                    </Title>
                    <Paragraph
                        style={{
                            fontSize: '16px',
                            color: 'var(--text-secondary)',
                            fontFamily: 'var(--sans)',
                            margin: 0
                        }}
                    >
                        {t('subtitle')}
                    </Paragraph>
                </div>

                <Collapse
                    accordion
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
                            border: '1px solid var(--border-color)',
                            overflow: 'hidden',
                        }
                    }))}
                />
            </div>
        </section>
    );
};

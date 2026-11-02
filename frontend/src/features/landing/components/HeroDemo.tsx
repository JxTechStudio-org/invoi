import React from 'react';
import { CheckCircleFilled, ExclamationCircleFilled, QrcodeOutlined } from '@ant-design/icons';
import logoIcon from '../../../assets/invoi-logo-icon_(2).svg';

// Sample data: invoi itself as the vendor; the VAT number is a placeholder pattern.
const extractedFields = [
    { label: 'المورد', value: 'شركة إنفوي' },
    { label: 'الرقم الضريبي', value: '300000000000003', ltr: true },
    { label: 'رقم الفاتورة', value: 'INV-2026-0418', ltr: true },
    { label: 'تاريخ الفاتورة', value: '2026-10-12', ltr: true },
    { label: 'مبلغ الضريبة', value: '180.00 SAR', ltr: true },
    { label: 'الإجمالي', value: '1,380.00 SAR', ltr: true },
];

const SCAN_SECONDS = 1.2;
const FIELD_STEP = 0.22;
const checksDelay = SCAN_SECONDS + extractedFields.length * FIELD_STEP + 0.2;

// CSS animations (not JS timers) so the final state always shows, even if scripts are slow.
const demoCss = `
    @keyframes hero-demo-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    @keyframes hero-demo-scan { 0% { top: 0; opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
    .hero-demo-in { animation: hero-demo-in 0.35s ease-out both; }
    .hero-demo-scan { animation: hero-demo-scan ${SCAN_SECONDS}s ease-in-out 0.3s both; }
    @media (prefers-reduced-motion: reduce) {
        .hero-demo-in, .hero-demo-scan { animation: none; }
        .hero-demo-scan { opacity: 0; }
    }
`;

const paperRow = (label: string, value: string, strong = false) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '11px', color: strong ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: strong ? 700 : 400 }}>
        <span>{label}</span>
        <span dir="ltr">{value}</span>
    </div>
);

/** Hero illustration: a sample invoice is scanned and its fields, checks and review flag appear. */
export const HeroDemo = () => (
    <div
        role="img"
        aria-label="مثال توضيحي: فاتورة يُستخرج منها اسم المورد والرقم الضريبي ورقم الفاتورة وتاريخها والمبالغ، مع التحقق من رمز QR والضريبة، وتنبيه بأن الفاتورة تحتاج إلى مراجعة."
        style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', alignItems: 'flex-start', width: '100%', maxWidth: '560px' }}
    >
        <style>{demoCss}</style>
        {/* The invoice "paper" */}
        <div
            aria-hidden="true"
            style={{
                position: 'relative',
                flex: '1 1 220px',
                maxWidth: '260px',
                background: 'var(--bg-container)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-lg)',
                padding: '18px',
                overflow: 'hidden',
                boxSizing: 'border-box',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={logoIcon} alt="" width={26} height={26} />
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>شركة إنفوي</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>فاتورة ضريبية مبسطة</div>
                    </div>
                </div>
                <QrcodeOutlined style={{ fontSize: '34px', color: 'var(--text-primary)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingBottom: '10px', borderBottom: '1px dashed var(--border-color)' }}>
                {paperRow('رقم الفاتورة', 'INV-2026-0418')}
                {paperRow('التاريخ', '2026-10-12')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 0', borderBottom: '1px dashed var(--border-color)' }}>
                {[88, 72, 80].map(width => (
                    <div key={width} style={{ height: '6px', width: `${width}%`, background: 'var(--surface-muted)', borderRadius: '4px' }} />
                ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '10px' }}>
                {paperRow('المجموع قبل الضريبة', '1,200.00')}
                {paperRow('ضريبة القيمة المضافة 15%', '180.00')}
                {paperRow('الإجمالي', '1,380.00 SAR', true)}
            </div>
            <div style={{ marginTop: '12px', fontSize: '10px', color: 'var(--text-secondary)', textAlign: 'center' }}>مثال توضيحي</div>

            {/* Scan line */}
            <div
                className="hero-demo-scan"
                style={{
                    position: 'absolute',
                    insetInline: 0,
                    height: '3px',
                    background: 'var(--emerald-500)',
                    boxShadow: '0 0 12px var(--emerald-500)',
                }}
            />
        </div>

        {/* Extracted data */}
        <div
            aria-hidden="true"
            style={{
                flex: '1 1 240px',
                maxWidth: '280px',
                background: 'var(--bg-container)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-lg)',
                padding: '18px',
                boxSizing: 'border-box',
            }}
        >
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>البيانات المستخرجة</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {extractedFields.map((field, i) => (
                    <div
                        key={field.label}
                        className="hero-demo-in"
                        style={{ animationDelay: `${SCAN_SECONDS + i * FIELD_STEP}s`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', fontSize: '11px' }}
                    >
                        <span style={{ color: 'var(--text-secondary)' }}>{field.label}</span>
                        <span dir={field.ltr ? 'ltr' : undefined} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{field.value}</span>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
                {['تم التحقق من رمز QR', 'الضريبة 15% صحيحة'].map((text, i) => (
                    <span
                        key={text}
                        className="hero-demo-in"
                        style={{ animationDelay: `${checksDelay + i * 0.15}s`, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 600, color: 'var(--primary-text)', background: 'var(--primary-soft)', borderRadius: '999px', padding: '3px 8px' }}
                    >
                        <CheckCircleFilled style={{ color: 'var(--emerald-500)' }} />
                        {text}
                    </span>
                ))}
            </div>

            <div
                className="hero-demo-in"
                style={{ animationDelay: `${checksDelay + 0.5}s`, display: 'flex', alignItems: 'flex-start', gap: '6px', marginTop: '12px', padding: '8px 10px', borderRadius: '8px', background: 'var(--warning-soft)', color: 'var(--warning-text)', fontSize: '11px', fontWeight: 600, lineHeight: 1.6 }}
            >
                <ExclamationCircleFilled style={{ color: 'var(--warning)', marginTop: '3px' }} />
                <span>تحتاج إلى مراجعة: اسم العميل لا يطابق اسم المنشأة</span>
            </div>
        </div>
    </div>
);

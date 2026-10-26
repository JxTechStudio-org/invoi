import React from 'react';
import { Typography } from 'antd';
import logoIcon from '../../../assets/invoi-logo-icon_(2).svg';

const { Title, Paragraph } = Typography;

// Sample figures for the illustration; labels mirror features/dashboard.
const kpis = [
    { label: 'إجمالي الفواتير', value: '248' },
    { label: 'تحتاج مراجعة', value: '12', warning: true },
    { label: 'نسبة الفواتير المكتملة', value: '91%' },
    { label: 'إجمالي المبلغ هذا الشهر', value: '86,420 SAR' },
];

const months = [
    { name: 'مايو', value: 38 },
    { name: 'يونيو', value: 52 },
    { name: 'يوليو', value: 47 },
    { name: 'أغسطس', value: 63 },
    { name: 'سبتمبر', value: 71 },
    { name: 'أكتوبر', value: 84 },
];

type Status = 'completed' | 'needs_review' | 'processing';

const statusStyle: Record<Status, { label: string; color: string; background: string }> = {
    completed: { label: 'مكتملة', color: 'var(--primary-text)', background: 'var(--primary-soft)' },
    needs_review: { label: 'تحتاج مراجعة', color: 'var(--warning-text)', background: 'var(--warning-soft)' },
    processing: { label: 'قيد المعالجة', color: 'var(--text-secondary)', background: 'var(--surface-muted)' },
};

const recentInvoices: { vendor: string; amount: string; status: Status }[] = [
    { vendor: 'شركة إنفوي', amount: '1,380.00', status: 'completed' },
    { vendor: 'خدمات النظافة', amount: '2,750.00', status: 'needs_review' },
    { vendor: 'مزود الإنترنت', amount: '575.00', status: 'completed' },
    { vendor: 'مورد القرطاسية', amount: '312.50', status: 'processing' },
];

const panel: React.CSSProperties = {
    background: 'var(--bg-container)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    padding: '14px',
    boxSizing: 'border-box',
    minWidth: 0,
};

const panelTitle: React.CSSProperties = { fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' };

export default function DashboardPreview() {
    const maxMonth = Math.max(...months.map(m => m.value));

    return (
        <section id="dashboard" style={{ padding: 'clamp(56px, 9vw, 96px) clamp(16px, 4vw, 24px)', background: 'var(--bg-main)', direction: 'rtl' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <Title level={2} style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', fontFamily: 'var(--sans)' }}>
                        كل فواتيرك في لوحة تحكم واحدة
                    </Title>
                    <Paragraph style={{ fontSize: '16px', color: 'var(--text-secondary)', fontFamily: 'var(--sans)', margin: 0 }}>
                        تابع عدد فواتيرك، وما يحتاج منها إلى مراجعة، ونسبة المكتمل منها، وحجم المعالجة الشهري، وآخر ما رفعته.
                    </Paragraph>
                </div>

                {/* Browser window */}
                <div
                    role="img"
                    aria-label="مثال توضيحي للوحة تحكم invoi: إجمالي الفواتير، والفواتير التي تحتاج إلى مراجعة، ونسبة المكتمل، وإجمالي مبلغ الشهر، ومخطط حجم المعالجة لآخر ستة أشهر، وقائمة آخر الفواتير المرفوعة مع حالتها."
                    style={{ background: 'var(--bg-container)', border: '1px solid var(--border-color)', borderRadius: '14px', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}
                >
                    <div aria-hidden="true">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-muted)' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {[0, 1, 2].map(i => <span key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--border-color)' }} />)}
                            </div>
                            <div dir="ltr" style={{ flex: 1, maxWidth: '320px', margin: '0 auto', fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-container)', borderRadius: '6px', padding: '4px 10px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                invoi.jxtechstudio.com/dashboard
                            </div>
                        </div>

                        <div style={{ padding: 'clamp(12px, 3vw, 20px)', background: 'var(--bg-main)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <img src={logoIcon} alt="" width={22} height={22} />
                                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>لوحة التحكم</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                                {kpis.map(kpi => (
                                    <div key={kpi.label} style={panel}>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{kpi.label}</div>
                                        <div dir="ltr" style={{ fontSize: '20px', fontWeight: 700, textAlign: 'right', color: kpi.warning ? 'var(--warning-text)' : 'var(--text-primary)' }}>{kpi.value}</div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                                <div style={panel}>
                                    <div style={panelTitle}>حجم المعالجة (آخر 6 أشهر)</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', direction: 'ltr' }}>
                                        {months.map(month => (
                                            <div key={month.name} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                                <div style={{ height: '120px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                                                    <div style={{ width: '100%', maxWidth: '28px', height: `${(month.value / maxMonth) * 100}%`, background: 'var(--emerald-500)', borderRadius: '4px 4px 0 0' }} />
                                                </div>
                                                <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>{month.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={panel}>
                                    <div style={panelTitle}>آخر الفواتير المرفوعة</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {recentInvoices.map(invoice => {
                                            const status = statusStyle[invoice.status];
                                            return (
                                                <div key={invoice.vendor} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: '12px' }}>
                                                    <span style={{ color: 'var(--text-primary)', fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{invoice.vendor}</span>
                                                    <span dir="ltr" style={{ color: 'var(--text-secondary)' }}>{invoice.amount}</span>
                                                    <span style={{ fontSize: '10px', fontWeight: 600, color: status.color, background: status.background, borderRadius: '999px', padding: '2px 8px', whiteSpace: 'nowrap' }}>{status.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>مثال توضيحي</div>
            </div>
        </section>
    );
}

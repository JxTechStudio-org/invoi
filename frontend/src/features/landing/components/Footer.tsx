import React from 'react';
import { Layout, Image } from 'antd';
import logoSvg from '../../../assets/invoi-logo-wordmark.svg'

const { Footer: AntFooter } = Layout;

export const Footer = () => {
  return (
    <AntFooter style={{ backgroundColor: 'var(--bg-main)', borderTop: '1px solid var(-border-color)', padding: '40px 48px', direction: 'rtl' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '24px', borderBottom: '1px solid var(-border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Image 
            src={logoSvg} 
            alt="Invoi Logo" 
            preview={false} 
            height={32} 
          />
        </div>
        <ul style={{ display: 'flex', gap: '32px', listStyle: 'none', margin: 0, padding: 0 }}>
          <li><a href="#home" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '14px', fontFamily: 'var(--sans)' }}>الرئيسية</a></li>
          <li><a href="#features" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '14px', fontFamily: 'var(--sans)' }}>المميزات</a></li>
          <li><a href="#how-it-works" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '14px', fontFamily: 'var(--sans)' }}>كيف يعمل</a></li>
          <li><a href="#faq" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '14px', fontFamily: 'var(--sans)' }}>الأسئلة الشائعة</a></li>

        </ul>
      </div>
      <div style={{ maxWidth: '1440px', margin: '20px auto 0 auto', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--sans)' }}>© 2026 invoi جميع الحقوق محفوظة.</p>
      </div>
    </AntFooter>
  );
};

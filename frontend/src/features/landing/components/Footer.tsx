import React from 'react';
import { Layout, Image } from 'antd';
import logoSvg from '../../../assets/invoi-logo-wordmark.svg'

const { Footer: AntFooter } = Layout;

export const Footer = () => {
  return (
    <AntFooter style={{ backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', padding: '40px 48px', direction: 'rtl' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '24px', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Image 
            src={logoSvg} 
            alt="Invoi Logo" 
            preview={false} 
            height={32} 
          />
        </div>
        <ul style={{ display: 'flex', gap: '32px', listStyle: 'none', margin: 0, padding: 0 }}>
          <li><a href="#home" style={{ textDecoration: 'none', color: '#64748B', fontSize: '14px', fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}>الرئيسية</a></li>
          <li><a href="#features" style={{ textDecoration: 'none', color: '#64748B', fontSize: '14px', fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}>المميزات</a></li>
          <li><a href="#how-it-works" style={{ textDecoration: 'none', color: '#64748B', fontSize: '14px', fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}>كيف يعمل</a></li>
        </ul>
      </div>
      <div style={{ maxWidth: '1440px', margin: '20px auto 0 auto', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0, fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}>© 2025 invoi جميع الحقوق محفوظة.</p>
      </div>
    </AntFooter>
  );
};

import React from 'react';
import { Layout, Image } from 'antd';
import { motion } from 'framer-motion';
import logoSvg from '../../../assets/invoi-logo-wordmark.svg';
import { useAppTranslation } from '../../shared/hooks/useAppTranslation';

const { Footer: AntFooter } = Layout;

export const Footer = () => {
  const { t, isRtl } = useAppTranslation('landing', 'footer');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      style={{ width: '100%', overflow: 'hidden' }}
    >
      <AntFooter
        style={{
          backgroundColor: 'var(--emerald-600)',
          borderRadius: 0,
          width: '100%',
          boxSizing: 'border-box',
          margin: 0,
          padding: 'clamp(24px, 4vw, 40px) clamp(20px, 5vw, 64px)',
          direction: isRtl ? 'rtl' : 'ltr',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '1440px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '24px',
            borderBottom: '1px solid var(--footer-border, rgba(255, 255, 255, 0.15))',
            flexWrap: 'wrap',
            gap: '24px',
          }}
        >
          {/* logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
              filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 4px rgba(255, 255, 255, 1))',
            }}
          >
            <Image
              src={logoSvg}
              alt="Invoi Logo"
              preview={false}
              height={32}
            />
          </div>
          {/* links */}
          <ul
            style={{
              display: 'flex',
              gap: 'clamp(16px, 2.5vw, 32px)',
              listStyle: 'none',
              margin: 0,
              padding: 0,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <li><a href="#home" style={{ textDecoration: 'none', color: 'var(--footer-link, #F0FDF4)', fontSize: '14px', fontFamily: 'var(--sans)' }}>{t('home')}</a></li>
            <li><a href="#features" style={{ textDecoration: 'none', color: 'var(--footer-link, #F0FDF4)', fontSize: '14px', fontFamily: 'var(--sans)' }}>{t('features')}</a></li>
            <li><a href="#how-it-works" style={{ textDecoration: 'none', color: 'var(--footer-link, #F0FDF4)', fontSize: '14px', fontFamily: 'var(--sans)' }}>{t('howItWorks')}</a></li>
            <li><a href="#faq" style={{ textDecoration: 'none', color: 'var(--footer-link, #F0FDF4)', fontSize: '14px', fontFamily: 'var(--sans)' }}>{t('faq')}</a></li>
          </ul>
        </div>

        <div style={{ width: '100%', maxWidth: '1440px', margin: '20px auto 0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--footer-text, rgba(255, 255, 255, 0.7))', margin: 0, fontFamily: 'var(--sans)' }}>{t('rights')}</p>
        </div>
      </AntFooter>
    </motion.div>
  );
};
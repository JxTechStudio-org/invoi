import React from 'react';
import { Button, Typography, Space, Image, ConfigProvider } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import logoIcon from '../../../assets/invoi-logo-icon_(2).svg';
import logoWordmark from '../../../assets/invoi-logo-wordmark.svg';

const { Title, Paragraph } = Typography;

export const Hero = () => {
  return (
    <ConfigProvider
      direction="rtl"
      theme={{
        token: {
          colorPrimary: '#10B981',
          colorPrimaryHover: '#059669',
          colorPrimaryActive: '#047857',
          fontFamily: 'var(--sans)',
          borderRadius: 6,
        },
      }}
    >
      <section 
        id="home" 
        style={{ 
          backgroundColor: 'var(--bg-main)', 
          borderBottom: '1px solid var(--border-color)',
          padding: '80px 24px', 
          overflow: 'hidden'
        }}
      >
        <div 
          style={{ 
            maxWidth: '1200px', 
            margin: '0 auto', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '40px',
            flexWrap: 'wrap'
          }}
        >
          {/* Mockups */}
          <div style={{ flex: '1.2', minWidth: '340px', display: 'flex', justifyContent: 'center', order: 1 }}>
            <div 
              style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                width: '100%',
                justifyContent: 'center'
              }}
            >
              <div 
                style={{ 
                  background: 'var(--bg-container)', 
                  borderRadius: '8px', 
                  padding: '20px', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
                  width: '180px',
                  border: '1px solid var(--border-color)',
                  transform: 'rotate(-4deg) translateY(10px)',
                  zIndex: 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                  <Image src={logoIcon} alt="logo" preview={false} width={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '4px', width: '90%' }}></div>
                  <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '4px', width: '70%' }}></div>
                  <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '4px', width: '85%' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ background: 'var(--emerald-500)', borderRadius: '6px', width: '32px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#FFFFFF', fontSize: '12px' }}>↑</span>
                  </div>
                </div>
              </div>

              <div 
                style={{ 
                  background: 'var(--bg-container)', 
                  borderRadius: '8px', 
                  padding: '20px', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
                  width: '260px',
                  border: '1px solid var(--border-color)',
                  zIndex: 2
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <Image src={logoWordmark} alt="invoi logo" preview={false} width={65} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 600 }}>
                  <span>التاريخ</span>
                  <span>المورد</span>
                  <span>المبلغ</span>
                  <span>الحالة</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '4px', width: '40px' }}></div>
                    <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '4px', width: '50px' }}></div>
                    <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '4px', width: '30px' }}></div>
                    <div style={{ height: '8px', background: 'var(--emerald-500)', borderRadius: '4px', width: '35px' }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '4px', width: '40px' }}></div>
                    <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '4px', width: '50px' }}></div>
                    <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '4px', width: '30px' }}></div>
                    <div style={{ height: '8px', background: 'var(--emerald-500)', borderRadius: '4px', width: '35px' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div style={{ flex: '1', minWidth: '320px', textAlign: 'right', order: 2 }}>
            <Title 
              level={1} 
              style={{ 
                fontSize: '32px', 
                fontWeight: 700, 
                color: 'var(--text-primary)', 
                marginBottom: '16px',
                lineHeight: 1.4
              }}
            >
              استخرج بيانات الفواتير بسهولة وبدون مجهود
            </Title>
            <Paragraph 
              style={{ 
                fontSize: '16px', 
                color: 'var(--text-secondary)', 
                marginBottom: '28px',
                lineHeight: 1.6,
                maxWidth: '460px'
              }}
            >
              invoi يساعدك في استخراج بيانات الفواتير تلقائياً من الملفات المرفوعة، بطريقة سريعة ودقيقة.
            </Paragraph>
            <Space>
              <Button 
                type="primary" 
                size="large" 
                icon={<ArrowLeftOutlined />}
                style={{ 
                  height: '40px', 
                  paddingInline: '24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
              >
                ابدأ الآن
              </Button>
            </Space>
          </div>
        </div>
      </section>
    </ConfigProvider>
  );
};
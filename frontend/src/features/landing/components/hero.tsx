import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { HeroDemo } from './HeroDemo';
import { hasAuthToken } from '../utils/auth';

const { Title, Paragraph } = Typography;

export const Hero = () => {
  const navigate = useNavigate();
  const isLoggedIn = hasAuthToken();

  return (
    <>
      <style>
        {`
          .ant-btn-primary {
            background-color: var(--emerald-500) !important;
          }
          .ant-btn-primary:hover {
            background-color: var(--emerald-600) !important;
          }
          /* Phones: headline and button first, demo below */
          @media (max-width: 900px) {
            .hero-text-col { order: 1 !important; }
            .hero-demo-col { order: 2 !important; }
          }
        `}
      </style>

      <section
        id="home"
        style={{
          backgroundColor: 'var(--bg-main)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: 'clamp(48px, 8vw, 80px) clamp(16px, 4vw, 24px)',
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
          {/* Product demo */}
          <div className="hero-demo-col" style={{ flex: '1.2', minWidth: 'min(340px, 100%)', display: 'flex', justifyContent: 'center', order: 1 }}>
            <HeroDemo />
          </div>

          {/* Text Content */}
          <div className="hero-text-col" style={{ flex: '1', minWidth: 'min(320px, 100%)', textAlign: 'right', order: 2 }}>
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
                onClick={() => navigate(isLoggedIn ? '/dashboard' : '/auth/register')}
                style={{
                  height: '40px',
                  paddingInline: '24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {isLoggedIn ? 'لوحة التحكم' : 'ابدأ الآن'}
              </Button>
            </Space>
          </div>
        </div>
      </section>
    </>
  );
};

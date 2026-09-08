import React from 'react';
import { Typography, Button, ConfigProvider, Row, Col } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export default function hero() {
  return (
    <ConfigProvider
      direction="rtl"
      theme={{
        token: {
          colorPrimary: '#10B981', // Emerald 500
          fontFamily: "'IBM Plex Sans Arabic', 'Inter', sans-serif",
          borderRadius: 6,
        },
        components: {
          Button: {
            colorPrimaryHover: '#059669',
            colorPrimaryActive: '#047857',
            controlHeight: 40,
            paddingInline: 24,
          },
        },
      }}
    >
      <div
        style={{
          background: '#F8FAFC',
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          direction: 'rtl',
        }}
      >
        <div
          style={{
            maxWidth: '1440px',
            width: '100%',
            margin: '0 auto',
            paddingLeft: '48px',
            paddingRight: '48px',
            boxSizing: 'border-box',
          }}
        >
          <Row justify="center" align="middle">
            <Col xs={24} md={20} lg={12} style={{ textAlign: 'center' }}>

              <Title
                level={1}
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  lineHeight: 1.4,
                  color: '#0F172A',
                  marginBottom: '16px',
                  fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                }}
              >
                نظام استخراج وإدارة الفواتير بذكاء
              </Title>

              <Paragraph
                style={{
                  fontSize: '16px',
                  lineHeight: 1.5,
                  color: '#475569',
                  marginBottom: '32px',
                  fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                }}
              >
                منصة invoi تتيح لك رفع الفواتير ومعالجتها واستخراج البيانات الأساسية بكل سهولة واحترافية، مع دعم كامل للغتين العربية والإنجليزية.
              </Paragraph>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<ArrowLeftOutlined />}
                  style={{ fontWeight: 600 }}
                >
                  ابدأ الآن
                </Button>
              </div>

            </Col>
          </Row>
        </div>
      </div>
    </ConfigProvider>
  );
}
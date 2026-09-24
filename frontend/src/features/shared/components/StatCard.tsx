import type { ReactNode } from 'react'
import { Card, theme } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'

interface StatCardProps {
  title: string
  value: string | number
  prefix?: string
  icon?: ReactNode
  trend?: {
    value: number
    label?: string
  }
  illustration?: ReactNode
}

export default function StatCard({ title, value, prefix, icon, trend, illustration }: StatCardProps) {
  const { token } = theme.useToken()
  const isPositive = trend ? trend.value >= 0 : null

  return (
    <Card
      styles={{ body: { padding: 22 } }}
      style={{
        borderRadius: 24,
        border: `1px solid ${token.colorBorder}`,
        backgroundColor: token.colorBgContainer,
        boxShadow: token.boxShadowTertiary,
        transition: 'all 0.25s ease',
        height: '100%'
      }}
      hoverable
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: token.colorTextSecondary, fontWeight: 600, letterSpacing: '0.2px' }}>{title}</span>
        {icon && (
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: token.colorPrimaryBg,
              color: token.colorPrimary,
              border: `1px solid ${token.colorPrimaryBorder}`
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div style={{ fontSize: 28, fontWeight: 800, color: token.colorText, letterSpacing: '-0.5px' }}>
        {prefix && <span style={{ fontSize: 18, color: token.colorTextTertiary, marginInlineEnd: 4, fontWeight: 600 }}>{prefix}</span>}
        {value}
      </div>

      {trend && (
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: isPositive ? token.colorSuccessText : token.colorErrorText,
            fontWeight: 600
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px 6px',
              borderRadius: 6,
              backgroundColor: isPositive ? token.colorSuccessBg : token.colorErrorBg,
              border: `1px solid ${isPositive ? token.colorSuccessText : token.colorErrorText}20`,
              gap: 4
            }}
          >
            {isPositive ? <ArrowUpOutlined style={{ fontSize: 10 }} /> : <ArrowDownOutlined style={{ fontSize: 10 }} />}
            <span>{Math.abs(trend.value)}%</span>
          </span>
          {trend.label && <span style={{ color: token.colorTextTertiary, fontWeight: 500 }}>{trend.label}</span>}
        </div>
      )}

      {illustration && <div style={{ marginTop: 14 }}>{illustration}</div>}
    </Card>
  )
}


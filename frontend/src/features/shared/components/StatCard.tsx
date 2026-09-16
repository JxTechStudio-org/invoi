
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
      styles={{ body: { padding: 20 } }}
      style={{
        borderRadius: 12,
        border: `1px solid ${token.colorBorder}`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 14, color: token.colorTextSecondary, fontWeight: 500 }}>{title}</span>
        {icon && (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: token.colorPrimaryBg
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div style={{ marginTop: 8, fontSize: 26, fontWeight: 700, color: token.colorText }}>
        {prefix && <span style={{ color: token.colorTextTertiary, marginInlineEnd: 4 }}>{prefix}</span>}
        {value}
      </div>

      {trend && (
        <div
          style={{
            marginTop: 6,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: isPositive ? token.colorSuccess : token.colorError
          }}
        >
          {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          <span>{Math.abs(trend.value)}%</span>
          {trend.label && <span style={{ color: token.colorTextTertiary }}>{trend.label}</span>}
        </div>
      )}

      {illustration && <div style={{ marginTop: 12 }}>{illustration}</div>}
    </Card>
  )
}


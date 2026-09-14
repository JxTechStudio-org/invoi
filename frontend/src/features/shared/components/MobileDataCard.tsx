import type { ReactNode } from 'react'
import type { TableColumnsType } from 'antd'
import { Flex, Empty, Card, Spin } from 'antd'

interface MobileDataCardsProps<T> {
    columns: TableColumnsType<T>
    dataSource: T[]
    actionPosition?: 'top' | 'bottom'
    limit?: number | null
    loading?: boolean
}

export default function MobileDataCard<T extends Record<string, unknown>>({
    columns,
    dataSource,
    actionPosition = 'top',
    limit = null,
    loading = false
}: MobileDataCardsProps<T>) {
    const actionColumn = columns.find((col) => col.key === 'action')
    const dataColumns = columns.filter((col) => col.key !== 'action')
    const displayData = limit ? dataSource.slice(0, limit) : dataSource

    if (loading) {
        return (
            <Flex justify="center" align="center" style={{ padding: 40 }}>
                <Spin size="large" />
            </Flex>
        )
    }

    if (!displayData || displayData.length === 0) {
        return (
            <Flex justify="center" align="center" style={{ padding: 40 }}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </Flex>
        )
    }

    return (
        <>
            {displayData.map((record, index) => (
                <Card
                    key={(record as { id?: string; key?: string }).id ?? (record as { key?: string }).key ?? index}
                    styles={{ body: { padding: 24 } }}
                    style={{
                        marginBottom: 20,
                        borderRadius: 12,
                        overflow: 'hidden',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                    }}
                >
                    {actionPosition === 'top' && actionColumn?.render && (
                        <Flex justify="end" style={{ marginBottom: 24 }}>
                            {actionColumn.render(null, record, index) as ReactNode}
                        </Flex>
                    )}
                    <Flex vertical gap={12}>
                        {dataColumns[0] && (
                            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', textAlign: 'right' }}>
                                {dataColumns[0].render
                                    ? (dataColumns[0].render('dataIndex' in dataColumns[0] ? record[dataColumns[0].dataIndex as keyof T] : null, record, index) as ReactNode)
                                    : String('dataIndex' in dataColumns[0] ? record[dataColumns[0].dataIndex as keyof T] : '')}
                            </div>
                        )}
                        {dataColumns.slice(1).map((col, colIndex) => (
                            <Flex
                                key={col.key ?? colIndex}
                                justify="space-between"
                                align="center"
                                style={{
                                    paddingBottom: colIndex === dataColumns.length - 2 ? 0 : 12,
                                    borderBottom: colIndex === dataColumns.length - 2 ? 'none' : '1px solid #F1F5F9'
                                }}
                            >
                                <span style={{ color: '#4B5563', fontSize: 15, fontWeight: 500 }}>
                                    {col.title as ReactNode}
                                </span>
                                <span style={{ fontSize: 16, textAlign: 'left', wordBreak: 'break-all' }}>
                                    {col.render
                                        ? (col.render('dataIndex' in col ? record[col.dataIndex as keyof T] : null, record, index) as ReactNode)
                                        : String('dataIndex' in col ? record[col.dataIndex as keyof T] : '')}
                                </span>
                            </Flex>
                        ))}
                        {actionPosition === 'bottom' && actionColumn?.render && (
                            <Flex justify="center" style={{ marginBlock: 24 }}>
                                {actionColumn.render(null, record, index) as ReactNode}
                            </Flex>
                        )}
                    </Flex>
                </Card>
            ))}
        </>
    )
}

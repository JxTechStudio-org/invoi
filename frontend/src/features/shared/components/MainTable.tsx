import type { TableColumnsType, TableProps } from 'antd'
import { Table, theme } from 'antd'
const { useToken } = theme

interface MainTableProps<T> {
    columns: TableColumnsType<T>
    dataSource: T[]
    loading?: boolean
    rowKey?: string | ((record: T) => string)
    pagination?: TableProps<T>['pagination']
    onChange?: TableProps<T>['onChange']
}

export default function MainTable<T extends object>({ columns, dataSource, loading = false, rowKey = 'key', pagination, onChange }: MainTableProps<T>) {
    const { token } = useToken()

    return (
        <>
            <Table<T>
                columns={columns}
                dataSource={dataSource}
                loading={loading}
                rowKey={rowKey}
                onChange={onChange}
                pagination={
                    pagination === false
                        ? false
                        : {
                            position: ['bottomCenter'],
                            pageSize: 9,
                            ...pagination,
                        }
                }
                style={{
                    border: `1px solid ${token.colorBorder}`,
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
            />
        </>
    )
}

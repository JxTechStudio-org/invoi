import React, { useRef, useState } from 'react'
import type { TableColumnsType, TableProps } from 'antd'
import { Table } from 'antd'
import type { FilterDropdownProps } from 'antd/es/table/interface'

interface MainTabbleProps<T> {
    columns: TableColumnsType<T>
    dataSource: T[]
    loading?: boolean
    rowKey?: string | ((record: T) => string)
    pagination?: TableProps<T>['pagination']
    onChange?: TableProps<T>['onChange']
}

export default function MainTable<T extends object>({ columns, dataSource, loading = false, rowKey = 'key', pagination, onChange }: MainTabbleProps<T>) {

    return (
        <>
            <Table<T>
                columns={columns}
                dataSource={dataSource}
                loading={loading}
                rowKey={rowKey}
                pagination={pagination}
                onChange={onChange}
            />
        </>
    )
}
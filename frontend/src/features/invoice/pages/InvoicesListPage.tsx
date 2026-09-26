import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Grid, theme, Empty, Flex } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import MainTable from '../../shared/components/MainTable'
import MobileDataCard from '../../shared/components/MobileDataCard'
import PendingValue from '../../shared/components/PendingValue'
import MainAlert from '../../shared/components/MainAlert'
import MainButton from '../../shared/components/MainButton'
import { useInvoicesList } from '../hooks/useInvoicesList'
import type { Invoice, InvoicesListFilters } from '../api/invoicesListApi'
import type { TableColumnsType } from 'antd'
import { LiaFileInvoiceDollarSolid } from 'react-icons/lia'
import FilterBar from '../../shared/components/FilterBar'
import PageHeader from '../../shared/components/PageHeader'

const { useBreakpoint } = Grid

const STATUS_LABELS: Record<string, string> = {
    processing: 'قيد المعالجة',
    completed: 'مكتملة',
    needs_review: 'تحتاج مراجعة'
}

export default function InvoicesListPage() {
    const [filters, setFilters] = useState<InvoicesListFilters>({})
    const { invoices, isLoading, errorMessage } = useInvoicesList(filters)
    const screens = useBreakpoint()
    const isMobileOrTablet = !screens.lg
    const navigate = useNavigate()
    const { token } = theme.useToken()
    const [searchText, setSearchText] = useState('')

    const filteredInvoices = useMemo(() => {
        if (searchText.trim() === '') return invoices
        return invoices.filter((invoice) =>
            [invoice.sellerName, invoice.status, String(invoice.amount ?? ''), invoice.invoiceDate]
                .some((field) => String(field ?? '').toLowerCase().includes(searchText.toLowerCase()))
        )
    }, [invoices, searchText])


    const filterConfig = [
        {
            key: 'status',
            placeholder: 'حالة الفاتورة',
            options: [
                { label: 'مكتملة', value: 'completed' },
                { label: 'قيد المعالجة', value: 'processing' },
                { label: 'تحتاج مراجعة', value: 'needs_review' }
            ]
        }
    ]

    const handleFilterChange = (key: string, value: string | undefined) => {
        if (key === 'status') {
            setFilters((prev) => ({ ...prev, status: value as InvoicesListFilters['status'] }))
        }
    }

    const handleReset = () => {
        setFilters({})
        setSearchText('')
    }

    const handleSearch = (value: string) => setSearchText(value)

    const columns: TableColumnsType<Invoice> = [
        {
            title: 'الملف',
            dataIndex: 'fileUrl',
            key: 'fileUrl',
            render: (value: string) => (
                <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: token.colorPrimary, textDecoration: 'underline' }}>
                    <FileTextOutlined /> عرض الملف
                </a>
            )
        },
        {
            title: 'المورد',
            dataIndex: 'sellerName',
            key: 'sellerName',
            render: (value) => <PendingValue value={value} />
        },
        {
            title: 'تاريخ الفاتورة',
            dataIndex: 'invoiceDate',
            key: 'invoiceDate',
            render: (value) => <PendingValue value={value} />
        },
        {
            title: 'المبلغ',
            dataIndex: 'amount',
            key: 'amount',
            render: (value) => <PendingValue value={value} />
        },
        {
            title: 'الحالة',
            dataIndex: 'status',
            key: 'status',
            render: (value: Invoice['status']) => STATUS_LABELS[value] ?? value
        },
        {
            title: 'تاريخ الإنشاء',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (value: string) => new Date(value).toLocaleDateString('ar-SA')
        },
        {
            title: '',
            key: 'action',
            render: (_, record) => (
                <MainButton
                    text="عرض التفاصيل"
                    type="dashed"
                    onClick={() => navigate(`/invoices/${record.id}`)}
                />
            )
        }
    ]

    return (
        <>
            <PageHeader pageIcon={<LiaFileInvoiceDollarSolid />} pagename1='الفواتير' page1path='/invoices' />

            <FilterBar
                filters={filterConfig}
                onFilterChange={handleFilterChange}
                onSearch={handleSearch}
                onReset={handleReset}
                searchPlaceholder="بحث في الفواتير..."
            />

            {errorMessage ? <MainAlert alertMessage={errorMessage} alertType="error" /> : null}

            {!isLoading && (!invoices || filteredInvoices.length === 0) ? (
                <Flex vertical align="center" justify="center" style={{ height: '60vh' }}>
                    <Empty description="لا توجد فواتير مطابقة" />
                </Flex>
            ) : isMobileOrTablet ? (
                <MobileDataCard<Invoice & Record<string, unknown>>
                    columns={columns as TableColumnsType<Invoice & Record<string, unknown>>}
                    dataSource={filteredInvoices as (Invoice & Record<string, unknown>)[]}
                    loading={isLoading}
                />
            ) : (
                <MainTable<Invoice> columns={columns} dataSource={filteredInvoices} loading={isLoading} rowKey="id" />
            )}

        </>
    )
}

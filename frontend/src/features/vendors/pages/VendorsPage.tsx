import { useState, useMemo } from 'react'
import { Grid, theme, Empty, Flex } from 'antd'
import { ShopOutlined } from '@ant-design/icons'
import MainTable from '../../shared/components/MainTable'
import MobileDataCard from '../../shared/components/MobileDataCard'
import MainAlert from '../../shared/components/MainAlert'
import FilterBar from '../../shared/components/FilterBar'
import PageHeader from '../../shared/components/PageHeader'
import { useVendorsList } from '../hooks/useVendorsList'
import type { VendorSummary } from '../utils/vendorCalculations'
import type { TableColumnsType } from 'antd'

const { useBreakpoint } = Grid

export default function VendorsPage() {
    const { vendors, isLoading, errorMessage } = useVendorsList()
    const screens = useBreakpoint()
    const isMobileOrTablet = !screens.lg
    const { token } = theme.useToken()
    const [searchText, setSearchText] = useState('')

    const filteredVendors = useMemo(() => {
        if (searchText.trim() === '') return vendors
        return vendors.filter((vendor) => vendor.name.toLowerCase().includes(searchText.toLowerCase()))
    }, [vendors, searchText])

    const handleSearch = (value: string) => setSearchText(value)
    const handleReset = () => setSearchText('')

    const columns: TableColumnsType<VendorSummary> = [
        {
            title: 'اسم المورد',
            dataIndex: 'name',
            key: 'name'
        },
        {
            title: 'عدد الفواتير',
            dataIndex: 'invoiceCount',
            key: 'invoiceCount'
        },
        {
            title: 'إجمالي المبلغ',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (value: number) => `${value.toLocaleString('ar-SA')} ر.س`
        },
        {
            title: 'تحتاج مراجعة',
            dataIndex: 'needsReviewCount',
            key: 'needsReviewCount',
            render: (value: number) =>
                value > 0 ? (
                    <span style={{ color: token.colorWarning, fontWeight: 600 }}>{value}</span>
                ) : (
                    <span style={{ color: token.colorTextTertiary }}>0</span>
                )
        },
        {
            title: 'آخر فاتورة',
            dataIndex: 'lastInvoiceDate',
            key: 'lastInvoiceDate',
            render: (value: string | null) => (value ? new Date(value).toLocaleDateString('ar-SA') : '—')
        }
    ]

    return (
        <>
            <PageHeader pageIcon={<ShopOutlined />} pagename1="الموردون" page1path="/vendors" />

            <FilterBar
                filters={[]}
                onFilterChange={() => {}}
                onSearch={handleSearch}
                onReset={handleReset}
                searchPlaceholder="بحث باسم المورد..."
            />

            {errorMessage ? <MainAlert alertMessage={errorMessage} alertType="error" /> : null}

            {!isLoading && filteredVendors.length === 0 ? (
                <Flex vertical align="center" justify="center" style={{ height: '60vh' }}>
                    <Empty description="لا يوجد بيانات متوفره للموردون" />
                </Flex>
            ) : isMobileOrTablet ? (
                <MobileDataCard<VendorSummary & Record<string, unknown>>
                    columns={columns as TableColumnsType<VendorSummary & Record<string, unknown>>}
                    dataSource={filteredVendors as (VendorSummary & Record<string, unknown>)[]}
                    loading={isLoading}
                />
            ) : (
                <MainTable<VendorSummary> columns={columns} dataSource={filteredVendors} loading={isLoading} rowKey="name" />
            )}
        </>
    )
}

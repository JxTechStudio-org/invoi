import { useState } from 'react'
import { Flex, Select, Input, Button } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'

interface FilterOption {
    label: string
    value: string
}

interface FilterConfig {
    key: string
    placeholder: string
    options: FilterOption[]
}

interface FilterBarProps {
    filters: FilterConfig[]
    onFilterChange: (key: string, value: string | undefined) => void
    onSearch: (value: string) => void
    onReset: () => void
    searchPlaceholder?: string
}

export default function FilterBar({
    filters,
    onFilterChange,
    onSearch,
    onReset,
    searchPlaceholder = 'بحث...'
}: FilterBarProps) {
    const [filterValues, setFilterValues] = useState<Record<string, string | undefined>>({})
    const [searchValue, setSearchValue] = useState('')

    const handleFilterChange = (key: string, value: string | undefined) => {
        setFilterValues((prev) => ({ ...prev, [key]: value }))
        onFilterChange(key, value)
    }

    const handleSearchChange = (value: string) => {
        setSearchValue(value)
        onSearch(value)
    }

    const handleReset = () => {
        setFilterValues({})
        setSearchValue('')
        onReset()
    }

    return (
        <Flex gap={12} wrap style={{ marginBottom: 16 }}>
            {filters.map((filter) => (
                <Select
                    key={filter.key}
                    placeholder={filter.placeholder}
                    options={filter.options}
                    allowClear
                    value={filterValues[filter.key]}
                    style={{ minWidth: 160 }}
                    onChange={(value) => handleFilterChange(filter.key, value)}
                />
            ))}

            <Input
                prefix={<SearchOutlined />}
                placeholder={searchPlaceholder}
                allowClear
                value={searchValue}
                style={{ maxWidth: 240 }}
                onChange={(e) => handleSearchChange(e.target.value)}
            />

            <Button icon={<ReloadOutlined />} onClick={handleReset}>
                إعادة تعيين
            </Button>
        </Flex>
    )
}

import { useMemo, useState } from 'react'

export function useSearchFilter<T extends object>(data: T[], searchableKeys: (keyof T)[]) {
    const [searchText, setSearchText] = useState('')

    const filteredData = useMemo(() => {
        if (!searchText.trim()) return data
        return data.filter((item) =>
            searchableKeys.some((key) =>
                String(item[key]).toLowerCase().includes(searchText.toLowerCase())
            )
        )
    }, [data, searchText, searchableKeys])

    return { searchText, setSearchText, filteredData }
}

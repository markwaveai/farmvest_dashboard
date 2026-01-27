import { useState, useMemo } from 'react';

type SortDirection = 'asc' | 'desc';

interface SortConfig {
    key: string;
    direction: SortDirection;
}

export function useTableSortAndSearch<T>(
    data: T[],
    initialSort: SortConfig = { key: '', direction: 'asc' },
    searchFn?: (item: T, query: string) => boolean
) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>(initialSort);

    const filteredData = useMemo(() => {
        let processData = [...data];

        // Search
        if (searchQuery) {
            if (searchFn) {
                processData = processData.filter(item => searchFn(item, searchQuery));
            } else {
                // Default generic search
                const lowerQuery = searchQuery.toLowerCase();
                processData = processData.filter(item =>
                    Object.values(item as any).some(val =>
                        String(val).toLowerCase().includes(lowerQuery)
                    )
                );
            }
        }

        // Sort
        if (sortConfig.key) {
            processData.sort((a: any, b: any) => {
                // Handle nested keys like 'order.id'
                const getNestedValue = (obj: any, path: string) => {
                    return path.split('.').reduce((o, i) => (o ? o[i] : null), obj);
                };

                const valA = getNestedValue(a, sortConfig.key);
                const valB = getNestedValue(b, sortConfig.key);

                if (valA === null) return 1;
                if (valB === null) return -1;
                if (valA === valB) return 0;

                const comparison = valA < valB ? -1 : 1;
                return sortConfig.direction === 'asc' ? comparison : -comparison;
            });
        }

        return processData;
    }, [data, searchQuery, sortConfig, searchFn]);

    const requestSort = (key: string) => {
        if (sortConfig.key === key) {
            if (sortConfig.direction === 'asc') {
                setSortConfig({ key, direction: 'desc' });
            } else {
                setSortConfig({ key: '', direction: 'asc' });
            }
        } else {
            setSortConfig({ key, direction: 'asc' });
        }
    };

    return {
        filteredData,
        searchQuery,
        setSearchQuery,
        sortConfig,
        requestSort,
    };
}

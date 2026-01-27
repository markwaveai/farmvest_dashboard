import { useState, useEffect, useRef } from 'react';

/**
 * Hook to persist a state value in localStorage.
 * @param key LocalStorage key
 * @param initialValue Default value if nothing in storage
 * @returns [value, setValue]
 */
export function usePersistentState<T>(key: string, initialValue: T) {
    const [state, setState] = useState<T>(() => {
        try {
            const saved = localStorage.getItem(key);
            if (saved !== null) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error parsing local storage key:', key, e);
        }
        return initialValue;
    });

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(state));
    }, [key, state]);

    return [state, setState] as const;
}

/**
 * Hook specifically for pagination to handle persistence.
 * @param key LocalStorage key
 * @param initialPage Default page (usually 1)
 * @returns [page, setPage]
 */
export function usePersistentPagination(key: string, initialPage: number = 1) {
    const [page, setPage] = useState<number>(() => {
        try {
            const saved = localStorage.getItem(key);
            if (saved !== null) {
                return parseInt(saved, 10);
            }
        } catch (e) { }
        return initialPage;
    });

    useEffect(() => {
        localStorage.setItem(key, page.toString());
    }, [key, page]);

    return [page, setPage] as const;
}

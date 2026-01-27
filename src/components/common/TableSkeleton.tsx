import React from 'react';

interface TableSkeletonProps {
    cols: number;
    rows?: number;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ cols, rows = 5 }) => {
    return (
        <>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={`skeleton-row-${rowIndex}`} className="animate-pulse">
                    {Array.from({ length: cols }).map((_, colIndex) => (
                        <td key={`skeleton-col-${colIndex}`} className="p-4">
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
};

export default TableSkeleton;

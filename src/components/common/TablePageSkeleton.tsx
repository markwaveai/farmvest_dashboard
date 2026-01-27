import React from 'react';
import TableSkeleton from './TableSkeleton';

const TablePageSkeleton: React.FC = () => {
    return (
        <div className="w-full h-full p-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-6">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            </div>

            {/* Filter/Stats Skeleton */}
            <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="min-w-[200px] h-24 bg-gray-200 rounded-lg flex-shrink-0"></div>
                ))}
            </div>

            {/* Table Skeleton */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {/* Table Header */}
                <div className="h-12 bg-gray-100 border-b border-gray-200 w-full mb-4"></div>
                {/* Table Body */}
                <div className="p-4">
                    <table className="w-full">
                        <tbody>
                            <TableSkeleton cols={7} rows={8} />
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TablePageSkeleton;

import React from 'react';
import TableSkeleton from '../TableSkeleton';

const TrackingPageSkeleton: React.FC = () => {
    return (
        <div className="w-full h-full p-6 animate-pulse">
            <div className="flex justify-between items-center mb-6">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-12 bg-gray-100 border-b border-gray-200 w-full mb-4"></div>
                <div className="p-4">
                    <table className="w-full">
                        <tbody>
                            <TableSkeleton cols={6} rows={10} />
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TrackingPageSkeleton;

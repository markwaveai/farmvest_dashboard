import React from 'react';

const ProductCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 animate-pulse h-full flex flex-col">
            {/* Image Skeleton */}
            <div className="h-48 bg-gray-200 w-full"></div>

            {/* Content Skeleton */}
            <div className="p-4 flex-1 flex flex-col gap-3">
                {/* Title & Badge */}
                <div className="flex justify-between items-start">
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                </div>

                {/* Meta Info */}
                <div className="flex gap-2 mt-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>

                {/* Description Lines */}
                <div className="space-y-2 mt-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>

                {/* Footer Price */}
                <div className="mt-auto pt-4 border-t border-gray-100">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mt-1"></div>
                </div>
            </div>
        </div>
    );
};

export default ProductCardSkeleton;

import React from 'react';
import './Pagination.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pages = [];
    // Bucket logic: Show 3 pages at a time (1-3, 4-6, etc.)
    const bucketSize = 3;
    const currentBucket = Math.ceil(currentPage / bucketSize);
    const startPage = (currentBucket - 1) * bucketSize + 1;
    const endPage = Math.min(startPage + bucketSize - 1, totalPages);

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    return (
        <div className="pagination-container">
            <button
                className="pagination-btn 2xl:py-4 2xl:px-8 4xl:py-10 4xl:px-20 5xl:py-16 5xl:px-32 2xl:text-2xl 4xl:text-[40px] 5xl:text-[60px]"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                <ChevronLeft className="w-4 h-4 2xl:w-8 2xl:h-8 4xl:w-16 4xl:h-16 5xl:w-24 5xl:h-24" />
                <span className="pagination-btn-text ml-1 2xl:ml-4 4xl:ml-8 5xl:ml-12">Previous</span>
            </button>

            <div className="pagination-numbers">
                {pages.map((page, index) => (
                    <button
                        key={index}
                        className={`pagination-number ${page === currentPage ? 'active' : ''} 2xl:w-12 2xl:h-12 4xl:w-24 4xl:h-24 5xl:w-36 5xl:h-36 2xl:text-2xl 4xl:text-[40px] 5xl:text-[60px]`}
                        onClick={() => onPageChange(page)}
                    >
                        {page}
                    </button>
                ))}
            </div>

            <button
                className="pagination-btn 2xl:py-4 2xl:px-8 4xl:py-10 4xl:px-20 5xl:py-16 5xl:px-32 2xl:text-2xl 4xl:text-[40px] 5xl:text-[60px]"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                <span className="pagination-btn-text mr-1 2xl:mr-4 4xl:mr-8 5xl:mr-12">Next</span>
                <ChevronRight className="w-4 h-4 2xl:w-8 2xl:h-8 4xl:w-16 4xl:h-16 5xl:w-24 5xl:h-24" />
            </button>
        </div>
    );
};

export default Pagination;

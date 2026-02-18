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
                className="pagination-btn"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                <ChevronLeft size={16} />
                <span className="pagination-btn-text">Previous</span>
            </button>

            <div className="pagination-numbers">
                {pages.map((page, index) => (
                    <button
                        key={index}
                        className={`pagination-number ${page === currentPage ? 'active' : ''}`}
                        onClick={() => onPageChange(page)}
                    >
                        {page}
                    </button>
                ))}
            </div>

            <button
                className="pagination-btn"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                <span className="pagination-btn-text">Next</span>
                <ChevronRight size={16} />
            </button>
        </div>
    );
};

export default Pagination;

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import { setProofModal } from '../../store/slices/uiSlice';
import './ImageNamesModal.css';

interface ImageNamesModalProps { }

const ImageNamesModal: React.FC<ImageNamesModalProps> = () => {
    const dispatch = useAppDispatch();
    const { isOpen, data } = useAppSelector((state: RootState) => state.ui.modals.proof);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const onClose = () => {
        dispatch(setProofModal({ isOpen: false }));
    };

    if (!isOpen || !data) return null;

    const isImage = (key: string, value: any) => {
        if (typeof value !== 'string') return false;
        const lowerKey = key.toLowerCase();
        const lowerValue = value.toLowerCase();
        return (
            lowerKey.includes('image') ||
            lowerKey.includes('photo') ||
            lowerKey.includes('proof') ||
            lowerKey.includes('card') ||
            lowerValue.match(/\.(jpeg|jpg|png|gif|webp)(\?.*)?$/)
        );
    };

    const imageFields: [string, any][] = [];

    if (data) {
        Object.entries(data).forEach(([key, value]) => {
            if (isImage(key, value)) {
                imageFields.push([key, value]);
            }
        });

        if (data.transaction && typeof data.transaction === 'object') {
            Object.entries(data.transaction).forEach(([key, value]) => {
                if (isImage(key, value)) {
                    imageFields.push([`Transaction: ${key} `, value]);
                }
            });
        }
    }

    const handleClose = () => {
        setViewingImage(null);
        setIsLoading(false);
        onClose();
    };

    const handleViewImage = (url: string) => {
        setViewingImage(url);
        setIsLoading(true);
    };

    return (
        <div className="image-names-modal-overlay" onClick={handleClose}>
            <div
                className={`image-names-modal-content ${viewingImage ? 'viewing-image' : ''}`}
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={handleClose}
                    className="image-names-modal-close-btn"
                >
                    ×
                </button>

                {viewingImage ? (
                    <div className="viewing-image-container">
                        <h3 className="modal-section-title">
                            View Document
                        </h3>

                        <div className="image-preview-wrapper">
                            {isLoading && (
                                <div className="image-loading-overlay">
                                    <div className="image-spinner" />
                                    <span className="image-loading-text">Loading...</span>
                                </div>
                            )}
                            <img
                                src={viewingImage}
                                alt="ID Proof"
                                onLoad={() => setIsLoading(false)}
                                onError={() => setIsLoading(false)}
                                className="preview-image"
                                style={{ opacity: isLoading ? 0 : 1 }}
                            />
                        </div>

                        <div className="image-actions">
                            <button
                                onClick={() => setViewingImage(null)}
                                className="back-btn"
                            >
                                &larr; Back to List
                            </button>
                            <a
                                href={viewingImage}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="open-original-btn"
                            >
                                Open Original
                            </a>
                        </div>
                    </div>
                ) : (
                    <>
                        <h3 className="modal-section-title">
                            Payment Proof Files: {data.name}
                        </h3>

                        {imageFields.length === 0 ? (
                            <p className="no-docs-text">No Payment proof documents found.</p>
                        ) : (
                            <div className="image-list">
                                {imageFields.map(([key, value]) => (
                                    <div key={key} className="image-list-item">
                                        <div className="image-key">
                                            {key}
                                        </div>
                                        <button
                                            onClick={() => handleViewImage(String(value))}
                                            className="view-link-btn"
                                        >
                                            View
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="modal-footer">
                            <button
                                onClick={handleClose}
                                className="close-action-btn"
                            >
                                Close
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ImageNamesModal;

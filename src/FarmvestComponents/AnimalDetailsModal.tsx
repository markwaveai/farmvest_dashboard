import React, { useEffect, useState } from 'react';
import { farmvestService } from '../services/farmvest_api';
import './AnimalDetailsModal.css';
import {
    X,
    User,
    Tag,
    Calendar,
    Hash,
    MapPin,
    Heart,
    Image as ImageIcon,
    Loader2,
    Shield,
    Phone,
    Mail,
    CreditCard
} from 'lucide-react';

interface AnimalDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    rfid: string;
}

const AnimalDetailsModal: React.FC<AnimalDetailsModalProps> = ({ isOpen, onClose, rfid }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && rfid) {
            fetchAnimalDetails();
        }
    }, [isOpen, rfid]);

    const fetchAnimalDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log(`[AnimalDetailsModal] Fetching details for RFID: ${rfid}`);
            const result = await farmvestService.searchAnimal(rfid);
            console.log('[AnimalDetailsModal] API Result:', result);
            setData(result);
        } catch (err: any) {
            console.error('Failed to load animal details', err);
            setError('Failed to load buffalo details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const animal = data?.animal_details || {};
    const investor = data?.investor_details || {};
    const animalImage = (animal.images && Array.isArray(animal.images) && animal.images.length > 0)
        ? animal.images[0]
        : null;

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="animal-details-overlay" onClick={onClose}>
            <div className="animal-details-content" onClick={e => e.stopPropagation()}>
                <div className="animal-details-header">
                    <h2>
                        <Heart className="text-emerald-500" size={24} />
                        Buffalo Details
                    </h2>
                    <button className="close-details-btn" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="animal-details-body">
                    {loading ? (
                        <div className="loading-details">
                            <Loader2 size={40} className="animate-spin text-emerald-500" />
                            <p>Fetching full details...</p>
                        </div>
                    ) : error ? (
                        <div className="error-details">
                            <p>{error}</p>
                            <button onClick={fetchAnimalDetails} className="retry-details-btn">Retry</button>
                        </div>
                    ) : (
                        <>
                            <div className="animal-image-container">
                                {animalImage ? (
                                    <img src={animalImage} alt="Animal" className="animal-detail-img" />
                                ) : (
                                    <div className="no-image-placeholder">
                                        <ImageIcon size={48} />
                                        <span>No Image Available</span>
                                    </div>
                                )}
                            </div>

                            <div className="details-section">
                                <h3 className="section-title">
                                    <Tag size={16} /> Animal Information
                                </h3>
                                <div className="details-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">RFID Tag</span>
                                        <span className="detail-value">{animal.rfid_tag_number || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Animal ID</span>
                                        <span className="detail-value">{animal.animal_id || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Type</span>
                                        <span className="detail-value">{animal.animal_type || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Age (Months)</span>
                                        <span className="detail-value">{animal.age_months || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Health Status</span>
                                        <span className="detail-value">{animal.health_status || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Onboarded At</span>
                                        <span className="detail-value">{formatDate(animal.onboarded_at)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="details-section">
                                <h3 className="section-title">
                                    <User size={16} /> Investor Information
                                </h3>
                                <div className="details-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Full Name</span>
                                        <span className="detail-value">{investor.full_name || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Mobile</span>
                                        <span className="detail-value">{investor.mobile || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Email</span>
                                        <span className="detail-value">{investor.email || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Aadhar Number</span>
                                        <span className="detail-value">{investor.aadhar_number || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnimalDetailsModal;

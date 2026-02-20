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
    rfid?: string;
    parkingId?: string;
    farmId?: number;
    shedId?: number;
    rowNumber?: string;
}

const AnimalDetailsModal: React.FC<AnimalDetailsModalProps> = ({ isOpen, onClose, rfid, parkingId, farmId, shedId, rowNumber }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Priority to Parking ID as it's the new flow
            if (parkingId) {
                fetchByParkingId(parkingId, farmId, shedId, rowNumber);
            } else if (rfid) {
                fetchAnimalDetails(rfid);
            }
        }
    }, [isOpen, rfid, parkingId, farmId, shedId, rowNumber]);

    // Scroll Reveal Observer
    useEffect(() => {
        if (!isOpen || loading || error) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target); // Trigger once
                }
            });
        }, { threshold: 0.1 });

        const sections = document.querySelectorAll('.scroll-reveal-section');
        sections.forEach(section => observer.observe(section));

        return () => observer.disconnect();
    }, [isOpen, loading, error, data]); // Re-run when data loads/modals opens

    const fetchByParkingId = async (pId: string, fId?: number, sId?: number, rNum?: string) => {
        try {
            setLoading(true);
            setError(null);

            // Log full context for debugging

            // Prevent API calls with invalid numeric identifiers
            if ((fId !== undefined && isNaN(fId)) || (sId !== undefined && isNaN(sId))) {
                setError('Invalid identifiers provided. Please select farm and shed again.');
                setLoading(false);
                return;
            }

            const result = await farmvestService.getAnimalPositionDetails({
                parkingId: pId,
                farmId: fId,
                shedId: sId,
                rowNumber: rNum
            });
            setData(result?.data || result); // Handle wrapped response
        } catch (err: any) {
            setError('Failed to load slot details. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    const fetchAnimalDetails = async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            const result = await farmvestService.searchAnimal(id);
            setData(result);
        } catch (err: any) {
            setError('Failed to load buffalo details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const animal = data?.animal_details || {};
    const investor = data?.investor_details || {};
    const supervisor = data?.supervisor || {};
    const manager = data?.farm_manager || {};

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
                            <button onClick={() => parkingId ? fetchByParkingId(parkingId, farmId, shedId, rowNumber) : rfid && fetchAnimalDetails(rfid)} className="retry-details-btn">Retry</button>
                        </div>
                    ) : (
                        <>
                            <div className="animal-image-container scroll-reveal-section">
                                {(animalImage || (!animal.animal_type || String(animal.animal_type).toUpperCase() === 'BUFFALO')) ? (
                                    <img
                                        src={animalImage || "/buffalo_green_icon.png"}
                                        alt="Animal"
                                        className="animal-detail-img"
                                        style={{ objectFit: 'contain' }}
                                    />
                                ) : (
                                    <div className="no-image-placeholder">
                                        <ImageIcon size={48} />
                                        <span>No Image Available</span>
                                    </div>
                                )}
                            </div>

                            <div className="details-section scroll-reveal-section">
                                <h3 className="section-title">
                                    <Tag size={16} /> Animal Information
                                </h3>
                                <div className="details-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">RFID Tag</span>
                                        <span className="detail-value">{animal.rfid_tag_number || animal.rfid || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Animal ID</span>
                                        <span className="detail-value">{animal.animal_id || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Breed</span>
                                        <span className="detail-value">{animal.breed_name || animal.animal_type || 'N/A'}</span>
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
                                        <span className="detail-value">{formatDate(animal.onboarded_at || animal.onboarding_time)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Location ID</span>
                                        <span className="detail-value">{animal.parking_id || parkingId || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* New Location Details Section */}
                            {(data?.farm_details || data?.shed_details) && (
                                <div className="details-section scroll-reveal-section">
                                    <h3 className="section-title">
                                        <MapPin size={16} /> Location Details
                                    </h3>
                                    <div className="details-grid">
                                        <div className="detail-item">
                                            <span className="detail-label">Farm</span>
                                            <span className="detail-value">{data.farm_details?.farm_name || 'N/A'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Location</span>
                                            <span className="detail-value">{data.farm_details?.location || 'N/A'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Shed</span>
                                            <span className="detail-value">{data.shed_details?.shed_name || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="details-section scroll-reveal-section">
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
                                </div>
                            </div>

                            {(manager.full_name || supervisor.full_name) && (
                                <div className="details-section scroll-reveal-section">
                                    <h3 className="section-title">
                                        <Shield size={16} /> Staff Information
                                    </h3>
                                    <div className="details-grid">
                                        {manager.full_name && (
                                            <div className="detail-item">
                                                <span className="detail-label">Farm Manager</span>
                                                <span className="detail-value">{manager.full_name} <br /> <span className="text-xs text-gray-500">{manager.mobile}</span></span>
                                            </div>
                                        )}
                                        {supervisor.full_name && (
                                            <div className="detail-item">
                                                <span className="detail-label">Supervisor</span>
                                                <span className="detail-value">{supervisor.full_name} <br /> <span className="text-xs text-gray-500">{supervisor.mobile}</span></span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnimalDetailsModal;

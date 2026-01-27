import React, { useState, useEffect } from 'react';
import './ReferralModal.css'; // Reusing modal styles

interface EditProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any, file: File | null) => void;
    product: any;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    product
}) => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        id: '',
        breed: '',
        age: '',
        location: '',
        price: '',
        insurance: '',
        description: '',
        inStock: true,
    });

    useEffect(() => {
        if (product) {
            setFormData({
                id: product.id || '',
                breed: product.breed || '',
                age: product.age || '',
                location: product.location || '',
                price: product.price || '',
                insurance: product.insurance || '',
                description: product.description || '',
                inStock: product.inStock !== undefined ? product.inStock : true,
            });
            setImageFile(null);
        }
    }, [product]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleStockChange = (status: boolean) => {
        setFormData(prev => ({ ...prev, inStock: status }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData, imageFile);
    };

    if (!isOpen) return null;

    return (
        <div className={`referral-modal-container visible`}>
            <div className={`referral-overlay visible`} onClick={onClose} />

            <div className={`referral-drawer open`}>
                <div className="referral-header">
                    <div>
                        <h3>Edit Product</h3>
                        <p>Update product details</p>
                    </div>
                    <button onClick={onClose} className="close-btn">
                        <span className="close-icon">×</span>
                    </button>
                </div>

                <div className="referral-content">
                    <form onSubmit={handleSubmit} className="referral-form">
                        <div className="form-group">
                            <label className="form-label">Name</label>
                            <input
                                type="text"
                                name="breed"
                                value={formData.breed}
                                onChange={handleInputChange}
                                required
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">ID</label>
                            <input
                                type="text"
                                name="id"
                                value={formData.id}
                                onChange={handleInputChange}
                                className="form-input"
                                placeholder="Product ID"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    className={`py-1.5 px-3 text-sm rounded-md border w-32 transition-colors ${formData.inStock ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300'}`}
                                    onClick={() => handleStockChange(true)}
                                >
                                    In Stock
                                </button>
                                <button
                                    type="button"
                                    className={`py-1.5 px-3 text-sm rounded-md border w-32 transition-colors ${!formData.inStock ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-300'}`}
                                    onClick={() => handleStockChange(false)}
                                >
                                    Out of Stock
                                </button>
                            </div>
                        </div>



                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="form-col">
                                <label className="form-label">Age (years)</label>
                                <input
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleInputChange}
                                    required
                                    className="form-input"
                                />
                            </div>
                            <div className="form-col">
                                <label className="form-label">Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    required
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="form-col">
                                <label className="form-label">Price</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    required
                                    className="form-input"
                                />
                            </div>
                            <div className="form-col">
                                <label className="form-label">Insurance</label>
                                <input
                                    type="number"
                                    name="insurance"
                                    value={formData.insurance}
                                    onChange={handleInputChange}
                                    required
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                required
                                className="form-input"
                                rows={4}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Product Image</label>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="form-input"
                                accept="image/*"
                            />
                            {imageFile && <p className="text-sm text-gray-500 mt-1">Selected: {imageFile.name}</p>}
                        </div>

                        <div className="form-actions">
                            <button type="button" onClick={onClose} className="btn-cancel">
                                Cancel
                            </button>
                            <button type="submit" className="btn-submit">
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditProductModal;

import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { addProduct, updateProduct } from '../../store/slices/productsSlice';
import './ProductFormModal.css';

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    product?: any; // If provided, it's an edit mode
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, product }) => {
    const dispatch = useAppDispatch();
    const [formData, setFormData] = useState({
        breed: '',
        age: '3',
        location: '',
        price: '175000',
        cpf: '15000',
        buffaloId: 'BID-001',
        description: '',
        inStock: true,
        images: null as FileList | null
    });
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (product) {
            setFormData({
                breed: product.breed || '',
                age: product.age || '',
                location: product.location || '',
                price: product.price || '',
                cpf: product.cpf || '15000',
                buffaloId: product.buffaloId || 'BID-001',
                description: product.description || '',
                inStock: product.inStock !== false, // Default to true if undefined
                images: null
            });
        } else {
            setFormData({
                breed: '',
                age: '3',
                location: '',
                price: '175000',
                cpf: '15000',
                buffaloId: 'BID-001',
                description: '',
                inStock: true,
                images: null
            });
            setPreviewUrls([]);
        }
    }, [product, isOpen]);

    useEffect(() => {
        // Cleanup function to revoke object URLs to avoid memory leaks
        return () => {
            previewUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [previewUrls]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'file') {
            const files = (e.target as HTMLInputElement).files;
            setFormData(prev => ({ ...prev, images: files }));

            // Generate preview URLs
            if (files && files.length > 0) {
                const urls = Array.from(files).map(file => URL.createObjectURL(file));
                setPreviewUrls(prev => {
                    // Revoke old previews
                    prev.forEach(url => URL.revokeObjectURL(url));
                    return urls;
                });
            } else {
                setPreviewUrls(prev => {
                    prev.forEach(url => URL.revokeObjectURL(url));
                    return [];
                });
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('breed', formData.breed);
            formDataToSend.append('age', formData.age);
            formDataToSend.append('location', formData.location);
            formDataToSend.append('price', formData.price);
            formDataToSend.append('cpf', formData.cpf);
            formDataToSend.append('buffaloId', formData.buffaloId);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('inStock', String(formData.inStock));

            if (formData.images && formData.images.length > 0) {
                for (let i = 0; i < formData.images.length; i++) {
                    formDataToSend.append('images', formData.images[i]);
                }
            }

            if (product) {
                await dispatch(updateProduct({ id: product.id, data: formDataToSend })).unwrap();
            } else {
                await dispatch(addProduct(formDataToSend)).unwrap();
            }
            onClose();
        } catch (error) {
            console.error('Failed to save product:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay"
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', zIndex: 1000
            }}
            onClick={onClose}
        >
            <div className="product-form-modal" onClick={(e) => e.stopPropagation()}>
                <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Breed / Title</label>
                            <input
                                type="text"
                                name="breed"
                                value={formData.breed}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Age (years)</label>
                            <input
                                type="number"
                                name="age"
                                value={formData.age}
                                onChange={handleChange}
                                required
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Price (₹)</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                required
                                min="0"
                            />
                        </div>
                        <div className="form-group">
                            <label>CPF Cost</label>
                            <input
                                type="text"
                                name="cpf"
                                value={formData.cpf}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Buffalo ID</label>
                        <input
                            type="text"
                            name="buffaloId"
                            value={formData.buffaloId}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Location</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Image Upload in Form */}
                    <div className="form-group">
                        <label>Product Images</label>
                        <div className="file-input-wrapper">
                            <input
                                type="file"
                                name="images"
                                onChange={handleChange}
                                multiple={true}
                                accept="image/*"
                            />
                        </div>
                        <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
                            {product ? 'Upload to add/replace images' : 'Select images for the product'}
                        </small>
                    </div>

                    {/* Image Previews */}
                    {(previewUrls.length > 0 || (product?.buffalo_images?.length > 0)) && (
                        <div className="form-group">
                            <label>Selected Previews</label>
                            <div className="image-previews-grid">
                                {previewUrls.length > 0 ? (
                                    previewUrls.map((url, index) => (
                                        <div key={index} className="preview-item">
                                            <img src={url} alt={`Preview ${index}`} />
                                        </div>
                                    ))
                                ) : (
                                    product?.buffalo_images?.map((img: string, index: number) => (
                                        <div key={index} className="preview-item">
                                            <img src={img} alt={`Existing ${index}`} />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    <div className="form-group checkbox-group">
                        <input
                            type="checkbox"
                            name="inStock"
                            id="inStock"
                            checked={formData.inStock}
                            onChange={handleChange}
                        />
                        <label htmlFor="inStock" style={{ marginBottom: 0 }}>Available in Stock</label>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Saving...' : (product ? 'Update Product' : 'Add Product')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductFormModal;

import React, { useState } from 'react';

interface ProductImageCarouselProps {
    images: string[];
    breed: string;
    inStock: boolean;
}

const ProductImageCarousel: React.FC<ProductImageCarouselProps> = ({ images, breed, inStock }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '3/2', overflow: 'hidden' }}>
            <img
                src={images[currentImageIndex]}
                alt={`${breed} ${currentImageIndex + 1}`}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: inStock ? 'none' : 'grayscale(30%)'
                }}
            />

            {/* Navigation arrows - only show if multiple images */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={prevImage}
                        style={{
                            position: 'absolute',
                            left: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px'
                        }}
                    >
                        ‹
                    </button>
                    <button
                        onClick={nextImage}
                        style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px'
                        }}
                    >
                        ›
                    </button>
                </>
            )}

            {/* Image indicators - only show if multiple images */}
            {images.length > 1 && (
                <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '4px'
                }}>
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                border: 'none',
                                background: index === currentImageIndex ? 'white' : 'rgba(255,255,255,0.5)',
                                cursor: 'pointer'
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Out of stock overlay */}
            {!inStock && (
                <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: '#dc2626',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600'
                }}>
                    Out of Stock
                </div>
            )}
        </div>
    );
};

export default ProductImageCarousel;

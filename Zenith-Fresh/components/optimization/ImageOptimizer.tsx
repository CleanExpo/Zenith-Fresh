'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  enableWebP?: boolean;
  enableAvif?: boolean;
  lazyLoadOffset?: number;
  fadeInDuration?: number;
  showPlaceholder?: boolean;
}

interface ImageVariant {
  src: string;
  format: 'webp' | 'avif' | 'jpeg' | 'png';
  width: number;
  quality: number;
}

/**
 * Advanced Image Optimizer with lazy loading, format optimization, and responsive images
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 85,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  fill = false,
  objectFit = 'cover',
  objectPosition = 'center',
  loading = 'lazy',
  onLoad,
  onError,
  fallbackSrc,
  enableWebP = true,
  enableAvif = true,
  lazyLoadOffset = 100,
  fadeInDuration = 300,
  showPlaceholder = true,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority || loading === 'eager');
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate responsive image variants
  const imageVariants = useMemo(() => {
    const variants: ImageVariant[] = [];
    const baseWidth = width || 800;
    const breakpoints = [320, 640, 768, 1024, 1200, 1920];
    
    breakpoints.forEach(breakpoint => {
      if (breakpoint <= baseWidth) {
        // AVIF variant
        if (enableAvif) {
          variants.push({
            src: generateOptimizedUrl(src, breakpoint, quality, 'avif'),
            format: 'avif',
            width: breakpoint,
            quality,
          });
        }
        
        // WebP variant
        if (enableWebP) {
          variants.push({
            src: generateOptimizedUrl(src, breakpoint, quality, 'webp'),
            format: 'webp',
            width: breakpoint,
            quality,
          });
        }
        
        // JPEG fallback
        variants.push({
          src: generateOptimizedUrl(src, breakpoint, quality, 'jpeg'),
          format: 'jpeg',
          width: breakpoint,
          quality,
        });
      }
    });
    
    return variants;
  }, [src, width, quality, enableWebP, enableAvif]);

  // Generate blur placeholder
  const blurPlaceholder = useMemo(() => {
    if (blurDataURL) return blurDataURL;
    if (placeholder === 'blur' && showPlaceholder) {
      return generateBlurPlaceholder(src);
    }
    return undefined;
  }, [blurDataURL, placeholder, showPlaceholder, src]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || loading === 'eager') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: `${lazyLoadOffset}px`,
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, loading, lazyLoadOffset]);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    setHasError(true);
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
    } else {
      onError?.();
    }
  };

  // Generate srcSet for responsive images
  const generateSrcSet = (format: 'avif' | 'webp' | 'jpeg') => {
    return imageVariants
      .filter(variant => variant.format === format)
      .map(variant => `${variant.src} ${variant.width}w`)
      .join(', ');
  };

  // Preload critical images
  useEffect(() => {
    if (priority && isInView) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = currentSrc;
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, isInView, currentSrc]);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    overflow: 'hidden',
    ...(width && height && !fill ? { width, height } : {}),
    ...(fill ? { width: '100%', height: '100%' } : {}),
  };

  const imageStyle: React.CSSProperties = {
    opacity: isLoaded ? 1 : 0,
    transition: `opacity ${fadeInDuration}ms ease-in-out`,
    ...(fill ? {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit,
      objectPosition,
    } : {}),
  };

  const placeholderStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isLoaded ? 0 : 1,
    transition: `opacity ${fadeInDuration}ms ease-in-out`,
    zIndex: 1,
  };

  if (!isInView) {
    return (
      <div
        ref={containerRef}
        className={className}
        style={containerStyle}
      >
        {showPlaceholder && (
          <div style={placeholderStyle}>
            <div className="w-8 h-8 bg-gray-300 rounded animate-pulse" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={containerStyle}
    >
      {/* Modern browsers with AVIF support */}
      {enableAvif && (
        <picture>
          <source
            type="image/avif"
            srcSet={generateSrcSet('avif')}
            sizes={sizes}
          />
          <source
            type="image/webp"
            srcSet={generateSrcSet('webp')}
            sizes={sizes}
          />
          <Image
            ref={imgRef}
            src={currentSrc}
            alt={alt}
            width={width}
            height={height}
            quality={quality}
            priority={priority}
            placeholder={placeholder}
            blurDataURL={blurPlaceholder}
            sizes={sizes}
            fill={fill}
            style={imageStyle}
            onLoad={handleLoad}
            onError={handleError}
            loading={loading}
          />
        </picture>
      )}

      {/* Fallback for browsers without picture element support */}
      {!enableAvif && (
        <Image
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          quality={quality}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurPlaceholder}
          sizes={sizes}
          fill={fill}
          style={imageStyle}
          onLoad={handleLoad}
          onError={handleError}
          loading={loading}
        />
      )}

      {/* Loading placeholder */}
      {showPlaceholder && !isLoaded && !hasError && (
        <div style={placeholderStyle}>
          <LoadingSpinner />
        </div>
      )}

      {/* Error placeholder */}
      {hasError && (
        <div style={placeholderStyle}>
          <ErrorPlaceholder />
        </div>
      )}

      {/* Blur placeholder overlay */}
      {blurPlaceholder && !isLoaded && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${blurPlaceholder})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
            opacity: isLoaded ? 0 : 1,
            transition: `opacity ${fadeInDuration}ms ease-in-out`,
            zIndex: 2,
          }}
        />
      )}
    </div>
  );
};

/**
 * Lazy Loading Container for multiple images
 */
interface LazyLoadContainerProps {
  children: React.ReactNode;
  offset?: number;
  className?: string;
  onEnterView?: () => void;
  onExitView?: () => void;
}

export const LazyLoadContainer: React.FC<LazyLoadContainerProps> = ({
  children,
  offset = 100,
  className,
  onEnterView,
  onExitView,
}) => {
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isInView) {
            setIsInView(true);
            onEnterView?.();
          } else if (!entry.isIntersecting && isInView) {
            setIsInView(false);
            onExitView?.();
          }
        });
      },
      {
        rootMargin: `${offset}px`,
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [offset, isInView, onEnterView, onExitView]);

  return (
    <div ref={containerRef} className={className}>
      {isInView ? children : <LazyPlaceholder />}
    </div>
  );
};

/**
 * Progressive Image Gallery with lazy loading
 */
interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    width?: number;
    height?: number;
    caption?: string;
  }>;
  columns?: number;
  gap?: number;
  lazyLoadOffset?: number;
  enableLightbox?: boolean;
  className?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  columns = 3,
  gap = 16,
  lazyLoadOffset = 200,
  enableLightbox = false,
  className,
}) => {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${gap}px`,
  };

  const handleImageClick = (src: string) => {
    if (enableLightbox) {
      setLightboxImage(src);
    }
  };

  return (
    <>
      <div className={className} style={gridStyle}>
        {images.map((image, index) => (
          <div
            key={index}
            className="cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => handleImageClick(image.src)}
          >
            <LazyLoadContainer offset={lazyLoadOffset}>
            <OptimizedImage
              src={image.src}
              alt={image.alt}
              width={image.width || 400}
              height={image.height || 300}
              className="w-full h-auto rounded-lg"
              loading="lazy"
              enableWebP
              enableAvif
              showPlaceholder
            />
            {image.caption && (
              <p className="mt-2 text-sm text-gray-600 text-center">
                {image.caption}
              </p>
            )}
          </LazyLoadContainer>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {enableLightbox && lightboxImage && (
        <Lightbox
          src={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </>
  );
};

/**
 * Image Lightbox Component
 */
interface LightboxProps {
  src: string;
  onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ src, onClose }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-4xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 text-white text-2xl font-bold hover:text-gray-300 z-10"
          onClick={onClose}
        >
          ×
        </button>
        <OptimizedImage
          src={src}
          alt="Lightbox image"
          className="max-w-full max-h-full object-contain"
          priority
          enableWebP
          enableAvif
          fill
        />
      </div>
    </div>
  );
};

/**
 * Helper Components
 */
const LoadingSpinner: React.FC = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
);

const ErrorPlaceholder: React.FC = () => (
  <div className="flex flex-col items-center text-gray-400">
    <svg className="w-8 h-8 mb-2" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
    <span className="text-xs">Failed to load</span>
  </div>
);

const LazyPlaceholder: React.FC = () => (
  <div className="w-full h-48 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
    <div className="w-8 h-8 bg-gray-300 rounded" />
  </div>
);

/**
 * Utility Functions
 */
function generateOptimizedUrl(
  src: string,
  width: number,
  quality: number,
  format: 'avif' | 'webp' | 'jpeg' | 'png'
): string {
  // This would integrate with your image optimization service
  // For now, return the original src with query parameters
  const url = new URL(src, 'https://example.com');
  url.searchParams.set('w', width.toString());
  url.searchParams.set('q', quality.toString());
  url.searchParams.set('f', format);
  return url.toString();
}

function generateBlurPlaceholder(src: string): string {
  // Generate a tiny, blurred version of the image
  // This would typically be done at build time or by your image service
  const tinyUrl = generateOptimizedUrl(src, 10, 10, 'jpeg');
  return tinyUrl;
}

/**
 * Performance monitoring hook
 */
export function useImagePerformance() {
  const [metrics, setMetrics] = useState({
    totalImages: 0,
    loadedImages: 0,
    failedImages: 0,
    averageLoadTime: 0,
    largestContentfulPaint: 0,
  });

  useEffect(() => {
    // Monitor image loading performance
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      for (const entry of entries) {
        if (entry.entryType === 'largest-contentful-paint') {
          setMetrics(prev => ({
            ...prev,
            largestContentfulPaint: entry.startTime,
          }));
        }
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });

    return () => observer.disconnect();
  }, []);

  const recordImageLoad = (loadTime: number, success: boolean) => {
    setMetrics(prev => ({
      ...prev,
      totalImages: prev.totalImages + 1,
      loadedImages: success ? prev.loadedImages + 1 : prev.loadedImages,
      failedImages: success ? prev.failedImages : prev.failedImages + 1,
      averageLoadTime: success 
        ? (prev.averageLoadTime * prev.loadedImages + loadTime) / (prev.loadedImages + 1)
        : prev.averageLoadTime,
    }));
  };

  return { metrics, recordImageLoad };
}
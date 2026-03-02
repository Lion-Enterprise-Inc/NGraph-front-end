import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ImageViewerProps {
  images: string[];
  alt: string;
  size?: number;
  imageRank?: string | null;  // null/C=AI生成, A=admin, S=店主
  isJa?: boolean;
  uploadState?: 'idle' | 'uploading' | 'done';
  uploadResult?: { status: string; match_result: string };
  onUploadClick?: () => void;
  uploadLabel?: string;
}

/* ---------- Lightbox ---------- */
function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close">&times;</button>
      <img
        className="lightbox-img"
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

/* ---------- ImageViewer ---------- */
export default function ImageViewer({
  images,
  alt,
  size = 130,
  imageRank,
  isJa = true,
  uploadState = 'idle',
  uploadResult,
  onUploadClick,
  uploadLabel = 'Add photo',
}: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const swiping = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    swiping.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping.current) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!swiping.current) return;
    swiping.current = false;
    const threshold = 50;
    if (touchDeltaX.current < -threshold && currentIndex < images.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else if (touchDeltaX.current > threshold && currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex, images.length]);

  // No images — show upload UI
  if (images.length === 0) {
    return (
      <div className="nfg-card-thumb" style={{ width: size, height: size }}>
        <div className="nfg-photo-upload" onClick={onUploadClick}>
          {uploadState === 'uploading' ? (
            <div className="nfg-photo-spinner" />
          ) : uploadResult ? (
            <div className="nfg-photo-result">
              {uploadResult.match_result === 'match' || uploadResult.status === 'approved'
                ? '\u2705'
                : uploadResult.match_result === 'mismatch'
                ? '\u274C'
                : uploadResult.status === 'rate_limit'
                ? '\u23F3'
                : '\uD83D\uDCE4'}
              <span className="nfg-photo-msg">
                {uploadResult.status === 'approved'
                  ? (uploadLabel === '\u5199\u771F\u3092\u6295\u7A3F' ? '\u63A1\u7528!' : 'Adopted!')
                  : uploadResult.match_result === 'mismatch'
                  ? (uploadLabel === '\u5199\u771F\u3092\u6295\u7A3F' ? '\u4E0D\u4E00\u81F4' : 'Mismatch')
                  : uploadResult.status === 'rate_limit'
                  ? (uploadLabel === '\u5199\u771F\u3092\u6295\u7A3F' ? '\u4E0A\u9650' : 'Limit')
                  : uploadResult.status === 'pending'
                  ? (uploadLabel === '\u5199\u771F\u3092\u6295\u7A3F' ? '\u78BA\u8A8D\u4E2D' : 'Pending')
                  : (uploadLabel === '\u5199\u771F\u3092\u6295\u7A3F' ? '\u30A8\u30E9\u30FC' : 'Error')}
              </span>
            </div>
          ) : (
            <>
              <span className="nfg-photo-icon">{'\uD83D\uDCF7'}</span>
              <span className="nfg-photo-label">{uploadLabel}</span>
            </>
          )}
        </div>
      </div>
    );
  }

  const multi = images.length > 1;

  return (
    <>
      <div
        className="nfg-card-thumb"
        style={{ width: size, height: size }}
        onTouchStart={multi ? handleTouchStart : undefined}
        onTouchMove={multi ? handleTouchMove : undefined}
        onTouchEnd={multi ? handleTouchEnd : undefined}
      >
        <img
          src={images[currentIndex]}
          alt={alt}
          loading="lazy"
          onClick={() => setLightboxOpen(true)}
          style={{ cursor: 'pointer' }}
        />
        {imageRank === 'C' && (
          <span className="image-rank-badge">
            {isJa ? '※イメージ' : '※Image'}
          </span>
        )}
        {multi && (
          <div className="carousel-dots">
            {images.map((_, i) => (
              <span
                key={i}
                className={`carousel-dot${i === currentIndex ? ' active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
              />
            ))}
          </div>
        )}
      </div>
      {lightboxOpen && (
        <Lightbox
          src={images[currentIndex]}
          alt={alt}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

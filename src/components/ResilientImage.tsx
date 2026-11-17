import { useEffect, useState, type ReactNode } from 'react';

interface ResilientImageProps {
  src?: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  decoding?: 'async' | 'sync' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
  renderFallback?: () => ReactNode;
}

export function ResilientImage({
  src,
  fallbackSrc,
  alt,
  className,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  renderFallback,
}: ResilientImageProps) {
  const [activeSrc, setActiveSrc] = useState<string | undefined>(src);
  const [exhausted, setExhausted] = useState<boolean>(!src && !fallbackSrc);

  useEffect(() => {
    setActiveSrc(src || fallbackSrc);
    setExhausted(!src && !fallbackSrc);
  }, [src, fallbackSrc]);

  if (exhausted || !activeSrc) {
    return renderFallback ? <>{renderFallback()}</> : null;
  }

  const isExternal = /^https?:\/\//i.test(activeSrc);

  return (
    <img
      src={activeSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      referrerPolicy={isExternal ? 'no-referrer' : undefined}
      onError={() => {
        if (fallbackSrc && activeSrc !== fallbackSrc) {
          setActiveSrc(fallbackSrc);
        } else {
          setExhausted(true);
        }
      }}
    />
  );
}

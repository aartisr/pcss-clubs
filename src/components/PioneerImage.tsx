import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { resolveBuiltInImageUrl } from '../data/registry';

interface PioneerImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  priority?: boolean;
}

export function PioneerImage({
  src,
  alt,
  className = '',
  fallbackTitle,
  priority = false,
}: PioneerImageProps) {
  const resolvedSrc = resolveBuiltInImageUrl(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasError = failedSrc === resolvedSrc;

  if (!resolvedSrc || hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#0B2240] via-[#1E3A5F] to-[#102A43] text-white/90 p-6 text-center ${className}`}
      >
        <BookOpen className="w-8 h-8 text-[#D4AF37] mb-2" aria-hidden="true" />
        <span className="font-display text-sm font-semibold tracking-tight">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(resolvedSrc)}
      className={className}
    />
  );
}

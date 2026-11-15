"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A server's external banner. Banner URLs are arbitrary and can go stale, so a failed load shows
 * `fallback` (or nothing) instead of the browser's broken image icon. The rendered <img> carries
 * data-banner, so parents can style themselves with :has() only while a banner is visible.
 */
export function BannerImage({
  src,
  alt,
  className = "",
  loading,
  fallback = null,
}: {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  fallback?: ReactNode;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // The error event can fire before hydration attaches onError; a finished load without a size failed.
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) setFailed(true);
  }, [src]);

  if (failed) return fallback;
  return (
    // Banners are arbitrary external URLs, so next/image would need an open allowlist.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      data-banner=""
      className={className}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

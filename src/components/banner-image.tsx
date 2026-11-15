"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A server's external banner. Banner URLs are arbitrary and can go stale (404, dead host that never
 * answers, HTML instead of an image), so the image only counts as shown once it has actually
 * loaded: then the <img> gets data-banner, and parents style themselves with :has([data-banner]).
 * A failed load renders `fallback` (or nothing) instead of the broken image icon.
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
  /** Use "eager" when the image sits in a container that stays hidden until it has loaded. */
  loading?: "lazy" | "eager";
  fallback?: ReactNode;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [state, setState] = useState<"loading" | "loaded" | "failed">("loading");

  useEffect(() => {
    // Load and error can fire before hydration attaches the handlers, so check the finished image.
    const img = ref.current;
    if (img?.complete) setState(img.naturalWidth > 0 ? "loaded" : "failed");
  }, [src]);

  if (state === "failed") return fallback;
  return (
    // Banners are arbitrary external URLs, so next/image would need an open allowlist.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      data-banner={state === "loaded" ? "" : undefined}
      className={`transition-opacity duration-300 ${state === "loaded" ? "opacity-100" : "opacity-0"} ${className}`}
      loading={loading}
      decoding="async"
      onLoad={(e) => setState(e.currentTarget.naturalWidth > 0 ? "loaded" : "failed")}
      onError={() => setState("failed")}
    />
  );
}

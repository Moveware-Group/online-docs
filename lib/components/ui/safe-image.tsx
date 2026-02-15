"use client";

import Image from "next/image";
import { useState } from "react";

interface SafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  priority?: boolean;
}

/**
 * SafeImage component that wraps Next.js Image with fallback to standard <img> tag
 * if the Image component fails to load the remote URL.
 */
export function SafeImage({
  src,
  alt,
  width,
  height,
  className = "",
  fill = false,
  objectFit = "cover",
  priority = false,
}: SafeImageProps) {
  const [useFallback, setUseFallback] = useState(false);
  const [imgError, setImgError] = useState(false);

  // If both Next.js Image and fallback <img> fail, show placeholder
  if (imgError) {
    return (
      <div
        className={`bg-gray-100 flex items-center justify-center ${className}`}
        style={fill ? undefined : { width, height }}
      >
        <span className="text-gray-400 text-sm">No image</span>
      </div>
    );
  }

  // Use standard <img> tag as fallback
  if (useFallback) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={fill ? { objectFit } : undefined}
        onError={() => setImgError(true)}
      />
    );
  }

  // Try Next.js Image component first
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        style={{ objectFit }}
        priority={priority}
        onError={() => setUseFallback(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width || 100}
      height={height || 100}
      className={className}
      priority={priority}
      onError={() => setUseFallback(true)}
    />
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";

interface CompanyLogoProps {
  name: string;
  logoUrl?: string | null;
  size?: number;
}

export function CompanyLogo({ name, logoUrl, size = 40 }: CompanyLogoProps) {
  const [imageError, setImageError] = useState(false);

  // Generate initials from company name
  const getInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  // Generate consistent color based on company name
  const getColor = (name: string): string => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-teal-500",
    ];
    const index = name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const initials = getInitials(name);
  const bgColor = getColor(name);

  // Show fallback if no logo or error
  if (!logoUrl || imageError) {
    return (
      <div
        className={`flex items-center justify-center rounded-full ${bgColor} text-white font-semibold`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        role="img"
        aria-label={`${name} logo`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className="relative rounded-full overflow-hidden flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <Image
        src={logoUrl}
        alt={`${name} logo`}
        width={size}
        height={size}
        className="object-cover"
        onError={() => setImageError(true)}
        unoptimized={logoUrl.startsWith("data:")}
      />
    </div>
  );
}

import { memo, useMemo, useState, useCallback, useRef } from "react";

/**
 * Memoized Profile Tab Component
 * Prevents unnecessary re-renders when props haven't changed
 */
const MemoizedProfileTabComponent = memo(({ children }) => {
  return children;
});

MemoizedProfileTabComponent.displayName = "MemoizedProfileTab";

/**
 * Optimized Image Component with lazy loading and error fallback
 */
const OptimizedProfileImageComponent = memo(
  ({ src, alt, className, fallbackSrc }) => {
    const [imageSrc, setImageSrc] = useState(src);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleLoad = useCallback(() => {
      setIsLoading(false);
      setHasError(false);
    }, []);

    const handleError = useCallback(() => {
      setIsLoading(false);
      setHasError(true);
      if (fallbackSrc && imageSrc !== fallbackSrc) {
        setImageSrc(fallbackSrc);
      }
    }, [fallbackSrc, imageSrc]);

    return (
      <div className={`relative ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 bg-neutral-800 animate-pulse rounded-full" />
        )}
        <img
          src={imageSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`${className} ${
            isLoading ? "opacity-0" : "opacity-100"
          } transition-opacity duration-300`}
          loading="lazy"
        />
        {hasError && !fallbackSrc && (
          <div className="absolute inset-0 bg-neutral-700 rounded-full flex items-center justify-center">
            <span className="text-gray-400 text-sm">Failed to load</span>
          </div>
        )}
      </div>
    );
  }
);

OptimizedProfileImageComponent.displayName = "OptimizedProfileImage";

/**
 * Memoized Stats Component
 * Prevents unnecessary calculations and re-renders
 */
const MemoizedStatsCardComponent = memo(
  ({ title, value, icon: Icon, color }) => {
    const formattedValue = useMemo(() => {
      if (typeof value === "number") {
        return value.toLocaleString();
      }
      return value;
    }, [value]);

    return (
      <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{formattedValue}</p>
          </div>
          <Icon className={`text-2xl ${color}`} />
        </div>
      </div>
    );
  }
);

MemoizedStatsCardComponent.displayName = "MemoizedStatsCard";

export const MemoizedProfileTab = MemoizedProfileTabComponent;
export const OptimizedProfileImage = OptimizedProfileImageComponent;
export const MemoizedStatsCard = MemoizedStatsCardComponent;

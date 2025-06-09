import { useState, useEffect, useCallback } from "react";

/**
 * Optimized image component with lazy loading and performance features
 */
const OptimizedImage = ({
  src,
  alt,
  className = "",
  placeholder = "/placeholder.jpg",
  lazy = true,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(lazy ? placeholder : src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  const loadImage = useCallback(() => {
    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };
    img.onerror = () => {
      setIsError(true);
    };
    img.src = src;
  }, [src]);

  useEffect(() => {
    if (!lazy) {
      loadImage();
      return;
    }

    // Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    const imgElement = document.querySelector(`[data-src="${src}"]`);
    if (imgElement) {
      observer.observe(imgElement);
    }

    return () => observer.disconnect();
  }, [lazy, loadImage, src]);

  if (isError) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        {...props}
      >
        <span className="text-gray-500 text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`transition-opacity duration-300 ${
        isLoaded ? "opacity-100" : "opacity-50"
      } ${className}`}
      data-src={lazy ? src : undefined}
      loading={lazy ? "lazy" : "eager"}
      {...props}
    />
  );
};

export default OptimizedImage;

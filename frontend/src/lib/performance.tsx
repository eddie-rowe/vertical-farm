import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";

// Debounce hook for performance optimization
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(
      () => {
        if (Date.now() - lastRan.current >= limit) {
          setThrottledValue(value);
          lastRan.current = Date.now();
        }
      },
      limit - (Date.now() - lastRan.current),
    );

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  ref: React.RefObject<HTMLElement | HTMLImageElement | null>,
  options: IntersectionObserverInit = {},
): IntersectionObserverEntry | null {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => setEntry(entry), {
      threshold: 0.1,
      rootMargin: "50px",
      ...options,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, options]);

  return entry;
}

// Lazy loading component wrapper
export function LazyImage({
  src,
  alt,
  className,
  fallback,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & {
  fallback?: React.ReactNode;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const entry = useIntersectionObserver(imgRef);

  const shouldLoad = entry?.isIntersecting;

  useEffect(() => {
    if (shouldLoad && src && !isLoaded && typeof src === "string") {
      const img = new Image();
      img.onload = () => setIsLoaded(true);
      img.onerror = () => setHasError(true);
      img.src = src;
    }
  }, [shouldLoad, src, isLoaded]);

  if (hasError && fallback) {
    return fallback as React.ReactElement;
  }

  return (
    <img
      ref={imgRef}
      src={isLoaded ? src : undefined}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      {...props}
      style={{
        ...props.style,
        transition: "opacity 0.3s ease",
        opacity: isLoaded ? 1 : 0,
      }}
    />
  );
}

// Performance measurement hook
export function usePerformance(name: string) {
  const startTime = useRef<number | undefined>(undefined);
  const [metrics, setMetrics] = useState<{
    duration?: number;
    startTime?: number;
    endTime?: number;
  }>({});

  const start = useCallback(() => {
    startTime.current = performance.now();
    setMetrics((prev) => ({ ...prev, startTime: startTime.current }));

    if (typeof window !== "undefined" && "performance" in window) {
      performance.mark(`${name}-start`);
    }
  }, [name]);

  const end = useCallback(() => {
    if (!startTime.current) return;

    const endTime = performance.now();
    const duration = endTime - startTime.current;

    setMetrics({
      startTime: startTime.current,
      endTime,
      duration,
    });

    if (typeof window !== "undefined" && "performance" in window) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }

    // Log performance metrics in development
    if (process.env.NODE_ENV === "development") {
      console.log(`Performance [${name}]:`, duration.toFixed(2), "ms");
    }
  }, [name]);

  return { start, end, metrics };
}

// Memoized selector hook
export function useMemoizedSelector<T, R>(
  data: T,
  selector: (data: T) => R,
  deps?: React.DependencyList,
): R {
  return useMemo(() => selector(data), deps ? [data, ...deps] : [data]);
}

// Async state hook with error handling
export function useAsyncState<T>(
  asyncFunction: () => Promise<T>,
  dependencies: React.DependencyList = [],
) {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await asyncFunction();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
      throw error;
    }
  }, dependencies);

  useEffect(() => {
    execute();
  }, [execute]);

  return { ...state, refetch: execute };
}

// Optimized list renderer
export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length - 1,
  );

  const paddingTop = visibleStart * itemHeight;
  const paddingBottom = (items.length - visibleEnd - 1) * itemHeight;

  const visibleItems = items.slice(
    Math.max(0, visibleStart - overscan),
    Math.min(items.length, visibleEnd + 1 + overscan),
  );

  return (
    <div
      style={{ height: containerHeight, overflow: "auto" }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ paddingTop, paddingBottom }}>
        {visibleItems.map((item, index) => (
          <div
            key={visibleStart - overscan + index}
            style={{ height: itemHeight }}
          >
            {renderItem(item, visibleStart - overscan + index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Memory usage monitor
export function useMemoryMonitor(interval = 5000) {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  }>({});

  useEffect(() => {
    if (typeof window === "undefined" || !("performance" in window)) return;

    const updateMemoryInfo = () => {
      const memory = (performance as any).memory;
      if (memory) {
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      }
    };

    updateMemoryInfo();
    const timer = setInterval(updateMemoryInfo, interval);

    return () => clearInterval(timer);
  }, [interval]);

  return memoryInfo;
}

// Resource preloader
export function preloadResource(href: string, as: string = "fetch") {
  if (typeof window === "undefined") return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.href = href;
  link.as = as;

  if (as === "fetch") {
    link.crossOrigin = "anonymous";
  }

  document.head.appendChild(link);
}

// Critical resource hints
export function addResourceHints() {
  if (typeof window === "undefined") return;

  // DNS prefetch for external domains
  const domains = [
    "fonts.googleapis.com",
    "fonts.gstatic.com",
    "api.goodgoodgreens.org",
  ];

  domains.forEach((domain) => {
    const link = document.createElement("link");
    link.rel = "dns-prefetch";
    link.href = `//${domain}`;
    document.head.appendChild(link);
  });

  // Preconnect to critical origins
  const preconnectDomains = [
    "https://fonts.googleapis.com",
    "https://api.goodgoodgreens.org",
  ];

  preconnectDomains.forEach((domain) => {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = domain;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  });
}

// Performance observer for Core Web Vitals
export function observeWebVitals(callback: (metric: any) => void) {
  if (typeof window === "undefined" || !("PerformanceObserver" in window))
    return;

  // Largest Contentful Paint
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    callback({
      name: "LCP",
      value: lastEntry.startTime,
      rating:
        lastEntry.startTime > 2500
          ? "poor"
          : lastEntry.startTime > 1200
            ? "needs-improvement"
            : "good",
    });
  });

  try {
    lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
  } catch (_e) {
    // LCP not supported
  }

  // First Input Delay
  const fidObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry: any) => {
      callback({
        name: "FID",
        value: entry.processingStart - entry.startTime,
        rating:
          entry.processingStart - entry.startTime > 300
            ? "poor"
            : entry.processingStart - entry.startTime > 100
              ? "needs-improvement"
              : "good",
      });
    });
  });

  try {
    fidObserver.observe({ entryTypes: ["first-input"] });
  } catch (_e) {
    // FID not supported
  }

  // Cumulative Layout Shift
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry: any) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
        callback({
          name: "CLS",
          value: clsValue,
          rating:
            clsValue > 0.25
              ? "poor"
              : clsValue > 0.1
                ? "needs-improvement"
                : "good",
        });
      }
    });
  });

  try {
    clsObserver.observe({ entryTypes: ["layout-shift"] });
  } catch (_e) {
    // CLS not supported
  }
}

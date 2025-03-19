import { RotateCw } from "lucide-react";
import { ReactNode, useCallback, useEffect, useRef } from "react";
import { cn } from "@/core/lib/utils";

const DEBUG = false;

interface InfiniteScrollProps {
  children: ReactNode;
  loadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  observerOptions?: IntersectionObserverInit;
  loader?: ReactNode;
  className?: string;
  ariaLabel?: string;
}

const InfiniteScroll = ({
  children,
  loadMore,
  hasMore,
  isLoading,
  observerOptions = {
    root: null,
    rootMargin: "20px",
    threshold: 0,
  },
  loader = (
    <div className="flex justify-center py-4">
      <RotateCw className="w-6 h-6 animate-spin" />
    </div>
  ),
  className,
  ariaLabel,
}: InfiniteScrollProps) => {
  const triggerRef = useRef<HTMLDivElement | null>(null);

  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (DEBUG) {
        console.log(entry);
        console.log({ hasMore, isLoading });
      }
      if (entry.isIntersecting && hasMore && !isLoading) {
        loadMore();
      }
    },
    [loadMore, hasMore, isLoading],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions,
    );

    const trigger = triggerRef.current;
    if (trigger) {
      observer.observe(trigger);
    }

    // Clean up observer on component unmount
    return () => {
      if (trigger) {
        observer.unobserve(trigger);
      }
    };
  }, [observerOptions, observerCallback]);

  return (
    <div
      aria-label={ariaLabel}
      role="list"
      className={cn(className, { "border-2 border-green-500": DEBUG })}
    >
      {children}
      {isLoading && loader}
      <div
        ref={triggerRef}
        className={cn("h-1", {
          "h-12 text-center border-2 border-red-500": DEBUG,
        })}
        id="trigger"
      >
        {DEBUG ? "Trigger zone" : null}{" "}
      </div>
    </div>
  );
};

export default InfiniteScroll;

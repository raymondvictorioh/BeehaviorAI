import { useEffect, useState } from "react";
import { BeeLoading } from "./BeeLoading";

interface BeeLoaderProps {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
}

/**
 * BeeLoader - Two-stage loading component for BeehaviorAI
 *
 * Stage 1 (0-500ms): Shows animated bee emoji spinner
 * Stage 2 (500ms+): Transitions to skeleton loader for better perceived performance
 *
 * @param isLoading - Loading state from query
 * @param skeleton - Skeleton loader component to show after 500ms
 * @param children - Actual content to show when loading completes
 */
export function BeeLoader({ isLoading, skeleton, children }: BeeLoaderProps) {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    if (isLoading) {
      // Reset to bee animation when loading starts
      setShowSkeleton(false);

      // Transition to skeleton after 500ms
      const timer = setTimeout(() => {
        setShowSkeleton(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Stage 1: Show bee spinner (0-500ms)
  if (isLoading && !showSkeleton) {
    return <BeeLoading />;
  }

  // Stage 2: Show skeleton loader (500ms+)
  if (isLoading) {
    return <>{skeleton}</>;
  }

  // Loading complete: Show actual content
  return <>{children}</>;
}

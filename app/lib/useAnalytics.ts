/**
 * 🎯 ANALYTICS HOOK
 * Use this hook in components to track page views and clicks
 */

"use client";

import { useEffect } from "react";
import { trackPageView, trackClick } from "../lib/analytics-db";

/**
 * Hook to track page views on component mount
 */
export function useTrackPageView() {
  useEffect(() => {
    // Track page view when component mounts
    // Don't await - let it fail silently if there are issues
    trackPageView().catch((err) => {
      // Silently ignore analytics errors - they should never break the app
      console.warn("[Analytics] Page view tracking failed (non-critical):", err);
    });
  }, []);
}

/**
 * Hook to get tracking functions
 */
export function useTracking() {
  return {
    trackProductClick: () => trackClick("productClick"),
    trackCategoryClick: () => trackClick("categoryClick"),
    trackButtonClick: () => trackClick("buttonClick"),
    trackLinkClick: () => trackClick("linkClick"),
    trackBlogClick: () => trackClick("blogClick"),
  };
}

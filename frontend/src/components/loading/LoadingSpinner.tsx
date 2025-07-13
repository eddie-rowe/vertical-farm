/**
 * @deprecated This file is deprecated. Use components from @/components/ui/loading instead
 * 
 * Legacy loading components - kept for backwards compatibility
 * Please migrate to the new standardized loading system:
 * - LoadingSpinner from @/components/ui/loading
 * - LoadingCard from @/components/ui/loading
 * - LoadingOverlay from @/components/ui/loading
 * - SkeletonCard from @/components/ui/skeleton-extended
 */

import { LoadingSpinner as NewLoadingSpinner, LoadingCard as NewLoadingCard } from "@/components/ui/loading";

/**
 * @deprecated Use LoadingSpinner from @/components/ui/loading instead
 */
export const LoadingSpinner = NewLoadingSpinner;

/**
 * @deprecated Use LoadingCard from @/components/ui/loading instead  
 */
export const LoadingCard = NewLoadingCard; 
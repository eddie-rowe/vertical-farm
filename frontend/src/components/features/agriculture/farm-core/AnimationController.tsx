"use client";

import React, { useEffect, useRef, useState } from "react";

export type AnimationType =
  | "fadeIn"
  | "fadeOut"
  | "slideIn"
  | "slideOut"
  | "scaleIn"
  | "scaleOut"
  | "pulse"
  | "bounce"
  | "shake";

export interface AnimationConfig {
  type: AnimationType;
  duration: number;
  delay?: number;
  easing?: "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear";
  iterations?: number | "infinite";
  direction?: "normal" | "reverse" | "alternate" | "alternate-reverse";
}

interface AnimationControllerProps {
  isActive: boolean;
  config: AnimationConfig;
  children: React.ReactNode;
  onAnimationComplete?: () => void;
  className?: string;
}

const AnimationController: React.FC<AnimationControllerProps> = ({
  isActive,
  config,
  children,
  onAnimationComplete,
  className = "",
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [animationState, setAnimationState] = useState<
    "idle" | "running" | "completed"
  >("idle");

  useEffect(() => {
    if (!elementRef.current || !isActive) return;

    const element = elementRef.current;
    setAnimationState("running");

    // Create animation keyframes based on type
    const keyframes = getKeyframes(config.type);

    // Configure animation options
    const animationOptions: KeyframeAnimationOptions = {
      duration: config.duration,
      delay: config.delay || 0,
      easing: config.easing || "ease",
      iterations:
        config.iterations === "infinite" ? Infinity : config.iterations || 1,
      direction: config.direction || "normal",
      fill: "both",
    };

    // Start animation
    const animation = element.animate(keyframes, animationOptions);

    // Handle animation completion
    animation.onfinish = () => {
      setAnimationState("completed");
      onAnimationComplete?.();
    };

    // Cleanup
    return () => {
      animation.cancel();
    };
  }, [isActive, config, onAnimationComplete]);

  return (
    <div
      ref={elementRef}
      className={`${className} ${getAnimationClasses(config.type, animationState)}`}
      style={{
        animationDuration: `${config.duration}ms`,
        animationDelay: `${config.delay || 0}ms`,
        animationTimingFunction: config.easing || "ease",
        animationIterationCount: config.iterations || 1,
        animationDirection: config.direction || "normal",
      }}
    >
      {children}
    </div>
  );
};

// Helper function to get keyframes for different animation types
function getKeyframes(type: AnimationType): Keyframe[] {
  switch (type) {
    case "fadeIn":
      return [{ opacity: 0 }, { opacity: 1 }];
    case "fadeOut":
      return [{ opacity: 1 }, { opacity: 0 }];
    case "slideIn":
      return [
        { transform: "translateX(-100%)", opacity: 0 },
        { transform: "translateX(0)", opacity: 1 },
      ];
    case "slideOut":
      return [
        { transform: "translateX(0)", opacity: 1 },
        { transform: "translateX(100%)", opacity: 0 },
      ];
    case "scaleIn":
      return [
        { transform: "scale(0)", opacity: 0 },
        { transform: "scale(1)", opacity: 1 },
      ];
    case "scaleOut":
      return [
        { transform: "scale(1)", opacity: 1 },
        { transform: "scale(0)", opacity: 0 },
      ];
    case "pulse":
      return [
        { transform: "scale(1)" },
        { transform: "scale(1.05)" },
        { transform: "scale(1)" },
      ];
    case "bounce":
      return [
        { transform: "translateY(0)" },
        { transform: "translateY(-10px)" },
        { transform: "translateY(0)" },
        { transform: "translateY(-5px)" },
        { transform: "translateY(0)" },
      ];
    case "shake":
      return [
        { transform: "translateX(0)" },
        { transform: "translateX(-5px)" },
        { transform: "translateX(5px)" },
        { transform: "translateX(-5px)" },
        { transform: "translateX(0)" },
      ];
    default:
      return [{ opacity: 1 }];
  }
}

// Helper function to get CSS classes for animations
function getAnimationClasses(
  type: AnimationType,
  state: "idle" | "running" | "completed",
): string {
  const baseClasses = "transition-all";

  if (state === "idle") return baseClasses;

  switch (type) {
    case "fadeIn":
    case "fadeOut":
      return `${baseClasses} opacity-transition`;
    case "slideIn":
    case "slideOut":
      return `${baseClasses} transform-transition`;
    case "scaleIn":
    case "scaleOut":
      return `${baseClasses} scale-transition`;
    case "pulse":
      return `${baseClasses} animate-pulse-custom`;
    case "bounce":
      return `${baseClasses} animate-bounce-custom`;
    case "shake":
      return `${baseClasses} animate-shake-custom`;
    default:
      return baseClasses;
  }
}

// Preset animation configurations
export const AnimationPresets = {
  quickFadeIn: {
    type: "fadeIn" as AnimationType,
    duration: 200,
    easing: "ease-out" as const,
  },
  smoothSlideIn: {
    type: "slideIn" as AnimationType,
    duration: 300,
    easing: "ease-out" as const,
  },
  gentleScale: {
    type: "scaleIn" as AnimationType,
    duration: 250,
    easing: "ease-out" as const,
  },
  attentionPulse: {
    type: "pulse" as AnimationType,
    duration: 600,
    iterations: 3 as const,
    easing: "ease-in-out" as const,
  },
  errorShake: {
    type: "shake" as AnimationType,
    duration: 400,
    easing: "ease-in-out" as const,
  },
  successBounce: {
    type: "bounce" as AnimationType,
    duration: 600,
    easing: "ease-out" as const,
  },
};

// Hook for managing multiple animations
export const useAnimationSequence = (animations: AnimationConfig[]) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const startSequence = () => {
    setCurrentIndex(0);
    setIsPlaying(true);
  };

  const handleAnimationComplete = () => {
    if (currentIndex < animations.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsPlaying(false);
      setCurrentIndex(0);
    }
  };

  return {
    currentAnimation: animations[currentIndex],
    isPlaying,
    startSequence,
    handleAnimationComplete,
    progress:
      animations.length > 0 ? (currentIndex + 1) / animations.length : 0,
  };
};

// Hook for hover animations
export const useHoverAnimation = (config: AnimationConfig) => {
  const [isHovered, setIsHovered] = useState(false);

  const hoverProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };

  return {
    isHovered,
    hoverProps,
    AnimatedComponent: ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className?: string;
    }) => (
      <AnimationController
        isActive={isHovered}
        config={config}
        className={className}
      >
        {children}
      </AnimationController>
    ),
  };
};

// Stagger animation component for lists
export const StaggeredAnimation: React.FC<{
  children: React.ReactNode[];
  config: AnimationConfig;
  staggerDelay: number;
  isActive: boolean;
}> = ({ children, config, staggerDelay, isActive }) => {
  return (
    <>
      {children.map((child, index) => (
        <AnimationController
          key={index}
          isActive={isActive}
          config={{
            ...config,
            delay: (config.delay || 0) + index * staggerDelay,
          }}
        >
          {child}
        </AnimationController>
      ))}
    </>
  );
};

export default AnimationController;

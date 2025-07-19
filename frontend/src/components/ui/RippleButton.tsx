import React, { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface RippleEffect {
  key: number;
  x: number;
  y: number;
}

interface RippleButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  disabled?: boolean;
  rippleColor?: string;
  rippleDuration?: number;
}

export const RippleButton: React.FC<RippleButtonProps> = ({
  children,
  disabled = false,
  rippleColor = "rgba(59, 130, 246, 0.5)", // Blue ripple by default
  rippleDuration = 600,
  className,
  onClick,
  ...props
}) => {
  const [ripples, setRipples] = useState<RippleEffect[]>([]);
  const buttonRef = useRef<HTMLDivElement>(null);
  const rippleKeyRef = useRef(0);

  const createRipple = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || !buttonRef.current) return;

      const button = buttonRef.current;
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const newRipple: RippleEffect = {
        key: rippleKeyRef.current++,
        x,
        y,
      };

      setRipples((prev) => [...prev, newRipple]);

      // Remove ripple after animation completes
      setTimeout(() => {
        setRipples((prev) =>
          prev.filter((ripple) => ripple.key !== newRipple.key),
        );
      }, rippleDuration);
    },
    [disabled, rippleDuration],
  );

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      createRipple(event);
      onClick?.(event);
    },
    [createRipple, onClick],
  );

  return (
    <div
      ref={buttonRef}
      className={cn(
        "relative overflow-hidden",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      onClick={handleClick}
      {...props}
    >
      {children}

      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <span
          key={ripple.key}
          className="absolute pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: "translate(-50%, -50%)",
            backgroundColor: rippleColor,
            borderRadius: "50%",
            width: "4px",
            height: "4px",
            animation: `ripple ${rippleDuration}ms ease-out forwards`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes ripple {
          to {
            width: 300px;
            height: 300px;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

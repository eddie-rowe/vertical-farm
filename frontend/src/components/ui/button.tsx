import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps 
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  loadingText,
  icon,
  iconPosition = "left",
  children,
  disabled,
  type = "button",
  "aria-label": ariaLabel,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"
  const isDisabled = disabled || loading;

  // Enhanced accessibility attributes
  const accessibilityProps = {
    type: asChild ? undefined : type,
    disabled: asChild ? undefined : isDisabled,
    "aria-disabled": isDisabled,
    "aria-busy": loading,
    "aria-label": loading ? (loadingText || "Loading...") : ariaLabel,
    role: asChild ? undefined : "button",
    tabIndex: isDisabled ? -1 : 0,
  };

  const buttonContent = () => {
    if (loading) {
      return (
        <>
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>{loadingText || "Loading..."}</span>
        </>
      );
    }

    return (
      <>
        {icon && iconPosition === "left" && (
          <span className="inline-flex" aria-hidden="true">
            {icon}
          </span>
        )}
        {children && <span>{children}</span>}
        {icon && iconPosition === "right" && (
          <span className="inline-flex" aria-hidden="true">
            {icon}
          </span>
        )}
      </>
    );
  };

  return (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size }),
        loading && "pointer-events-none",
        className
      )}
      {...accessibilityProps}
      {...props}
    >
      {buttonContent()}
    </Comp>
  )
}

export { Button, buttonVariants }

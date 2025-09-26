import * as React from "react";
import { cn } from "../utils/cn";

// ============== Button 组件变体配置 ==============

const buttonVariants = {
  variant: {
    default: "bg-[var(--primary-100)] hover:bg-[var(--primary-200)] text-white",
    destructive: "bg-red-500 hover:bg-red-500/90 text-white",
    outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900",
    ghost: "hover:bg-gray-100 text-gray-700",
    link: "text-[var(--primary-100)] hover:text-[var(--primary-200)] underline-offset-4 hover:underline",
  },
  size: {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  },
};

// ============== Button 组件接口 ==============

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants.variant;
  size?: keyof typeof buttonVariants.size;
  asChild?: boolean;
  isLoading?: boolean;
}

// ============== Button 组件实现 ==============

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, isLoading = false, children, disabled, ...props }, ref) => {
    const Component = asChild ? "span" : "button";
    
    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-100)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    
    const variantClasses = buttonVariants.variant[variant] || buttonVariants.variant.default;
    const sizeClasses = buttonVariants.size[size] || buttonVariants.size.default;
    
    return (
      <Component
        className={cn(baseClasses, variantClasses, sizeClasses, className)}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
        )}
        {children}
      </Component>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
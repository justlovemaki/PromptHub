import * as React from "react";
import { cn } from "../lib/utils";

// ============== Skeleton 组件接口 ==============

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  animation?: "pulse" | "wave" | "none";
}

// ============== Skeleton 组件实现 ==============

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "rectangular", animation = "pulse", ...props }, ref) => {
    const variantClasses = {
      text: "h-4 w-full rounded",
      circular: "rounded-full",
      rectangular: "rounded",
    };

    const animationClasses = {
      pulse: "animate-pulse",
      wave: "animate-pulse", // 简化实现，实际项目可能需要自定义动画
      none: "",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "bg-gray-200",
          variantClasses[variant],
          animationClasses[animation],
          className
        )}
        {...props}
      />
    );
  }
);
Skeleton.displayName = "Skeleton";

// ============== 预定义的 Skeleton 组件 ==============

const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3, 
  className 
}) => (
  <div className={cn("space-y-2", className)}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        variant="text"
        className={index === lines - 1 ? "w-3/4" : "w-full"}
      />
    ))}
  </div>
);

const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("space-y-4 p-4", className)}>
    <div className="flex items-center space-x-4">
      <Skeleton variant="circular" className="h-12 w-12" />
      <div className="space-y-2 flex-1">
        <Skeleton variant="text" className="h-4 w-1/2" />
        <Skeleton variant="text" className="h-3 w-1/3" />
      </div>
    </div>
    <SkeletonText lines={2} />
  </div>
);

const SkeletonTable: React.FC<{ 
  rows?: number; 
  columns?: number; 
  className?: string 
}> = ({ 
  rows = 5, 
  columns = 4, 
  className 
}) => (
  <div className={cn("space-y-3", className)}>
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={index} variant="text" className="h-4 flex-1" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} variant="text" className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

const SkeletonList: React.FC<{ 
  items?: number; 
  showAvatar?: boolean;
  className?: string 
}> = ({ 
  items = 3, 
  showAvatar = false, 
  className 
}) => (
  <div className={cn("space-y-4", className)}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-3">
        {showAvatar && (
          <Skeleton variant="circular" className="h-8 w-8" />
        )}
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" className="h-3 w-3/4" />
          <Skeleton variant="text" className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

// ============== Loading 组件 ==============

export interface LoadingProps {
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "dots" | "bars";
  text?: string;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({ 
  size = "md", 
  variant = "spinner", 
  text,
  className 
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const renderSpinner = () => (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-brand-blue border-t-transparent",
        sizeClasses[size]
      )}
    />
  );

  const renderDots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "rounded-full bg-brand-blue animate-pulse",
            size === "sm" ? "h-2 w-2" : size === "md" ? "h-3 w-3" : "h-4 w-4"
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: "1s",
          }}
        />
      ))}
    </div>
  );

  const renderBars = () => (
    <div className="flex space-x-1 items-end">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "bg-brand-blue animate-pulse",
            size === "sm" ? "w-1" : size === "md" ? "w-2" : "w-3"
          )}
          style={{
            height: `${12 + (i + 1) * 4}px`,
            animationDelay: `${i * 0.2}s`,
            animationDuration: "1s",
          }}
        />
      ))}
    </div>
  );

  const renderVariant = () => {
    switch (variant) {
      case "dots":
        return renderDots();
      case "bars":
        return renderBars();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="flex flex-col items-center space-y-2">
        {renderVariant()}
        {text && (
          <p className="text-sm text-gray-500">{text}</p>
        )}
      </div>
    </div>
  );
};

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  Loading,
};
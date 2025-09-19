import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/utils";

// ============== Sheet 组件接口 ==============

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "right" | "bottom" | "left";
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export interface SheetHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface SheetTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
export interface SheetDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
export interface SheetFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface SheetCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

// ============== Portal 实现 ==============

const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return typeof document !== 'undefined'
    ? createPortal(children, document.body)
    : null;
};

// ============== Sheet 组件实现 ==============

const Sheet: React.FC<SheetProps> = ({ open, onOpenChange, children }) => {
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50"
          onClick={() => onOpenChange(false)}
        />
        {children}
      </div>
    </Portal>
  );
};

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, side = "right", size = "md", children, ...props }, ref) => {
    const sideClasses = {
      top: "top-0 left-0 right-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
      bottom: "bottom-0 left-0 right-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
      left: "left-0 top-0 bottom-0 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
      right: "right-0 top-0 bottom-0 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
    };

    const sizeClasses = {
      sm: side === "top" || side === "bottom" ? "h-1/3" : "w-1/3",
      md: side === "top" || side === "bottom" ? "h-1/2" : "w-1/2",
      lg: side === "top" || side === "bottom" ? "h-2/3" : "w-2/3",
      xl: side === "top" || side === "bottom" ? "h-5/6" : "w-5/6",
      full: "w-full h-full",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "fixed z-50 bg-white p-6 shadow-lg transition ease-in-out",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          sideClasses[side],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SheetContent.displayName = "SheetContent";

const SheetHeader = React.forwardRef<HTMLDivElement, SheetHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
      {...props}
    />
  )
);
SheetHeader.displayName = "SheetHeader";

const SheetTitle = React.forwardRef<HTMLHeadingElement, SheetTitleProps>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("text-lg font-semibold text-gray-950", className)}
      {...props}
    />
  )
);
SheetTitle.displayName = "SheetTitle";

const SheetDescription = React.forwardRef<HTMLParagraphElement, SheetDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-gray-500", className)}
      {...props}
    />
  )
);
SheetDescription.displayName = "SheetDescription";

const SheetFooter = React.forwardRef<HTMLDivElement, SheetFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
      {...props}
    />
  )
);
SheetFooter.displayName = "SheetFooter";

const SheetClose = React.forwardRef<HTMLButtonElement, SheetCloseProps>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2",
        className
      )}
      {...props}
    >
      {children || (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
      <span className="sr-only">Close</span>
    </button>
  )
);
SheetClose.displayName = "SheetClose";

export {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
};
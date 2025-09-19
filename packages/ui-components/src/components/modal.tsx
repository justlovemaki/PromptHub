import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/utils";

// ============== Modal 组件接口 ==============

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface ModalTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export interface ModalDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface ModalCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

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

// ============== Modal 组件实现 ==============

const Modal: React.FC<ModalProps> = ({ open, onOpenChange, children }) => {
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
      <div className="fixed inset-0 z-50 flex items-center justify-center">
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

const ModalContent = React.forwardRef<HTMLDivElement, ModalContentProps>(
  ({ className, size = "md", children, ...props }, ref) => {
    const sizeClasses = {
      sm: "max-w-md",
      md: "max-w-lg",
      lg: "max-w-2xl",
      xl: "max-w-4xl",
      full: "max-w-[95vw] max-h-[95vh]",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative z-50 w-full rounded-lg border border-gray-200 bg-white p-6 shadow-lg",
          sizeClasses[size],
          "animate-in fade-in-0 zoom-in-95 duration-200",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ModalContent.displayName = "ModalContent";

const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
      {...props}
    />
  )
);
ModalHeader.displayName = "ModalHeader";

const ModalTitle = React.forwardRef<HTMLHeadingElement, ModalTitleProps>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
);
ModalTitle.displayName = "ModalTitle";

const ModalDescription = React.forwardRef<HTMLParagraphElement, ModalDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-gray-500", className)}
      {...props}
    />
  )
);
ModalDescription.displayName = "ModalDescription";

const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
      {...props}
    />
  )
);
ModalFooter.displayName = "ModalFooter";

const ModalClose = React.forwardRef<HTMLButtonElement, ModalCloseProps>(
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
ModalClose.displayName = "ModalClose";

export {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
};
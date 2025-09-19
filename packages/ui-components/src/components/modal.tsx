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
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
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
          className="fixed inset-0 backdrop-blur-sm transition-opacity duration-300"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
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
      sm: "max-w-sm w-[315px]",
      md: "max-w-md w-[405px]",
      lg: "max-w-xl w-[510px]",
      xl: "max-w-3xl w-[690px]",
      "2xl": "max-w-4xl w-[768px]",
      full: "max-w-[95vw] max-h-[95vh]",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative z-50 w-full rounded-2xl border border-gray-200 bg-white shadow-2xl",
          "backdrop-blur-sm mx-4",
          sizeClasses[size],
          "animate-in fade-in-0 zoom-in-95 duration-300 ease-out",
          "max-h-[90vh] overflow-hidden",
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
      className={cn(
        "flex flex-col space-y-3 px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-transparent rounded-t-2xl",
        className
      )}
      {...props}
    />
  )
);
ModalHeader.displayName = "ModalHeader";

const ModalTitle = React.forwardRef<HTMLHeadingElement, ModalTitleProps>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn(
        "text-xl font-bold text-gray-900 leading-tight tracking-tight",
        "flex items-center gap-3",
        className
      )}
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
        "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2",
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
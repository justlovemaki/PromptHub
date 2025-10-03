import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../utils/cn";
import { t } from '../utils/i18n';

// ============== Modal 组件接口 ==============

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
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
  // 移除 mounted 状态，直接渲染
  // 在 Electron 应用中，document 总是可用的
  return createPortal(children, document.body);
};

// ============== Modal 组件实现 ==============

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 backdrop-blur-sm transition-opacity duration-300"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
          onClick={onClose}
        />
        <div className="relative z-50 max-w-95vw rounded-2xl border border-gray-200 bg-white shadow-2xl mx-4">
          <div className="flex flex-col space-y-3 px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-transparent rounded-t-2xl">
            {title && <h2 className="text-xl font-bold text-gray-900 leading-tight tracking-tight">{title}</h2>}
            <button
              className="absolute border-none bg-white right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2"
              onClick={onClose}
            >
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
              <span className="sr-only">{t('closePanel')}</span>
            </button>
          </div>
          {children}
        </div>
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
          "max-h-[90vh] overflow-y-auto",
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
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 px-8 py-6", className)}
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
        "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2",
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
      <span className="sr-only">{t('closePanel')}</span>
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
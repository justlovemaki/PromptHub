import * as React from "react";
import { cn } from "../lib/utils";

// ============== Textarea 组件接口 ==============

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  helperText?: string;
  enableVariableHighlight?: boolean;
}

// ============== Textarea 组件实现 ==============

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, helperText, id, enableVariableHighlight = false, value, onChange, ...props }, ref) => {
    const textareaId = id || `textarea-${React.useId()}`;
    
    const baseClasses = "flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
    
    const errorClasses = error ? "border-red-500 focus-visible:ring-red-500" : "";
    
    // 变量高亮处理（简化版）
    const highlightVariables = (text: string) => {
      if (!enableVariableHighlight || !text) return text;
      
      // 这里是一个简化的实现，实际项目中可能需要更复杂的语法高亮
      return text.replace(/\{\{([^}]+)\}\}/g, '{{$1}}');
    };
    
    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={textareaId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          <textarea
            id={textareaId}
            className={cn(baseClasses, errorClasses, className)}
            ref={ref}
            value={value}
            onChange={onChange}
            {...props}
          />
          
          {/* 变量高亮层（可选功能，需要更复杂的实现） */}
          {enableVariableHighlight && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-md">
              {/* TODO: 实现语法高亮 */}
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
        
        {enableVariableHighlight && (
          <div className="text-xs text-gray-400">
            💡 使用 <code className="bg-gray-100 px-1 rounded">{"{{变量名}}"}</code> 来定义变量
          </div>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
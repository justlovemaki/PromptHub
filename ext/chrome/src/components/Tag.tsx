import React from 'react';

interface TagProps {
  children: React.ReactNode;
  className?: string;
}

const Tag: React.FC<TagProps> = ({ children, className = '' }) => {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded border border-blue-200 max-w-[100px] truncate whitespace-nowrap align-middle ${className}`}
    >
      {children}
    </span>
  );
};

export default Tag;
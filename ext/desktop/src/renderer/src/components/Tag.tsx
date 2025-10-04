import React from 'react';

interface TagProps {
  children: React.ReactNode;
  className?: string;
}

const Tag: React.FC<TagProps> = ({ children, className = '' }) => {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium bg-default text-mainrounded border border-default max-w-[100px] truncate whitespace-nowrap align-middle ${className}`}
    >
      {children}
    </span>
  );
};

export default Tag;
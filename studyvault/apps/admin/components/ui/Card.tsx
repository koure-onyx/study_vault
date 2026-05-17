import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = true }: CardProps) {
  return (
    <div 
      className={`
        bg-white rounded-xl shadow-md p-6 border border-gray-100
        transition-all duration-200
        ${hover ? 'hover:shadow-lg' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

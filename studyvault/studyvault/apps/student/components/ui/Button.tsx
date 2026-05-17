import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  isLoading = false, 
  children, 
  className = '', 
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center px-6 py-3 
    text-base font-medium rounded-lg 
    focus:outline-none focus:ring-2 focus:ring-offset-2 
    transition-all duration-200 active:scale-95
    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
  `;

  const variantStyles = {
    primary: 'text-white bg-primary-green hover:bg-primary-green-light focus:ring-primary-green shadow-md hover:shadow-lg',
    secondary: 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-primary-green shadow-sm hover:shadow-md',
    outline: 'text-primary-green border-2 border-primary-green hover:bg-primary-green/5 focus:ring-primary-green',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

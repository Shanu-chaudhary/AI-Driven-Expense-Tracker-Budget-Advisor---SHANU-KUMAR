import React from 'react';

export default function Button({ children, className = '', variant = 'primary', size = 'md', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed gap-2';
  
  const variants = {
    primary: 'bp-btn-primary shadow-lg hover:shadow-xl',
    ghost: 'bp-btn-ghost',
    secondary: 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button 
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
}

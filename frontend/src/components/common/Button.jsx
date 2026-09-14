// src/components/common/Button.jsx
import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/solid';

const Button = ({ 
  children, 
  variant = 'primary', 
  loading = false, 
  disabled = false,
  onClick,
  className = '',
  icon: Icon,
  size = 'md',
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-700 text-white hover:shadow-lg',
    success: 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg',
    outline: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50',
    ghost: 'text-gray-600 hover:bg-gray-100',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-xl',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-2xl',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative flex items-center justify-center gap-2 font-semibold
        transition-all duration-300
        ${variants[variant]} 
        ${sizes[size]}
        ${disabled || loading ? 'opacity-60 cursor-not-allowed scale-98' : 'hover:scale-[1.02] active:scale-[0.98]'}
        ${className}
      `}
    >
      {loading ? (
        <ArrowPathIcon className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {Icon && <Icon className="w-5 h-5" />}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg focus:ring-blue-500',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm hover:shadow-md focus:ring-gray-500',
    ghost: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 focus:ring-blue-500',
  };

  return (
    <button
      className={clsx(baseStyles, variantStyles[variant], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

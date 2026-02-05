'use client';

import * as React from 'react';
import { cn } from '../../utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg';
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? React.Fragment : 'button';
    
    const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    
    const variants = {
      default: 'bg-blue-600 text-white hover:bg-blue-700',
      outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
      ghost: 'text-gray-700 hover:bg-gray-100',
      link: 'text-blue-600 underline-offset-4 hover:underline',
    };
    
    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 px-3 text-sm',
      lg: 'h-12 px-6 text-lg',
    };

    if (asChild && props.children) {
      return React.cloneElement(props.children as React.ReactElement, {
        className: cn(baseStyles, variants[variant], sizes[size], className),
        ref,
      });
    }

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };

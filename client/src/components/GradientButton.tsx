import React from 'react';
import { cn } from '../lib/utils';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'gold' | 'charcoal' | 'outline';
  className?: string;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  variant = 'gold',
  className = '',
  ...props
}) => {
  const variantStyles = {
    gold: 'btn-theme-expand-gold',
    charcoal: 'btn-theme-expand-charcoal',
    outline: 'btn-theme-expand-outline'
  };

  return (
    <button
      className={cn(
        'btn-theme-expand px-7 py-3.5 rounded-[15px] font-black text-xs sm:text-sm tracking-wide flex items-center justify-center space-x-2',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center space-x-2">
        {children}
      </span>
    </button>
  );
};

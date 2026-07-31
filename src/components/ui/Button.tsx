'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'destructive' | 'ghost' | 'outline' | 'default';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-teal-700 text-white hover:bg-teal-800 focus-visible:ring-teal-700 border-transparent',
  default: 'bg-teal-700 text-white hover:bg-teal-800 focus-visible:ring-teal-700 border-transparent',
  secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300 focus-visible:ring-slate-500 border-transparent',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600 border-transparent',
  destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600 border-transparent',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-500 border-transparent',
  outline: 'bg-transparent text-teal-700 border-teal-700 hover:bg-teal-50 focus-visible:ring-teal-700',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-sm px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
  lg: 'text-base px-6 py-3 gap-2.5',
  icon: 'p-2 rounded-lg',
};

export function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
  const widthStyles = fullWidth ? 'w-full' : '';
  const currentVariantStyle = variantStyles[variant] || variantStyles.primary;
  const currentSizeStyle = sizeStyles[size] || sizeStyles.md;

  return (
    <button
      className={`${baseStyles} ${currentVariantStyle} ${currentSizeStyle} ${widthStyles} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="animate-spin w-4 h-4" />}
      {!loading && icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

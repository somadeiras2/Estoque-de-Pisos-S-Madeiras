'use client';

import { InputHTMLAttributes, forwardRef, useId } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, hint, fullWidth = true, ...props }, ref) => {
    const id = useId();
    const inputId = props.id || id;
    const widthStyle = fullWidth ? 'w-full' : '';
    const errorStyle = error 
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
      : 'border-slate-300 focus:ring-teal-500 focus:border-teal-500';

    return (
      <div className={`flex flex-col gap-1.5 ${widthStyle} ${className}`}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-800">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`px-3 py-2 bg-white border rounded-lg text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors duration-200 focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:bg-slate-50 ${errorStyle} ${widthStyle}`}
          {...props}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {hint && !error && <p className="text-sm text-slate-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

'use client';

import { SelectHTMLAttributes, forwardRef, useId } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, hint, options, placeholder, fullWidth = true, ...props }, ref) => {
    const id = useId();
    const selectId = props.id || id;
    const widthStyle = fullWidth ? 'w-full' : '';
    const errorStyle = error 
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
      : 'border-slate-300 focus:ring-teal-500 focus:border-teal-500';

    return (
      <div className={`flex flex-col gap-1.5 ${widthStyle} ${className}`}>
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-slate-800">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`px-3 py-2 bg-white border rounded-lg text-sm text-slate-800 outline-none transition-colors duration-200 focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:bg-slate-50 appearance-none ${errorStyle} ${widthStyle}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="text-slate-400">
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {hint && !error && <p className="text-sm text-slate-500">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

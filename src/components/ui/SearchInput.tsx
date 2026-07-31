'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  className?: string;
  initialValue?: string;
}

export function SearchInput({ 
  placeholder = 'Buscar...', 
  onSearch, 
  value: controlledValue,
  onChange,
  onClear,
  className = '',
  initialValue = ''
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(initialValue);
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!onSearch) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    const handler = setTimeout(() => {
      onSearch(currentValue);
    }, 300);

    return () => clearTimeout(handler);
  }, [currentValue, onSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setInternalValue(e.target.value);
    }
    if (onChange) {
      onChange(e);
    }
  };

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue('');
    }
    if (onClear) {
      onClear();
    }
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-slate-400" />
      </div>
      
      <input
        type="text"
        value={currentValue}
        onChange={handleChange}
        className="block w-full pl-10 pr-10 py-3 md:py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors duration-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        placeholder={placeholder}
      />
      
      {currentValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

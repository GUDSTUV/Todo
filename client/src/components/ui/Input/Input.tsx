import { forwardRef, useState } from 'react';
import type { InputProps } from './Input.type';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, showPasswordToggle, className = '', onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const hasValue = Boolean(props.value || props.defaultValue);
    const isPasswordType = props.type === 'password';

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <div className="w-full">
        <div className="relative">
          <input
            ref={ref}
            type={isPasswordType && showPasswordToggle && showPassword ? 'text' : props.type}
            className={`
              w-full px-4 pt-4 pb-2 border rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed
              transition-all peer bg-transparent
              ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
              ${className}
            `}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          {label && (
            <label
              htmlFor={props.id}
              className={`
                absolute left-4 px-1 pointer-events-none transition-all duration-200 origin-left
                ${isFocused || hasValue ? 'top-0 text-xs translate-y-0 scale-90' : 'top-1/2 -translate-y-1/2 text-base'}
                ${isFocused ? 'text-blue-600' : error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}
              `}
            >
              {label}
              {props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          {isPasswordType && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

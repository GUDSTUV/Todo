import { forwardRef, useState } from 'react';
import type { InputProps } from './Input.type';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, showPasswordToggle, className = '', onFocus, onBlur, type, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const hasValue = Boolean(props.value || props.defaultValue);
    const isPasswordType = type === 'password';

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleTogglePassword = () => {
      setShowPassword(!showPassword);
    };

    const inputType = isPasswordType && showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full">
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            className={`
              w-full px-4 pt-4 pb-2 border rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed
              transition-all peer bg-white dark:bg-gray-800
              ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
              ${isPasswordType && showPasswordToggle ? 'pr-16' : ''}
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
                bg-white dark:bg-gray-800
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
              onClick={handleTogglePassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none z-10 cursor-pointer"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
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

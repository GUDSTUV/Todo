import { forwardRef } from 'react';
import type { CheckboxProps } from './Checkbox.type';


export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <label className="inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          ref={ref}
          className={`
            w-5 h-5 text-blue-600 border-gray-300 dark:border-gray-600 rounded
            focus:ring-2 focus:ring-blue-500 focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed
            dark:bg-gray-700 dark:checked:bg-blue-600
            ${className}
          `}
          {...props}
        />
        {label && <span className="ml-2 text-sm text-gray-900 dark:text-gray-100">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

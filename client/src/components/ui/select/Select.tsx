import { forwardRef, useEffect, useState, type ChangeEvent } from 'react';
import type { SelectProps } from './Select.type';


export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className = '', ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
      const check = () => {
        /* keep modal behavior driven by CSS (sm:hidden) — resize listener kept for potential future logic */
        return;
      };
      window.addEventListener('resize', check);
      return () => window.removeEventListener('resize', check);
    }, []);

    const rest = props as SelectProps;
    const currentValue = rest.value ?? '';

    const handleSelect = (value: string) => {
      setIsOpen(false);
      if (props.onChange) {
        // call onChange with a synthetic ChangeEvent<HTMLSelectElement>-like shape
        const ev = { target: { value } } as unknown as ChangeEvent<HTMLSelectElement>;
        props.onChange(ev);
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Native select for sm and up (keeps desktop behavior) */}
        <div className="hidden sm:block">
          <select
            ref={ref}
            className={`
              w-full px-3 py-2 border rounded-lg shadow-sm 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed
              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
              ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
              ${className}
            `}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Mobile-friendly picker: button + full-screen modal to avoid dropdown overflow */}
        <div className="sm:hidden">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-left flex items-center justify-between ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${className}`}
          >
            <span className="truncate">
              {options.find((o) => String(o.value) === String(currentValue))?.label || 'Select'}
            </span>
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center">
              <div className="absolute inset-0 bg-black/40" onClick={() => setIsOpen(false)} />
              <div className="relative w-full bg-white dark:bg-gray-800 rounded-t-lg p-4 max-h-[80vh] overflow-auto">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">{label || 'Select an option'}</h3>
                  <button onClick={() => setIsOpen(false)} className="text-sm text-gray-600 dark:text-gray-300">Close</button>
                </div>
                <div className="space-y-2">
                  {options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSelect(String(option.value))}
                      className={`w-full text-left px-3 py-2 rounded-lg ${String(option.value) === String(currentValue) ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

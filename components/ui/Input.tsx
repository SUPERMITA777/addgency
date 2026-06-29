import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col space-y-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs uppercase tracking-wider text-muted font-sans font-light">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full bg-surface border ${error ? 'border-danger' : 'border-border'} text-text text-sm rounded-[4px] px-3 py-2.5 transition-all duration-200 focus:outline-none focus:border-accent ${className}`}
        {...props}
      />
      {error && (
        <span className="text-[11px] text-danger font-mono mt-0.5">{error}</span>
      )}
    </div>
  );
};
export default Input;

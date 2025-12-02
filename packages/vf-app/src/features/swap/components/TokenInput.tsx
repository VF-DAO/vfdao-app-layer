import React, { useCallback, useRef } from 'react';

interface TokenInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  max?: string;
  decimalLimit?: number;
  variant?: 'swap' | 'form';
}

const formatWithSpaces = (value: string): string => {
  if (!value || value === '0.') return value;
  const [integer, decimal] = value.split('.');
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return decimal !== undefined ? `${formattedInteger}.${decimal}` : formattedInteger;
};

export const TokenInput: React.FC<TokenInputProps> = ({
  value,
  onChange,
  placeholder = '0.0',
  disabled = false,
  className = '',
  max,
  decimalLimit,
  variant = 'swap',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent invalid characters like 'e', 'E', '+', '-'
    const invalidKeys = ['e', 'E', '+', '-'];

    if (invalidKeys.includes(e.key)) {
      e.preventDefault();
      return;
    }

    // Handle decimal limit
    if (decimalLimit !== undefined && e.key === '.') {
      const currentValue = e.currentTarget.value;
      if (currentValue.includes('.')) {
        e.preventDefault();
        return;
      }
    }

    // Allow backspace, delete, tab, escape, enter, and arrow keys
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Tab' ||
      e.key === 'Escape' ||
      e.key === 'Enter' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown'
    ) {
      return;
    }

    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
    if (e.ctrlKey || e.metaKey) {
      return;
    }

    // Allow digits, decimal point, and comma (comma will be converted to dot)
    if (!/[0-9.,]/.test(e.key)) {
      e.preventDefault();
    }
  }, [decimalLimit]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    // Remove spaces and convert comma to dot for decimal separator
    newValue = newValue.replace(/\s/g, '').replace(/,/g, '.');

    // Handle decimal limit
    if (decimalLimit !== undefined && newValue.includes('.')) {
      const parts = newValue.split('.');
      if (parts[1] && parts[1].length > decimalLimit) {
        newValue = `${parts[0]}.${parts[1].substring(0, decimalLimit)}`;
      }
    }

    // Remove leading zeros (except for decimal cases like "0.")
    if (newValue.startsWith('0') && newValue.length > 1 && !newValue.startsWith('0.')) {
      newValue = newValue.replace(/^0+/, '');
    }

    // Ensure we don't start with a decimal point
    if (newValue.startsWith('.')) {
      newValue = `0${newValue}`;
    }

    // Prevent multiple decimal points
    const dotCount = (newValue.match(/\./g) ?? []).length;
    if (dotCount > 1) {
      // Keep only the first decimal point
      const firstDotIndex = newValue.indexOf('.');
      const beforeDot = newValue.substring(0, firstDotIndex + 1);
      const afterDot = newValue.substring(firstDotIndex + 1).replace(/\./g, '');
      newValue = beforeDot + afterDot;
    }

    // Validate that newValue represents a valid number before emitting
    // Allow empty string and partial inputs like "0."
    if (newValue !== '' && newValue !== '0.') {
      const num = parseFloat(newValue);
      if (isNaN(num) || !isFinite(num) || num < 0) {
        return; // Don't emit invalid values
      }
    }

    onChange(newValue);
  }, [onChange, decimalLimit]);

  const handleWheel = useCallback(() => {
    // Prevent accidental changes from mouse wheel
    inputRef.current?.blur();
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={formatWithSpaces(value)}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      placeholder={placeholder}
      disabled={disabled}
      max={max}
      className={`w-full bg-transparent outline-none ${
        variant === 'swap' 
          ? 'text-xl font-semibold text-right leading-none h-auto py-0' 
          : 'text-sm text-left h-12 px-4'
      } ${className}`}
      style={{
        textAlign: variant === 'swap' ? 'right' : 'left',
      }}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck="false"
    />
  );
};
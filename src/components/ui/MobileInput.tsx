'use client';

import { useState } from 'react';
import { cn, getMobileError, sanitizeMobileInput } from '@/lib/utils';

interface MobileInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
}

/**
 * Indian mobile number input: digits only, max 10, must start with 6-9.
 * Shows an inline error once the field has been touched.
 */
export default function MobileInput({
  value, onChange, required = false, label = 'Mobile number',
  placeholder = '10-digit mobile number', className, id, name,
}: MobileInputProps) {
  const [touched, setTouched] = useState(false);
  const error = touched ? getMobileError(value, required, label) : '';

  return (
    <>
      <div className="relative">
      {/* Fixed, non-editable country code */}
      <span
        aria-hidden="true"
        className="pointer-events-none select-none absolute left-0 inset-y-0 flex items-center pl-3 pr-2 text-sm text-gray-500 border-r border-gray-200 my-1.5"
      >
        +91
      </span>
      <input
        id={id}
        name={name}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={value || ''}
        onChange={(e) => onChange(sanitizeMobileInput(e.target.value))}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
        required={required}
        pattern="[6-9][0-9]{9}"
        title="Enter a valid 10-digit Indian mobile number starting with 6-9"
        aria-invalid={!!error}
        aria-label={`${label} (+91)`}
        className={cn(className, 'pl-14', error && 'border-red-400 focus:ring-red-400')}
      />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </>
  );
}

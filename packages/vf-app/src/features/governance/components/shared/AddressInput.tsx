import React, { useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import { LoadingDots } from '@/components/ui/loading-dots';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { useNearAddressValidation } from './useNearAddressValidation';
import { useProfile } from '@/hooks/use-profile';

interface AddressInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
  error?: string;
  onValidationChange?: (exists: boolean | null) => void;
  className?: string;
}

export function AddressInput({
  id,
  value,
  onChange,
  placeholder,
  label,
  error,
  onValidationChange,
  className = '',
}: AddressInputProps) {
  const { exists, validationState: _validationState, isChecking } = useNearAddressValidation(value);
  
  // Fetch profile when address is valid
  const { profileImageUrl, loading: profileLoading } = useProfile(exists === true ? value : null);

  // Use ref to avoid infinite loops when onValidationChange is not memoized
  const onValidationChangeRef = useRef(onValidationChange);
  onValidationChangeRef.current = onValidationChange;

  // Notify parent of validation state changes
  useEffect(() => {
    onValidationChangeRef.current?.(exists);
  }, [exists]);

  // Border color - muted by default, with validation feedback on focus
  const getBorderColor = () => {
    if (exists === true) {
      return 'border-border hover:border-muted-foreground/50 focus:border-muted-foreground/50';
    }
    if (exists === false) {
      return 'border-border hover:border-muted-foreground/50 focus:border-orange/50';
    }
    return 'border-border hover:border-muted-foreground/50 focus:border-muted-foreground/50';
  };

  // Only show icons when there's input
  const showIcon = value.trim().length >= 3;
  const showProfile = exists === true && !isChecking && !profileLoading;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs text-muted-foreground">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {/* Profile/User icon on the left - always present for consistent positioning */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <ProfileAvatar
            accountId={value}
            size="sm"
            profileImageUrl={showProfile ? profileImageUrl : undefined}
            showFallback
          />
        </div>
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          className={`w-full h-12 bg-transparent border rounded-full text-sm focus:outline-none pr-10 pl-11 placeholder:text-primary placeholder:font-medium placeholder:opacity-60 leading-tight ${getBorderColor()}`}
          placeholder={placeholder}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {showIcon && isChecking ? (
            <LoadingDots size="xs" />
          ) : showIcon && exists === true ? (
            <Check className="w-5 h-5 text-primary" strokeWidth={2.5} />
          ) : showIcon && exists === false ? (
            <X className="w-5 h-5 text-orange" strokeWidth={2.5} />
          ) : null}
        </div>
      </div>
      {error && (
        <p className="text-xs text-orange">{error}</p>
      )}
    </div>
  );
}
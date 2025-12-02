import { useEffect, useMemo, useRef, useState } from 'react';

// NEAR Address Validation Hook - relies on blockchain validation only
export function useNearAddressValidation(address: string) {
  const [isChecking, setIsChecking] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [exists, setExists] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref for cache to avoid re-triggering effect
  const cacheRef = useRef<Record<string, { exists: boolean | null; error: string | null; timestamp: number }>>({});

  // Check if account exists on blockchain (RPC-only validation)
  useEffect(() => {
    const trimmedAddress = address.trim();
    
    if (!trimmedAddress) {
      setExists(null);
      setError(null);
      setIsDebouncing(false);
      setIsChecking(false);
      return;
    }

    if (trimmedAddress.length < 3) {
      setExists(null);
      setError(null);
      setIsDebouncing(false);
      setIsChecking(false);
      return;
    }

    // Check cache first (valid for 5 minutes)
    const cached = cacheRef.current[trimmedAddress];
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      setExists(cached.exists);
      setError(cached.error);
      setIsDebouncing(false);
      setIsChecking(false);
      return;
    }

    // Reset state for new validation
    setExists(null);
    setError(null);
    setIsDebouncing(true);

    const updateCache = (result: { exists: boolean | null; error: string | null }) => {
      const newCache = { ...cacheRef.current, [trimmedAddress]: { ...result, timestamp: Date.now() } };
      // Limit cache size to prevent memory issues
      const entries = Object.entries(newCache);
      if (entries.length > 50) {
        // Keep only the 50 most recent entries
        const sorted = entries.sort(([, a], [, b]) => b.timestamp - a.timestamp);
        cacheRef.current = Object.fromEntries(sorted.slice(0, 50));
      } else {
        cacheRef.current = newCache;
      }
    };

    const checkAccount = async () => {
      setIsDebouncing(false);
      setIsChecking(true);
      setError(null);

      try {
        // Use NEAR RPC to check if account exists
        const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';

        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: '1',
            method: 'query',
            params: {
              request_type: 'view_account',
              account_id: trimmedAddress,
              finality: 'final',
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.result) {
          // Account exists
          const result = { exists: true, error: null };
          setExists(true);
          setError(null);
          updateCache(result);
        } else if (data.error) {
          // Check the specific error type
          const errorName = data.error.cause?.name ?? data.error.name;
          if (errorName === 'UNKNOWN_ACCOUNT' || data.error.message?.includes('does not exist')) {
            // Valid format but account doesn't exist
            const result = { exists: false, error: null };
            setExists(false);
            setError(null);
            updateCache(result);
          } else {
            // Invalid format or other RPC errors
            const errorMsg = data.error.data ?? data.error.message ?? 'Invalid NEAR account format';
            const result = { exists: null, error: errorMsg };
            setExists(null);
            setError(errorMsg);
            updateCache(result);
          }
        } else {
          // Unexpected response format
          const errorMsg = 'Unable to verify account - unexpected response';
          const result = { exists: null, error: errorMsg };
          setExists(null);
          setError(errorMsg);
          updateCache(result);
        }
      } catch (err) {
        console.warn('Failed to check account existence:', err);
        const errorMsg = 'Network error - unable to verify account';
        const result = { exists: null, error: errorMsg };
        setExists(null);
        setError(errorMsg);
        updateCache(result);
      } finally {
        setIsChecking(false);
      }
    };

    const timeoutId = setTimeout(() => void checkAccount(), 800); // Wait 800ms after user stops typing
    
    return () => {
      clearTimeout(timeoutId);
      setIsDebouncing(false);
    };
  }, [address]);  // Overall validation state
  const validationState = useMemo(() => {
    const trimmedAddress = address.trim();
    if (!trimmedAddress) return 'neutral';
    if (trimmedAddress.length < 3) return 'neutral';
    if (isDebouncing) return 'neutral'; // Show nothing while debouncing
    if (isChecking) return 'checking';
    if (exists === true) return 'valid';
    if (exists === false) return 'not-found';
    if (error && exists === null) return 'invalid';
    return 'neutral';
  }, [address, exists, isChecking, isDebouncing, error]);

  return {
    exists,
    isChecking,
    validationState,
    error,
  };
}
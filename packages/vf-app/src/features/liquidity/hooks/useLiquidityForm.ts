import { useCallback, useState } from 'react';

type LiquidityState = 'add' | 'remove' | null;

export interface UseLiquidityFormReturn {
  // Liquidity mode
  liquidityState: LiquidityState;
  setLiquidityState: (state: LiquidityState) => void;
  
  // Token amounts
  token1Amount: string;
  setToken1Amount: (amount: string) => void;
  token2Amount: string;
  setToken2Amount: (amount: string) => void;
  
  // Settings
  slippage: number;
  setSlippage: (value: number) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  customSlippage: string;
  setCustomSlippage: (value: string) => void;
  
  // Gas reserve
  showGasReserveInfo: boolean;
  setShowGasReserveInfo: (show: boolean) => void;
  showGasReserveMessage: boolean;
  setShowGasReserveMessage: (show: boolean) => void;
  
  // Actions
  handleSlippageChange: (value: number) => void;
  handleCustomSlippage: (value: string) => void;
  resetForm: () => void;
}

export function useLiquidityForm(): UseLiquidityFormReturn {
  // Liquidity mode
  const [liquidityState, setLiquidityState] = useState<LiquidityState>(null);
  
  // Token amounts
  const [token1Amount, setToken1Amount] = useState('');
  const [token2Amount, setToken2Amount] = useState('');
  
  // Settings
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [customSlippage, setCustomSlippage] = useState('');
  
  // Gas reserve
  const [showGasReserveInfo, setShowGasReserveInfo] = useState(false);
  const [showGasReserveMessage, setShowGasReserveMessage] = useState(false);
  
  // Slippage setting
  const handleSlippageChange = useCallback((value: number) => {
    setSlippage(value);
    setCustomSlippage('');
  }, []);

  const handleCustomSlippage = useCallback((value: string) => {
    setCustomSlippage(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 50) {
      setSlippage(numValue);
    }
  }, []);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setToken1Amount('');
    setToken2Amount('');
    setShowGasReserveInfo(false);
    setShowGasReserveMessage(false);
  }, []);

  return {
    // Liquidity mode
    liquidityState,
    setLiquidityState,
    
    // Token amounts
    token1Amount,
    setToken1Amount,
    token2Amount,
    setToken2Amount,
    
    // Settings
    slippage,
    setSlippage,
    showSettings,
    setShowSettings,
    customSlippage,
    setCustomSlippage,
    
    // Gas reserve
    showGasReserveInfo,
    setShowGasReserveInfo,
    showGasReserveMessage,
    setShowGasReserveMessage,
    
    // Actions
    handleSlippageChange,
    handleCustomSlippage,
    resetForm,
  };
}

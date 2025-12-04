'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ExternalLink, LogOut, RefreshCw, User, Wallet } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { dropdownVariants, transitions } from '@/lib/animations';
import { dropdownStyles } from '@/components/ui/dropdown-menu';
import { useWallet } from '../contexts/wallet-context';
import { LoadingDots } from '@/components/ui/loading-dots';
import { Button } from '@/components/ui/button';

interface WalletButtonProps {
  compact?: boolean;
  className?: string;
}

export function WalletButton({ compact = false, className }: WalletButtonProps) {
  const { connector, accountId, isConnected, signIn, signOut, isConnecting, isLoading } = useWallet();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDisconnect = async () => {
    await signOut();
    setShowMenu(false);
  };

  const handleSwitchWallet = async () => {
    if (connector) {
      try {
        // Note: This bypasses the isConnecting state since it's a direct connector call
        // For consistency, you might want to refactor to use signIn or add loading here
        await connector.connect();
        setShowMenu(false);
      } catch (error) {
        // Handle user rejection gracefully - don't treat as error
        if (error === null || (error instanceof Error && (error.message === 'User rejected' || error.message === 'Wallet closed' || error.message.includes('cancel') || error.message.includes('reject')))) {
          console.warn('User cancelled wallet switch');
        } else {
          console.error('Failed to switch wallet:', error);
        }
      }
    }
  };

  if (!isConnected) {
    return (
      <Button
        onClick={() => void signIn()}
        disabled={!connector || isConnecting || isLoading}
        variant="verified"
        className={`min-h-[40px] ${compact ? 'px-3 py-2 w-full min-w-[44px]' : ''} ${className ?? ''}`}
      >
        <Wallet className="w-4 h-4 flex-shrink-0" />
        <span className="inline-flex items-center justify-center min-h-[20px]">
          {!compact && !isConnecting && !isLoading && <span className="hidden sm:inline whitespace-nowrap">Connect Wallet</span>}
          {(isConnecting || isLoading) && <LoadingDots />}
        </span>
      </Button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center gap-2.5 bg-card hover:bg-card/50 border border-border hover:border-muted-foreground/50 rounded-full px-3.5 py-2 transition-all duration-150 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          compact ? 'px-3 py-2.5 w-full justify-center' : ''
  } ${className ?? ''}`}
      >
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
            <div className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-ping opacity-75"></div>
          </div>
          <Wallet className="w-3.5 h-3.5 text-primary" />
          {!compact && (
            <span className="text-foreground text-sm font-medium max-w-[120px] truncate tracking-tight">
              {accountId}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-all duration-150 ${showMenu ? 'rotate-180' : ''} ${
            compact ? 'w-3 h-3' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={transitions.normal}
            className="absolute w-64 bg-card border border-border rounded-2xl shadow-dropdown z-50 overflow-hidden backdrop-blur-md bottom-full left-2 mb-2"
          >
          {/* Header - matches Modal.Header gradient style, clips to parent rounded corners */}
          <div className="bg-gradient-to-r from-primary/5 via-verified/5 to-primary/5 p-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted/50 text-muted-foreground">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Connected
                </p>
                <p className="text-foreground text-sm font-medium truncate tracking-tight">
                  {accountId}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-border py-2 px-2 space-y-0.5">
            <button
              onClick={() => {
                window.open(`https://testnet.nearblocks.io/address/${accountId}`, '_blank');
                setShowMenu(false);
              }}
              className="w-full px-4 py-2.5 flex items-center gap-2 rounded-full hover:bg-muted/50 hover:text-primary transition-colors text-left group"
            >
              <User className="w-4 h-4 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm text-muted-foreground group-hover:text-primary font-medium transition-colors">View on Explorer</span>
              <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/50 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => void handleSwitchWallet()}
              className="w-full px-4 py-2.5 flex items-center gap-2 rounded-full hover:bg-muted/50 hover:text-primary transition-colors text-left group"
            >
              <RefreshCw className="w-4 h-4 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm text-muted-foreground group-hover:text-primary font-medium transition-colors">Switch Wallet</span>
            </button>

            <div className="h-px bg-border my-2 mx-2"></div>

            <button
              onClick={() => void handleDisconnect()}
              className="w-full px-4 py-2.5 flex items-center gap-2 rounded-full hover:bg-orange/5 hover:text-orange transition-colors text-left group"
            >
              <LogOut className="w-4 h-4 flex-shrink-0 text-muted-foreground group-hover:text-orange transition-colors" />
              <span className="text-sm text-muted-foreground group-hover:text-orange font-medium transition-colors">
                Disconnect
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
}

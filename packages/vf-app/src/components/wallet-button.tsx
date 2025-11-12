'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ExternalLink, LogOut, RefreshCw, User, Wallet } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useWallet } from '@/contexts/wallet-context';

interface WalletButtonProps {
  compact?: boolean;
  className?: string;
}

export function WalletButton({ compact = false, className }: WalletButtonProps) {
  const { connector, accountId, isConnected, signIn, signOut } = useWallet();
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
        await connector.connect();
        setShowMenu(false);
      } catch (error) {
        // Handle user rejection gracefully - don't treat as error
        if (error instanceof Error && (error.message === 'User rejected' || error.message === 'Wallet closed')) {
          console.log('User cancelled wallet switch');
        } else {
          console.error('Failed to switch wallet:', error);
        }
      }
    }
  };

  if (!isConnected) {
    return (
      <button
        onClick={() => void signIn()}
        disabled={!connector}
        className={`flex items-center justify-center gap-2 border border-verified bg-verified/10 text-primary hover:text-primary px-4 py-2 rounded-full font-semibold transition-all hover:shadow-md hover:shadow-verified/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
          compact ? 'px-3 py-2 w-full min-w-[44px]' : ''
  } ${className ?? ''}`}
      >
        <Wallet className="w-4 h-4 flex-shrink-0" />
        {!compact && <span className="hidden sm:inline whitespace-nowrap">Connect Wallet</span>}
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center gap-2.5 bg-card hover:bg-card/50 border border-border hover:border-primary/50 rounded-full px-3.5 py-2 transition-all duration-150 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className={`absolute w-64 bg-popover/95 border border-primary/20 rounded-3xl shadow-lg z-50 overflow-hidden backdrop-blur-md bottom-full left-2 mb-2`}
          >
          <div className="p-4 border-b border-primary/10 bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">
              Connected Account
            </p>
            <p className="text-foreground text-sm font-medium truncate tracking-tight">
              {accountId}
            </p>
          </div>

          <div className="py-2">
            <button
              onClick={() => {
                window.open(`https://testnet.nearblocks.io/address/${accountId}`, '_blank');
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-accent/10 transition-all duration-150 text-left group"
            >
              <User className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-150" />
              <span className="text-sm text-foreground font-medium">View on Explorer</span>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
            </button>

            <button
              onClick={() => void handleSwitchWallet()}
              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-accent/10 transition-all duration-150 text-left group"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-150" />
              <span className="text-sm text-foreground font-medium">Switch Wallet</span>
            </button>

            <div className="h-px bg-border my-2 mx-3"></div>

            <button
              onClick={() => void handleDisconnect()}
              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-destructive/5 transition-all duration-150 text-left group"
            >
              <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors duration-150" />
              <span className="text-sm text-muted-foreground group-hover:text-destructive font-medium transition-colors duration-150">
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

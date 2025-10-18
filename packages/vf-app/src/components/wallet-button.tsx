'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ExternalLink, LogOut, RefreshCw, User, Wallet } from 'lucide-react';
import { useWallet } from '@/contexts/wallet-context';

export function WalletButton() {
  const { modal, accountId, isConnected, selector } = useWallet();
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
    if (selector) {
      const wallet = await selector.wallet();
      await wallet.signOut();
      setShowMenu(false);
    }
  };

  const handleSwitchWallet = () => {
    modal?.show();
    setShowMenu(false);
  };

  if (!isConnected) {
    return (
      <button
        onClick={() => modal?.show()}
        disabled={!modal}
        className="flex items-center gap-2 bg-primary hover:bg-primary/90 border border-primary text-primary-foreground px-4 py-2 rounded-full font-medium transition-all duration-150 text-sm group focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm hover:shadow-md hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Wallet className="w-3.5 h-3.5 transition-all duration-150" />
        <span className="hidden sm:inline">Connect Wallet</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2.5 bg-card hover:bg-card/50 border border-border hover:border-primary/50 rounded-full px-3.5 py-2 transition-all duration-150 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
            <div className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-ping opacity-75"></div>
          </div>
          <Wallet className="w-3.5 h-3.5 text-primary" />
          <span className="text-foreground text-sm font-medium max-w-[100px] truncate hidden sm:block tracking-tight">
            {accountId}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-all duration-150 ${showMenu ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute right-0 md:right-0 left-0 md:left-auto mt-2 w-64 bg-popover/95 border border-primary/20 rounded-3xl shadow-lg z-50 overflow-hidden backdrop-blur-md">
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
              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-muted/50 transition-all duration-150 text-left group"
            >
              <User className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-150" />
              <span className="text-sm text-foreground font-medium">View on Explorer</span>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
            </button>

            <button
              onClick={handleSwitchWallet}
              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-muted/50 transition-all duration-150 text-left group"
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
        </div>
      )}
    </div>
  );
}

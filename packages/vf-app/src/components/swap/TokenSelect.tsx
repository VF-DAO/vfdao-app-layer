'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import Image from 'next/image';
import { MAINNET_TOKENS } from '@/lib/swap-utils';

interface Token {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
}

interface TokenSelectProps {
  selectedToken?: Token;
  onSelectToken: (token: Token) => void;
  otherToken?: Token;
  label?: string;
}

export function TokenSelect({
  selectedToken,
  onSelectToken,
  otherToken,
  label = 'Select Token',
}: TokenSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tokens based on search and exclude other token
  const filteredTokens = useMemo(() => {
    let tokens = MAINNET_TOKENS;

    // Exclude the other token from selection
    if (otherToken) {
      tokens = tokens.filter((t) => t.id !== otherToken.id);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      tokens = tokens.filter(
        (t) =>
          t.symbol.toLowerCase().includes(query) ||
          t.name.toLowerCase().includes(query) ||
          t.id.toLowerCase().includes(query)
      );
    }

    return tokens;
  }, [searchQuery, otherToken]);

  const handleSelect = (token: Token) => {
    onSelectToken(token);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors min-w-[140px]"
      >
        {selectedToken ? (
          <>
            {selectedToken.icon && (
              <Image
                src={selectedToken.icon}
                alt={selectedToken.symbol}
                width={24}
                height={24}
                className="rounded-full"
              />
            )}
            <span className="font-semibold text-foreground">{selectedToken.symbol}</span>
          </>
        ) : (
          <span className="text-muted-foreground">{label}</span>
        )}
        <ChevronDown className="w-4 h-4 ml-auto" />
      </button>

      {/* Dropdown Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setSearchQuery('');
            }}
          />

          {/* Modal */}
          <div className="absolute top-full mt-2 left-0 w-[340px] bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">Select Token</h3>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or symbol"
                  className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Token List */}
            <div className="max-h-[320px] overflow-y-auto">
              {filteredTokens.length > 0 ? (
                <div className="p-2">
                  {filteredTokens.map((token) => (
                    <button
                      key={token.id}
                      onClick={() => handleSelect(token)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors ${
                        selectedToken?.id === token.id ? 'bg-muted' : ''
                      }`}
                    >
                      {token.icon ? (
                        <Image
                          src={token.icon}
                          alt={token.symbol}
                          width={32}
                          height={32}
                          className="rounded-full"
                          onError={(e) => {
                            // Fallback to placeholder if image fails
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${token.symbol}&background=random`;
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                          {token.symbol.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-foreground">{token.symbol}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {token.name}
                        </div>
                      </div>
                      {selectedToken?.id === token.id && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No tokens found</p>
                </div>
              )}
            </div>

            {/* Popular Tokens Footer */}
            {!searchQuery && (
              <div className="p-3 border-t border-border bg-muted/30">
                <p className="text-xs text-muted-foreground mb-2">Popular tokens</p>
                <div className="flex gap-2 flex-wrap">
                  {['wNEAR', 'REF', 'USDT', 'USDC'].map((symbol) => {
                    const token = MAINNET_TOKENS.find((t) => t.symbol === symbol);
                    if (!token || token.id === otherToken?.id) return null;

                    return (
                      <button
                        key={token.id}
                        onClick={() => handleSelect(token)}
                        className="px-3 py-1 bg-card hover:bg-muted border border-border rounded-full text-xs font-medium transition-colors"
                      >
                        {symbol}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink, Linkedin, Share2 } from 'lucide-react';
import { FaXTwitter } from 'react-icons/fa6';
import { Button } from '@/components/ui/button';
import { dropdownStyles } from '@/components/ui/dropdown-menu';
import type { Proposal } from '../types';

interface QuickActionsProps {
  proposal: Proposal;
}

export function QuickActions({ proposal }: QuickActionsProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareExpanded, setShareExpanded] = useState(false);

  const handleViewOnExplorer = () => {
    // Use transaction hash if available (for newly created proposals)
    if (proposal.transaction_hash) {
      const explorerUrl = `https://nearblocks.io/txns/${proposal.transaction_hash}`;
      window.open(explorerUrl, '_blank');
      return;
    }

    // Fallback: Link to contract transactions page filtered by add_proposal method
    // This shows all proposal creation transactions for the DAO
    const explorerUrl = `https://nearblocks.io/address/vegan-friends.sputnik-dao.near?tab=txns&method=add_proposal`;
    window.open(explorerUrl, '_blank');
  };

  const handleCopyLink = async () => {
    const proposalUrl = `${window.location.origin}/dao?proposal=${proposal.id}`;
    try {
      await navigator.clipboard.writeText(proposalUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleNativeShare = async () => {
    const proposalUrl = `${window.location.origin}/dao?proposal=${proposal.id}`;
    const proposalTitle = `Proposal #${proposal.id}`;
    const proposalText = proposal.description.split('\n')[0];

    if (navigator.share) {
      try {
        await navigator.share({
          title: proposalTitle,
          text: `Check out this proposal on Vegan Friends DAO: ${proposalText}`,
          url: proposalUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  const handleShareOnTwitter = () => {
    const proposalUrl = `${window.location.origin}/dao?proposal=${proposal.id}`;
    const proposalTitle = `Proposal #${proposal.id}`;
    const proposalText = proposal.description.split('\n')[0];
    const tweetText = `Check out this proposal on Vegan Friends DAO: ${proposalTitle} - ${proposalText}`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(proposalUrl)}`;
    window.open(tweetUrl, '_blank');
  };

  const handleShareOnLinkedIn = () => {
    const proposalUrl = `${window.location.origin}/dao?proposal=${proposal.id}`;
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(proposalUrl)}`;
    window.open(linkedInUrl, '_blank');
  };

  // Check if device supports native Web Share API and is mobile
  const isMobile = typeof window !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const supportsNativeShare = typeof navigator !== 'undefined' &&
    'share' in navigator &&
    isMobile;

  return (
    <div className="pt-3 mt-3 border-t border-border/50">
      <div className="flex items-center justify-between">
        {/* Primary Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="navMuted"
            size="filter"
            onClick={handleViewOnExplorer}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Explorer
          </Button>
        </div>

        {/* Share Section - Native or Dropdown */}
        <div className="relative">
          {supportsNativeShare ? (
            // Mobile: Single native share button
            <Button
              variant="navMuted"
              size="filter"
              onClick={() => void handleNativeShare()}
            >
              <Share2 className="w-3 h-3 mr-1" />
              Share
            </Button>
          ) : (
            // Desktop: Dropdown with manual options
            <>
              <Button
                variant="navMuted"
                size="filter"
                onClick={() => setShareExpanded(!shareExpanded)}
              >
                <Share2 className="w-3 h-3 mr-1" />
                Share
              </Button>

              {/* Desktop Share Dropdown */}
              {shareExpanded && (
                <div className={`absolute right-0 top-full mt-1 ${dropdownStyles.container} min-w-[160px] sm:min-w-[140px] p-2 space-y-0.5`}>
                  <button
                    onClick={() => { void handleCopyLink(); setTimeout(() => setShareExpanded(false), 1500); }}
                    className="w-full px-4 py-2.5 flex items-center gap-2 rounded-full hover:bg-muted/50 hover:text-primary transition-colors text-left group"
                  >
                    {copySuccess ? (
                      <Check className="w-4 h-4 flex-shrink-0 text-verified" />
                    ) : (
                      <Copy className="w-4 h-4 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                    <span className="text-sm text-muted-foreground group-hover:text-primary font-medium transition-colors whitespace-nowrap">
                      {copySuccess ? 'Copied!' : 'Copy Link'}
                    </span>
                  </button>

                  <button
                    onClick={() => { handleShareOnTwitter(); setShareExpanded(false); }}
                    className="w-full px-4 py-2.5 flex items-center gap-2 rounded-full hover:bg-muted/50 hover:text-primary transition-colors text-left group"
                  >
                    <FaXTwitter className="w-4 h-4 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm text-muted-foreground group-hover:text-primary font-medium transition-colors">Twitter</span>
                  </button>

                  <button
                    onClick={() => { handleShareOnLinkedIn(); setShareExpanded(false); }}
                    className="w-full px-4 py-2.5 flex items-center gap-2 rounded-full hover:bg-muted/50 hover:text-primary transition-colors text-left group"
                  >
                    <Linkedin className="w-4 h-4 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm text-muted-foreground group-hover:text-primary font-medium transition-colors">LinkedIn</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {shareExpanded && !supportsNativeShare && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShareExpanded(false)}
        />
      )}
    </div>
  );
}
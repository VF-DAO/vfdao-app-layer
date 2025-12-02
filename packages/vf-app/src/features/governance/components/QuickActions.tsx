'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink, Linkedin, Share2 } from 'lucide-react';
import { FaXTwitter } from 'react-icons/fa6';
import { Button } from '@/components/ui/button';
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
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-dropdown p-2 z-10 min-w-[140px] animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { void handleCopyLink(); setTimeout(() => setShareExpanded(false), 1500); }}
                      className="w-full justify-start text-xs h-8 px-2 hover:text-primary transition-colors"
                    >
                      {copySuccess ? (
                        <Check className="w-3 h-3 mr-2 text-verified" />
                      ) : (
                        <Copy className="w-3 h-3 mr-2 text-primary hover:text-primary transition-colors" />
                      )}
                      {copySuccess ? 'Copied!' : 'Copy Link'}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { handleShareOnTwitter(); setShareExpanded(false); }}
                      className="w-full justify-start text-xs h-8 px-2 hover:text-primary transition-colors"
                    >
                      <FaXTwitter className="w-3 h-3 mr-2 text-primary hover:text-primary transition-colors" />
                      Twitter
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { handleShareOnLinkedIn(); setShareExpanded(false); }}
                      className="w-full justify-start text-xs h-8 px-2 hover:text-primary transition-colors"
                    >
                      <Linkedin className="w-3 h-3 mr-2 text-primary hover:text-primary transition-colors" />
                      LinkedIn
                    </Button>
                  </div>
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
import React, { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, Linkedin, Twitter, X } from 'lucide-react';
import { Button } from './button';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: {
    id: number;
    description: string;
  };
}

/**
 * Share modal for proposals
 */
export function ShareModal({ isOpen, onClose, proposal }: ShareModalProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const proposalUrl = `${window.location.origin}/dao?proposal=${proposal.id}`;
  const proposalTitle = `Proposal #${proposal.id}`;
  const proposalText = proposal.description.split('\n')[0]; // First line of description

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(proposalUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShareOnTwitter = () => {
    const tweetText = `Check out this proposal on Vegan Friends DAO: ${proposalTitle} - ${proposalText}`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(proposalUrl)}`;
    window.open(tweetUrl, '_blank');
  };

  const handleShareOnLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(proposalUrl)}`;
    window.open(linkedInUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 max-w-md w-full shadow-xl animate-in zoom-in-95 duration-300">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Share Proposal</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Proposal Info */}
          <div className="space-y-2">
            <div className="font-semibold text-sm">{proposalTitle}</div>
            <div className="text-xs text-muted-foreground line-clamp-2">{proposalText}</div>
          </div>

          {/* Share Options */}
          <div className="space-y-3">
            <Button
              onClick={handleShareOnTwitter}
              variant="outline"
              className="w-full justify-start gap-3 h-12 hover:bg-verified/5 hover:border-verified/30"
            >
              <Twitter className="w-5 h-5 text-verified" />
              <span>Share on X (Twitter)</span>
              <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
            </Button>

            <Button
              onClick={handleShareOnLinkedIn}
              variant="outline"
              className="w-full justify-start gap-3 h-12 hover:bg-primary/5 hover:border-muted-foreground/50"
            >
              <Linkedin className="w-5 h-5 text-primary" />
              <span>Share on LinkedIn</span>
              <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
            </Button>

            <Button
              onClick={() => void handleCopyLink()}
              variant="outline"
              className="w-full justify-start gap-3 h-12 hover:bg-verified/5 hover:border-verified/30"
            >
              {copySuccess ? (
                <Check className="w-5 h-5 text-verified" />
              ) : (
                <Copy className="w-5 h-5 text-primary" />
              )}
              <span>{copySuccess ? 'Copied!' : 'Copy Link'}</span>
            </Button>
          </div>

          {/* Link Preview */}
          <div className="pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground mb-2">Link:</div>
            <div className="text-xs font-mono bg-muted p-2 rounded break-all">
              {proposalUrl}
            </div>
          </div>

          {/* Cancel Button */}
          <div className="pt-4 border-t border-border">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full hover:bg-muted/50"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
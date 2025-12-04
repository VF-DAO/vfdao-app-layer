import React, { useState } from 'react';
import { Check, Copy, ExternalLink, Linkedin, Share2, Twitter } from 'lucide-react';
import { Button } from './button';
import { Modal } from './modal';

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
 * Uses centralized Modal component for consistent styling
 */
export function ShareModal({ isOpen, onClose, proposal }: ShareModalProps) {
  const [copySuccess, setCopySuccess] = useState(false);

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

  // Header icon
  const headerIcon = (
    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
      <Share2 className="w-5 h-5 text-primary" />
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <Modal.Header
        icon={headerIcon}
        title="Share Proposal"
        subtitle={proposalTitle}
        onClose={onClose}
      />

      <Modal.Content className="space-y-4">
        {/* Proposal Info */}
        <div className="text-sm text-muted-foreground line-clamp-2">
          {proposalText}
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
      </Modal.Content>

      <Modal.Footer className="border-t border-border">
        <Button
          onClick={onClose}
          variant="muted"
          className="w-full h-12"
        >
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
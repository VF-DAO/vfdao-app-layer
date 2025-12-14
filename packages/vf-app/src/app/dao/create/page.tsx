'use client';

import { useState } from 'react';
import { ArrowLeftRight, Send, UserMinus, UserPlus, Vote } from 'lucide-react';
import { CreateProposal, type ProposalType } from '@/features/governance/components/CreateProposal';
import { FloatingHeader } from '@/components/ui/floating-header';

// Map proposal types to icons
const proposalIcons: Record<ProposalType, React.ReactNode> = {
  Transfer: <Send className="w-4 h-4" />,
  TokenSwap: <ArrowLeftRight className="w-4 h-4" />,
  AddMemberToRole: <UserPlus className="w-4 h-4" />,
  RemoveMemberFromRole: <UserMinus className="w-4 h-4" />,
  Vote: <Vote className="w-4 h-4" />,
};

export default function CreateProposalPage() {
  const [proposalType, setProposalType] = useState<ProposalType | null>(null);
  const [proposalLabel, setProposalLabel] = useState<string | null>(null);

  return (
    <>
      <FloatingHeader
        displayName={proposalLabel || undefined}
        displayIcon={proposalType ? proposalIcons[proposalType] : undefined}
        showCollapsedProfile={!!proposalLabel}
        fadeCollapsedProfile={false}
      />
      <div className="md:container md:mx-auto px-4 py-24 pt-20 md:pt-24">
        <CreateProposal onTypeChange={(type, label) => {
          setProposalType(type);
          setProposalLabel(label);
        }} />
      </div>
    </>
  );
}
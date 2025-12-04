'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Globe, GraduationCap, Heart, Leaf, Palette, Shield, Store } from 'lucide-react';
import { expandVariants, transitions } from '@/lib/animations';
import { Button } from '@/components/ui/button';
import { TokenAmount } from '@/components/ui/token-amount';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useTheme } from 'next-themes';
import type { Proposal } from '../types';

// VS Code-like syntax highlighting theme that adapts to light/dark mode
const createVsCodeTheme = (isDark: boolean) => ({
  'code[class*="language-"]': {
    color: isDark ? '#d4d4d4' : '#000000',
    background: 'transparent',
    fontFamily: 'var(--font-mono)',
    textAlign: 'left' as const,
    whiteSpace: 'pre' as const,
    wordSpacing: 'normal',
    wordBreak: 'normal' as const,
    wordWrap: 'normal' as const,
    lineHeight: '1.25',
    tabSize: 2,
    hyphens: 'none' as const,
  },
  'pre[class*="language-"]': {
    color: isDark ? '#d4d4d4' : '#000000',
    background: 'transparent',
    fontFamily: 'var(--font-mono)',
    textAlign: 'left' as const,
    whiteSpace: 'pre' as const,
    wordSpacing: 'normal',
    wordBreak: 'normal' as const,
    wordWrap: 'normal' as const,
    lineHeight: '1.25',
    tabSize: 2,
    hyphens: 'none' as const,
    padding: '0.5rem',
    margin: 0,
    overflow: 'auto' as const,
  },
  comment: {
    color: isDark ? '#6a9955' : '#008000',
  },
  punctuation: {
    color: isDark ? '#d4d4d4' : '#000000',
  },
  property: {
    color: isDark ? '#9cdcfe' : '#001080',
  },
  boolean: {
    color: isDark ? '#569cd6' : '#0000ff',
  },
  number: {
    color: isDark ? '#b5cea8' : '#098658',
  },
  string: {
    color: isDark ? '#ce9178' : '#a31515',
  },
  operator: {
    color: isDark ? '#d4d4d4' : '#000000',
  },
  variable: {
    color: isDark ? '#9cdcfe' : '#001080',
  },
  function: {
    color: isDark ? '#dcdcaa' : '#795e26',
  },
  keyword: {
    color: isDark ? '#569cd6' : '#0000ff',
  },
});

interface ProposalDetailsProps {
  proposal: Proposal;
  description: string | null;
}

export function ProposalDetails({ proposal, description }: ProposalDetailsProps) {
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const type = Object.keys(proposal.kind)[0];
  const data = proposal.kind[type as keyof typeof proposal.kind];

  // Handle expand/collapse with auto-scroll when collapsing
  const handleToggleExpanded = () => {
    const willCollapse = expanded; // If currently expanded, we're about to collapse
    setExpanded(!expanded);
    
    // Scroll to center the proposal card in viewport when collapsing
    if (willCollapse && containerRef.current) {
      // For very long proposals, we need to wait for the animation to complete
      // Use a longer delay and ensure we're at the final position
      setTimeout(() => {
        // Use requestAnimationFrame to ensure DOM has updated
        requestAnimationFrame(() => {
          if (containerRef.current) {
            // Find the proposal card (Card component) by traversing up the DOM
            // containerRef -> CardContent -> Card
            const proposalCard = containerRef.current.parentElement?.parentElement;
            if (proposalCard) {
              const cardRect = proposalCard.getBoundingClientRect();
              
              // Scroll to the top of the card with responsive offset for mobile/desktop
              const absoluteTop = window.pageYOffset + cardRect.top;
              const isMobile = window.innerWidth < 768; // Mobile breakpoint
              const offset = isMobile ? 100 : 40; // 100px offset on mobile, 40px on desktop
              const scrollTarget = Math.max(0, absoluteTop - offset);
              
              window.scrollTo({
                top: scrollTarget,
                behavior: 'smooth'
              });
            } else {
              // Fallback: scroll to top of container with small offset
              const containerRect = containerRef.current.getBoundingClientRect();
              const containerAbsoluteTop = window.pageYOffset + containerRect.top;
              const fallbackScrollTarget = Math.max(0, containerAbsoluteTop - 20);
              
              window.scrollTo({
                top: fallbackScrollTarget,
                behavior: 'smooth'
              });
            }
          }
        });
      }, 500); // Longer delay for very long content animations
    }
  };

  const shouldTruncateDesc = description && description.length > 200;

  // Helper to determine if content is large and should be collapsible
  const shouldCollapse = (content: any) => {
    if (!content) return false;

    // Transfer proposals - only collapse if there's a message
    if (type === 'Transfer' && content.msg) return true;

    // Function calls with multiple actions (more than 2)
    if (type === 'FunctionCall' && content.actions && content.actions.length > 2) return true;

    // Policy changes with many permissions
    if (type === 'ChangePolicyAddOrUpdateRole' && content.role?.permissions?.length > 3) return true;

    // ChangeConfig with metadata
    if (type === 'ChangeConfig' && content.config?.metadata) return true;

    // For unknown types, check JSON length (fallback case only)
    const knownTypes = ['Transfer', 'AddMemberToRole', 'RemoveMemberFromRole', 'FunctionCall', 'ChangeConfig', 'AddBounty', 'ChangePolicyAddOrUpdateRole'];
    if (!knownTypes.includes(type) && typeof content === 'object') {
      const jsonString = JSON.stringify(content);
      return jsonString.length > 200;
    }

    return false;
  };

  const isLargeContent = shouldCollapse(data);

  const renderContent = () => {
    // Transfer proposal - show recipient and amount
    if (type === 'Transfer' && data && typeof data === 'object' && 'receiver_id' in data) {
      const transfer = data as { receiver_id: string; amount: string; token_id: string; msg?: string };

      return (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Recipient:</span>
            <span className="text-sm text-foreground font-medium">{transfer.receiver_id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Amount:</span>
            <TokenAmount
              amount={transfer.amount}
              tokenId={transfer.token_id}
              showBadge={false}
              className="text-foreground font-medium"
            />
          </div>
          {transfer.token_id && transfer.token_id !== '' && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Token:</span>
              <span className="text-sm text-primary font-medium">{transfer.token_id}</span>
            </div>
          )}
          {transfer.msg && (
            <AnimatePresence initial={false}>
              {(!isLargeContent || expanded) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={transitions.fast}
                  className="overflow-hidden"
                >
                  <div className="pt-2 border-t border-border">
                    <div className="text-muted-foreground mb-1">Message:</div>
                    <div className="text-xs">{transfer.msg}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      );
    }

    // Add/Remove member proposals
    if ((type === 'AddMemberToRole' || type === 'RemoveMemberFromRole') && data && typeof data === 'object' && 'member_id' in data) {
      const member = data as { member_id: string; role: string };
      return (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Member:</span>
            <span className="text-sm text-foreground font-medium">{member.member_id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Role:</span>
            <RoleBadge role={member.role} />
          </div>
        </div>
      );
    }

    // Change config proposal
    if (type === 'ChangeConfig' && data && typeof data === 'object' && 'config' in data) {
      const config = (data as any).config as { name: string; purpose: string; metadata: string };
      return (
        <div className="space-y-2 text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground">New Configuration:</div>
            <div className="pl-3 space-y-1">
              <div><span className="font-medium">Name:</span> {config.name}</div>
              <div><span className="font-medium">Purpose:</span> {config.purpose}</div>
              {config.metadata && (
                <AnimatePresence initial={false}>
                  {(!isLargeContent || expanded) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={transitions.fast}
                      className="overflow-hidden"
                    >
                      <div><span className="font-medium">Metadata:</span> {config.metadata}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Function call proposal
    if (type === 'FunctionCall' && data && typeof data === 'object' && 'receiver_id' in data) {
      const call = data as { receiver_id: string; actions: { method_name: string; args: string; deposit: string; gas: string }[] };
      const displayActions = isLargeContent && !expanded ? call.actions.slice(0, 2) : call.actions;

      return (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Contract:</span>
            <span className="text-sm text-foreground font-medium">{call.receiver_id}</span>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">
              Actions ({call.actions.length}){isLargeContent && !expanded && ' - showing first 2'}:
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={expanded ? 'expanded' : 'collapsed'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={transitions.fast}
                className="overflow-hidden"
              >
                <div className="pl-3 space-y-2">
                  {displayActions.map((action, i) => (
                    <div key={i} className="space-y-1">
                      <div className="font-medium text-xs">{action.method_name}</div>
                      <div className="text-xs text-muted-foreground">
                        Gas: {(parseInt(action.gas) / 1e12).toFixed(0)} TGas
                        {action.deposit !== '0' && (
                          <>
                            {' • Deposit: '}
                            <TokenAmount
                              amount={action.deposit}
                              tokenId="" // Function call deposits are always in NEAR
                              className="inline text-foreground font-medium"
                              showIcon={false}
                              showBadge={false}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      );
    }

    // Add bounty proposal
    if (type === 'AddBounty' && data && typeof data === 'object' && 'bounty' in data) {
      const bounty = (data as any).bounty as { description: string; amount: string; token: string; times: number; max_deadline: string };

      return (
        <div className="space-y-2 text-sm">
          <div className="text-muted-foreground font-medium">{bounty.description}</div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Reward:</span>
            <TokenAmount
              amount={bounty.amount}
              tokenId={bounty.token}
              showBadge={false}
              className="text-foreground font-medium"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Available Claims:</span>
            <span className="font-medium">{bounty.times}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Deadline:</span>
            <span className="text-xs">{new Date(parseInt(bounty.max_deadline) / 1e6).toLocaleDateString()}</span>
          </div>
        </div>
      );
    }

    // Other proposal types...
    // [Rest of the existing cases remain the same but with conditional rendering based on expanded state]

    // Fallback for other proposal types
    if (data && typeof data === 'object') {
      const jsonString = JSON.stringify(data, null, 2);
      const shouldTruncate = jsonString.length > 200 && !expanded;
      const displayJson = shouldTruncate ? jsonString.substring(0, 200) + '...' : jsonString;

      return (
        <div className="text-sm">
          <div className="text-muted-foreground mb-2">Proposal Data:</div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={expanded ? 'expanded' : 'collapsed'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transitions.fast}
              className="overflow-hidden"
            >
              <SyntaxHighlighter
                language="json"
                style={createVsCodeTheme(theme === 'dark')}
                customStyle={{
                  margin: 0,
                  padding: '0.5rem',
                  fontSize: '0.75rem',
                  lineHeight: '1.25',
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.375rem',
                }}
                wrapLines={true}
                wrapLongLines={true}
              >
                {displayJson}
              </SyntaxHighlighter>
            </motion.div>
          </AnimatePresence>
        </div>
      );
    }

    return null;
  };

  // Show container if we have description OR proposal data
  if (!description && !data) return null;

  return (
    <div ref={containerRef} className="space-y-3 pt-3">
      {/* Description section */}
      {description && (
        <div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={expanded ? 'expanded' : 'truncated'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transitions.fast}
              className={`text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap overflow-hidden break-words ${
                shouldTruncateDesc && !expanded ? 'line-clamp-4' : ''
              }`}
            >
              {description}
            </motion.p>
          </AnimatePresence>
          {shouldTruncateDesc && !data && (
            <Button
              onClick={handleToggleExpanded}
              variant="ghost"
              size="sm"
              className="h-auto p-0 mt-2 text-xs text-primary hover:text-primary/80 font-medium border-none"
            >
              {expanded ? 'Show less' : 'Show more'}
              <motion.div
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-3 h-3" />
              </motion.div>
            </Button>
          )}
        </div>
      )}

      {/* Proposal details section */}
      {data && renderContent()}

      {/* Show more for large content */}
      {(isLargeContent || (shouldTruncateDesc && data)) && (
        <Button
          onClick={handleToggleExpanded}
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs text-primary hover:text-primary/80 font-medium border-none"
        >
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-3 h-3" />
          </motion.div>
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      )}
    </div>
  );
}

// Role badge with icon - styled like "Let's Connect" button
function RoleBadge({ role }: { role: string }) {
  // Role configuration: unique icon for each VF DAO group
  const roleConfig: Record<string, { icon: typeof Shield; label: string }> = {
    council: { icon: Shield, label: 'Council' },                                   // Governance/leadership
    community: { icon: Globe, label: 'Community' },                                // General community
    members: { icon: Shield, label: 'Members' },                                    // DAO members
    charities: { icon: Heart, label: 'Charities' },                                // Charitable organizations
    creatives: { icon: Palette, label: 'Creatives' },                              // Artists/designers
    education: { icon: GraduationCap, label: 'Education' },                        // Education initiatives
    'vegan-friendly businesses': { icon: Store, label: 'Vegan-Friendly Businesses' }, // Vegan businesses
    all: { icon: Shield, label: 'All' },                                            // Everyone
  };

  // Get config or use Leaf as fallback for unknown roles
  const normalizedRole = role.toLowerCase();
  const config = roleConfig[normalizedRole] || { icon: Leaf, label: role };

  return (
    <span className="text-primary font-medium text-sm">
      {config.label}
    </span>
  );
}
'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { expandVariants, transitions } from '@/lib/animations';
import { Button } from '@/components/ui/button';
import type { Proposal } from '../types';

interface ActionLogProps {
  proposal: Proposal;
}

export function ActionLog({ proposal }: ActionLogProps) {
  const [expanded, setExpanded] = useState(false);
  const logs = proposal.last_actions_log || [];

  if (logs.length === 0) {
    return null;
  }

  // Show only the 3 most recent entries when collapsed
  const displayLogs = expanded ? logs : logs.slice(-3);

  // Helper to format relative time from block_height
  const formatBlockTime = (blockHeight: string) => {
    // Since we don't have actual timestamps, we'll use block heights as a proxy
    // In real implementation, this would convert block height to actual time
    return `Block #${blockHeight}`;
  };

  return (
    <div className="space-y-2 pt-3 mt-3 border-t border-border/50">
      <Button
        onClick={() => setExpanded(!expanded)}
        variant="link"
        size="sm"
        className="h-auto p-0 text-xs font-medium text-muted-foreground hover:text-primary"
      >
        <motion.span
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={transitions.fast}
          className="text-base"
        >
          ▶
        </motion.span>
        <span>Activity Log ({logs.length})</span>
      </Button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            variants={expandVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={transitions.expand}
            className="overflow-hidden"
          >
            <div className="space-y-2 pl-4">
              {displayLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <span className="mt-1 w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-mono">{formatBlockTime(log.block_height)}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!expanded && logs.length > 3 && (
          <motion.div
            variants={expandVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={transitions.fast}
          >
            <Button
              onClick={() => setExpanded(true)}
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs text-primary hover:text-primary/80 pl-6"
            >
              Show {logs.length - 3} more...
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
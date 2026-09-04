import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { resolveOnSocialMediaUrl } from '@/features/onsocial/media';
import { ShieldAlert, ShieldCheck, ShieldOff } from 'lucide-react';
import type { Certificate } from '../types';
import {
  certificateReviewState,
  certificateStateLabel,
  certificateUntilLabel,
} from '../lib/status';

const STATE_CHROME = {
  active: {
    box: 'border-verified/30 bg-verified/5',
    icon: ShieldCheck,
    iconClass: 'text-verified',
    badge: 'verified' as const,
  },
  due: {
    box: 'border-orange/30 bg-orange/5',
    icon: ShieldAlert,
    iconClass: 'text-orange',
    badge: 'orange' as const,
  },
  lapsed: {
    box: 'border-border bg-muted/30',
    icon: ShieldOff,
    iconClass: 'text-muted-foreground',
    badge: 'muted' as const,
  },
  revoked: {
    box: 'border-border bg-muted/30',
    icon: ShieldOff,
    iconClass: 'text-muted-foreground',
    badge: 'muted' as const,
  },
};

export function CertificateBadge({ certificate }: { certificate: Certificate }) {
  const state = certificateReviewState(certificate);
  const chrome = STATE_CHROME[state];
  const Icon = chrome.icon;
  const until = certificateUntilLabel(certificate);
  const evidenceUrl = resolveOnSocialMediaUrl(certificate.evidenceCid);

  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 ${chrome.box}`}>
      <Icon className={`mt-0.5 h-5 w-5 ${chrome.iconClass}`} />
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <p className="font-semibold text-foreground">{certificate.standard}</p>
          <Badge variant={chrome.badge}>{certificateStateLabel(state, certificate.subjectType)}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Stamped by{' '}
          <Link
            href={`/profile/${encodeURIComponent(certificate.issuerAccountId)}`}
            className="font-medium text-foreground hover:text-primary"
          >
            {certificate.issuerAccountId}
          </Link>
        </p>
        {until && <p className="text-xs text-muted-foreground">{until}</p>}
        {evidenceUrl && (
          <a
            href={evidenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-xs font-medium text-primary hover:underline underline-offset-4"
          >
            Evidence
          </a>
        )}
      </div>
    </div>
  );
}

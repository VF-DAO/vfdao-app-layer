import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';
import type { Certificate } from '../types';
import { isCertificateActive } from '../lib/status';

export function CertificateBadge({ certificate }: { certificate: Certificate }) {
  const active = isCertificateActive(certificate);
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-verified/30 bg-verified/5 p-4">
      <ShieldCheck className="mt-0.5 h-5 w-5 text-verified" />
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <p className="font-semibold text-foreground">{certificate.standard}</p>
          <Badge variant={active ? 'verified' : 'orange'}>{active ? 'Active' : certificate.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">Issued by {certificate.issuerAccountId}</p>
        {certificate.expiresAt && (
          <p className="text-xs text-muted-foreground">
            Expires {new Date(certificate.expiresAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

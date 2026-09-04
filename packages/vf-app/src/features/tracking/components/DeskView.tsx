'use client';

import Link from 'next/link';
import { Award, PackagePlus, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProfileAvatar, ProfileName } from '@/components/ui/profile-avatar';
import { useAppDrawer } from '@/features/shell';
import { useStudioActor } from '../hooks/use-studio-actor';
import {
  useCertificatesForAccount,
  useEventsForAccount,
  useLotsForAccount,
  useProductsForAccount,
} from '../hooks/use-tracker';
import { certificateBundleHref, deskTitle, eventBundleHref } from '../lib/desk';
import { canIssueCertificate, canRecordEvent, canRegisterProduct, roleLabel } from '../lib/roles';
import { certificateReviewState, eventKindLabel, groupCertificatesByReview } from '../lib/status';
import type { Certificate } from '../types';
import { CertificateBadge } from './CertificateBadge';
import { ProducerDesk } from './ProducerDesk';
import { TrackingBackendBadge } from './TrackingBackendBadge';

export function DeskView() {
  const actor = useStudioActor();
  const { openDrawer } = useAppDrawer();
  const products = useProductsForAccount(actor.accountId);
  const lots = useLotsForAccount(actor.accountId);
  const events = useEventsForAccount(actor.accountId);
  const certificates = useCertificatesForAccount(actor.accountId);
  const isProducer = actor.role === 'producer';
  const showEvents = !isProducer && canRecordEvent(actor.role);
  const showCerts = canIssueCertificate(actor.role);
  const loading = products.loading || lots.loading || events.loading || certificates.loading;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">{deskTitle(actor.role)}</h1>
        {actor.org && (
          <p className="text-sm text-muted-foreground sm:text-base">
            {actor.org.name} · {roleLabel(actor.org.role)} · {actor.org.accountId}
          </p>
        )}
        <TrackingBackendBadge />
        {actor.pending && <p className="text-sm text-muted-foreground">Checking org role…</p>}
        {actor.reason && <p className="text-sm text-orange">{actor.reason}</p>}
      </div>

      {actor.allowed && (
        <div className="flex flex-wrap gap-2">
          {canRegisterProduct(actor.role) && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              aria-label="Register product"
              onClick={() => openDrawer({ id: 'register-product' })}
            >
              <PackagePlus className="h-4 w-4" />
              <span className="sm:hidden">Register</span>
              <span className="hidden sm:inline">Register product</span>
            </Button>
          )}
          {!isProducer && canRecordEvent(actor.role) && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              aria-label="Record event"
              onClick={() => openDrawer({ id: 'record-event' })}
            >
              <StickyNote className="h-4 w-4" />
              <span className="sm:hidden">Stamp</span>
              <span className="hidden sm:inline">Record event</span>
            </Button>
          )}
          {canIssueCertificate(actor.role) && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              aria-label="Issue certificate"
              onClick={() =>
                openDrawer({ id: 'issue-certificate', onIssued: () => void certificates.reload() })
              }
            >
              <Award className="h-4 w-4" />
              <span className="sm:hidden">Certify</span>
              <span className="hidden sm:inline">Issue certificate</span>
            </Button>
          )}
        </div>
      )}

      {loading && <p className="text-muted-foreground">Loading…</p>}

      {isProducer && products.data && lots.data && (
        <ProducerDesk products={products.data} lots={lots.data} />
      )}

      {showCerts && (
        <CertifierReviews
          certificates={certificates.data ?? []}
          onRevoke={(certificate) =>
            openDrawer({
              id: 'revoke-certificate',
              certificateId: certificate.id,
              standard: certificate.standard,
              subjectId: certificate.subjectId,
              subjectType: certificate.subjectType === 'product' ? 'product' : certificate.subjectType,
              onRevoked: () => void certificates.reload(),
            })
          }
        />
      )}

      {showEvents && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Stamps</h2>
          {events.data?.map((event) => (
            <Card key={event.id} className="border border-border p-5">
              <Link href={eventBundleHref(event)} className="block">
                <h3 className="text-lg font-semibold text-foreground">{eventKindLabel(event.kind)}</h3>
                <p className="text-sm text-muted-foreground">
                  {event.note} · {event.at}
                </p>
              </Link>
            </Card>
          ))}
          {events.data?.length === 0 && !events.loading && (
            <p className="text-sm text-muted-foreground">No stamps on your path yet.</p>
          )}
        </section>
      )}
    </div>
  );
}

const REVIEW_SECTIONS: { key: keyof ReturnType<typeof groupCertificatesByReview>; title: string }[] = [
  { key: 'due', title: 'Due' },
  { key: 'active', title: 'Active' },
  { key: 'lapsed', title: 'Lapsed' },
  { key: 'revoked', title: 'Revoked' },
];

function CertifierReviews({
  certificates,
  onRevoke,
}: {
  certificates: Certificate[];
  onRevoke: (certificate: Certificate) => void;
}) {
  const reviews = certificates.filter((certificate) => certificate.subjectType === 'org');
  const lotStamps = certificates.filter((certificate) => certificate.subjectType !== 'org');
  const groups = groupCertificatesByReview(reviews);
  const noneYet = reviews.length === 0 && lotStamps.length === 0;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Company reviews</h2>
        <p className="text-sm text-muted-foreground">
          Facility clock. Due is inside 30 days. Lapsed and revoked stay visible — they do not certify SKUs.
        </p>
        {REVIEW_SECTIONS.map(({ key, title }) =>
          groups[key].length > 0 ? (
            <div key={key} className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
              {groups[key].map((certificate) => (
                <CertificateDeskCard
                  key={certificate.id}
                  certificate={certificate}
                  kind="Company review"
                  onRevoke={onRevoke}
                />
              ))}
            </div>
          ) : null
        )}
        {noneYet && (
          <p className="text-sm text-muted-foreground">
            No company reviews or lot stamps from this wallet yet.
          </p>
        )}
        {!noneYet && reviews.length === 0 && (
          <p className="text-sm text-muted-foreground">No company reviews from this wallet yet.</p>
        )}
      </section>

      {!noneYet && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Lot stamps</h2>
          {lotStamps.map((certificate) => (
            <CertificateDeskCard
              key={certificate.id}
              certificate={certificate}
              kind={certificate.subjectType === 'lot' ? 'Lot stamp' : 'Product stamp'}
              onRevoke={onRevoke}
            />
          ))}
          {lotStamps.length === 0 && (
            <p className="text-sm text-muted-foreground">No lot stamps from this wallet yet.</p>
          )}
        </section>
      )}
    </div>
  );
}

function CertificateDeskCard({
  certificate,
  kind,
  onRevoke,
}: {
  certificate: Certificate;
  kind: string;
  onRevoke: (certificate: Certificate) => void;
}) {
  const state = certificateReviewState(certificate);
  const href = certificateBundleHref(certificate);
  const isOrg = certificate.subjectType === 'org';

  return (
    <CertificateBadge
      certificate={certificate}
      detail={
        <div className="mb-1 text-sm text-muted-foreground">
          {kind} of{' '}
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 align-middle font-medium text-foreground hover:text-primary"
          >
            {isOrg ? (
              <>
                <ProfileAvatar accountId={certificate.subjectId} size="xs" />
                <ProfileName accountId={certificate.subjectId} />
              </>
            ) : (
              certificate.subjectId
            )}
          </Link>
        </div>
      }
      actions={
        state !== 'revoked' ? (
          <Button type="button" variant="outline" size="sm" onClick={() => onRevoke(certificate)}>
            Revoke
          </Button>
        ) : undefined
      }
    />
  );
}

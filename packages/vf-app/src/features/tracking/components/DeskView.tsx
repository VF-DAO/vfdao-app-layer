'use client';

import Link from 'next/link';
import { Award, PackagePlus, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAppDrawer } from '@/features/shell';
import { useStudioActor } from '../hooks/use-studio-actor';
import {
  useCertificatesForAccount,
  useEventsForAccount,
  useLotsForAccount,
  useProductsForAccount,
} from '../hooks/use-tracker';
import {
  certificateBundleHref,
  deskTitle,
  eventBundleHref,
  lotBundleHref,
} from '../lib/desk';
import { canCreateLot, canIssueCertificate, canRecordEvent, canRegisterProduct, roleLabel } from '../lib/roles';
import { eventKindLabel } from '../lib/status';
import { TrackingBackendBadge } from './TrackingBackendBadge';

export function DeskView() {
  const actor = useStudioActor();
  const { openDrawer } = useAppDrawer();
  const products = useProductsForAccount(actor.accountId);
  const lots = useLotsForAccount(actor.accountId);
  const events = useEventsForAccount(actor.accountId);
  const certificates = useCertificatesForAccount(actor.accountId);
  const productName = (productId: string) =>
    products.data?.find((product) => product.id === productId)?.name;

  const showProducts = canRegisterProduct(actor.role);
  const showLots = canCreateLot(actor.role);
  const showEvents = canRecordEvent(actor.role);
  const showCerts = canIssueCertificate(actor.role);
  const loading = products.loading || lots.loading || events.loading || certificates.loading;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{deskTitle(actor.role)}</h1>
        {actor.org && (
          <p className="text-muted-foreground">
            {actor.org.name} · {roleLabel(actor.org.role)} · {actor.org.accountId}
          </p>
        )}
        <TrackingBackendBadge />
        {actor.usingDemoProducer && (
          <p className="text-sm text-muted-foreground">
            Demo producer · Green Valley Farms. Connect an org wallet to see your own desk.
          </p>
        )}
        {actor.pending && <p className="text-sm text-muted-foreground">Checking org role…</p>}
        {actor.reason && <p className="text-sm text-orange">{actor.reason}</p>}
      </div>

      {actor.allowed && (
        <div className="flex flex-wrap gap-2">
          {canRegisterProduct(actor.role) && (
            <Button variant="outline" size="sm" onClick={() => openDrawer({ id: 'register-product' })}>
              <PackagePlus className="h-4 w-4" />
              Register product
            </Button>
          )}
          {canCreateLot(actor.role) && (
            <Button variant="outline" size="sm" onClick={() => openDrawer({ id: 'create-lot' })}>
              <PackagePlus className="h-4 w-4" />
              Open lot
            </Button>
          )}
          {canRecordEvent(actor.role) && (
            <Button variant="outline" size="sm" onClick={() => openDrawer({ id: 'record-event' })}>
              <StickyNote className="h-4 w-4" />
              Record event
            </Button>
          )}
          {canIssueCertificate(actor.role) && (
            <Button variant="outline" size="sm" onClick={() => openDrawer({ id: 'issue-certificate' })}>
              <Award className="h-4 w-4" />
              Issue certificate
            </Button>
          )}
        </div>
      )}

      {loading && <p className="text-muted-foreground">Loading your stamps…</p>}

      {showProducts && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Products</h2>
          {products.data?.map((product) => (
            <Card key={product.id} className="border border-border p-5">
              <Link href={`/products/${product.id}`} className="block">
                <p className="text-sm text-muted-foreground">{product.brand}</p>
                <h3 className="text-lg font-semibold text-foreground">{product.name}</h3>
              </Link>
            </Card>
          ))}
          {products.data?.length === 0 && !products.loading && (
            <p className="text-sm text-muted-foreground">No products yet. Register one to start a lot.</p>
          )}
        </section>
      )}

      {showLots && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Lots</h2>
          {lots.data?.map((lot) => (
            <Card key={lot.id} className="border border-border p-5">
              <Link href={lotBundleHref(lot.id)} className="block">
                <h3 className="text-lg font-semibold text-foreground">{lot.label}</h3>
                <p className="text-sm text-muted-foreground">
                  {productName(lot.productId) ?? lot.productId} · {lot.quantity} · {lot.site}
                </p>
              </Link>
            </Card>
          ))}
          {lots.data?.length === 0 && !lots.loading && (
            <p className="text-sm text-muted-foreground">No lots yet. Open one, then scan the QR.</p>
          )}
        </section>
      )}

      {showCerts && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Certificates</h2>
          {certificates.data?.map((certificate) => (
            <Card key={certificate.id} className="border border-border p-5">
              <Link href={certificateBundleHref(certificate)} className="block">
                <h3 className="text-lg font-semibold text-foreground">{certificate.standard}</h3>
                <p className="text-sm text-muted-foreground">
                  {certificate.subjectType} {certificate.subjectId} · {certificate.status}
                </p>
              </Link>
            </Card>
          ))}
          {certificates.data?.length === 0 && !certificates.loading && (
            <p className="text-sm text-muted-foreground">No certificates issued from this wallet yet.</p>
          )}
        </section>
      )}

      {showEvents && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Stamps</h2>
          {events.data?.map((event) => (
            <Card key={event.id} className="border border-border p-5">
              <Link href={eventBundleHref(event)} className="block">
                <h3 className="text-lg font-semibold text-foreground">{eventKindLabel(event.kind)}</h3>
                <p className="text-sm text-muted-foreground">
                  {event.lotId} · {event.note}
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

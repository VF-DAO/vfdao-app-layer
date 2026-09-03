'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EVENT_KINDS, type EventKind, type Product } from '../types';
import { useStudioActor } from '../hooks/use-studio-actor';
import { useLotsForAccount, useProductsForAccount } from '../hooks/use-tracker';
import { useTrackingMutations } from '../hooks/use-tracking-mutations';
import { encodeLotQr, scanHref } from '../lib/qr';
import { canCreateLot, canIssueCertificate, canRecordEvent, canRegisterProduct } from '../lib/roles';

interface FormChromeProps {
  chrome?: 'card' | 'plain';
  title?: string;
  children: ReactNode;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-sm font-medium text-foreground">{children}</label>;
}

function FormChrome({ chrome = 'card', title, children }: FormChromeProps) {
  if (chrome === 'plain') {
    return <div className="space-y-4">{children}</div>;
  }
  return (
    <Card className="border border-border p-6">
      {title && <h2 className="mb-4 text-xl font-semibold">{title}</h2>}
      {children}
    </Card>
  );
}

export function RegisterProductForm({
  chrome = 'card',
  onSuccess,
}: {
  chrome?: 'card' | 'plain';
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const actor = useStudioActor();
  const { registerProduct, pending, error } = useTrackingMutations();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [claims, setClaims] = useState('');
  const allowed = canRegisterProduct(actor.role);

  return (
    <FormChrome chrome={chrome} title="Register product">
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void registerProduct({
            name,
            brand,
            description,
            ingredients: ingredients.split(',').map((item) => item.trim()),
            claims: claims.split(',').map((item) => item.trim()),
            producerAccountId: actor.accountId ?? 'demo.near',
          }).then((product) => {
            onSuccess?.();
            router.push(`/products/${product.id}`);
          });
        }}
      >
        <div>
          <FieldLabel>Name</FieldLabel>
          <Input value={name} onChange={(event) => setName(event.target.value)} required />
        </div>
        <div>
          <FieldLabel>Brand</FieldLabel>
          <Input value={brand} onChange={(event) => setBrand(event.target.value)} required />
        </div>
        <div>
          <FieldLabel>Description</FieldLabel>
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} required />
        </div>
        <div>
          <FieldLabel>Ingredients (comma separated)</FieldLabel>
          <Input value={ingredients} onChange={(event) => setIngredients(event.target.value)} />
        </div>
        <div>
          <FieldLabel>Claims (comma separated)</FieldLabel>
          <Input value={claims} onChange={(event) => setClaims(event.target.value)} />
        </div>
        {!allowed && (
          <p className="text-sm text-orange">{actor.reason ?? 'Producer role required to publish on core.'}</p>
        )}
        {error && <p className="text-sm text-orange">{error}</p>}
        <Button type="submit" variant="verified" disabled={pending || actor.pending || !allowed || !name || !brand}>
          {pending ? 'Saving…' : 'Save product'}
        </Button>
      </form>
    </FormChrome>
  );
}

export function CreateLotForm({
  products,
  productId: initialProductId,
  chrome = 'card',
  onSuccess,
}: {
  products?: Product[];
  productId?: string;
  chrome?: 'card' | 'plain';
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const actor = useStudioActor();
  const catalog = useProductsForAccount(actor.accountId);
  const list = useMemo(() => products ?? catalog.data ?? [], [catalog.data, products]);
  const { createLot, pending, error } = useTrackingMutations();
  const allowed = canCreateLot(actor.role);
  const [productId, setProductId] = useState(initialProductId ?? '');
  const [label, setLabel] = useState('');
  const [harvestedAt, setHarvestedAt] = useState('');
  const [quantity, setQuantity] = useState('');
  const [site, setSite] = useState('');

  useEffect(() => {
    if (!productId && list[0]?.id) {
      setProductId(list[0].id);
    }
  }, [list, productId]);

  return (
    <FormChrome chrome={chrome} title="Open a lot">
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void createLot({
            productId,
            label,
            harvestedAt,
            quantity,
            site,
            producerAccountId: actor.accountId ?? 'demo.near',
          }).then((lot) => {
            onSuccess?.();
            router.push(scanHref(lot.id));
          });
        }}
      >
        <div>
          <FieldLabel>Product</FieldLabel>
          <select
            className="h-12 w-full rounded-full border border-border bg-transparent px-4 text-sm"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
          >
            {list.map((product) => (
              <option key={product.id} value={product.id}>
                {product.brand} · {product.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>Lot label</FieldLabel>
          <Input value={label} onChange={(event) => setLabel(event.target.value)} required />
        </div>
        <div>
          <FieldLabel>Harvested</FieldLabel>
          <Input type="date" value={harvestedAt} onChange={(event) => setHarvestedAt(event.target.value)} required />
        </div>
        <div>
          <FieldLabel>Quantity</FieldLabel>
          <Input value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
        </div>
        <div>
          <FieldLabel>Site</FieldLabel>
          <Input value={site} onChange={(event) => setSite(event.target.value)} required />
        </div>
        {!allowed && (
          <p className="text-sm text-orange">{actor.reason ?? 'Producer role required to open a lot.'}</p>
        )}
        {error && <p className="text-sm text-orange">{error}</p>}
        <Button type="submit" variant="primary" disabled={pending || actor.pending || !allowed || !productId}>
          {pending ? 'Saving…' : 'Create lot'}
        </Button>
      </form>
    </FormChrome>
  );
}

export function RecordEventForm({
  lotId,
  chrome = 'card',
  onSuccess,
}: {
  lotId?: string;
  chrome?: 'card' | 'plain';
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const actor = useStudioActor();
  const mine = useLotsForAccount(actor.accountId);
  const catalog = useProductsForAccount(actor.accountId);
  const { addEvent, pending, error } = useTrackingMutations();
  const [selectedLot, setSelectedLot] = useState(lotId ?? '');
  const [kind, setKind] = useState<EventKind>('sourced');
  const [note, setNote] = useState('');
  const allowed = canRecordEvent(actor.role);
  const lotChoices = mine.data ?? [];
  const useLotSelect = !lotId && lotChoices.length > 0;

  return (
    <FormChrome chrome={chrome} title="Record event">
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void addEvent({
            lotId: selectedLot,
            kind,
            note,
            orgAccountId: actor.accountId ?? 'demo.near',
          }).then((created) => {
            setNote('');
            onSuccess?.();
            router.push(`/scan/${encodeURIComponent(encodeLotQr(created.lotId))}`);
          });
        }}
      >
        {!lotId && useLotSelect && (
          <div>
            <FieldLabel>Lot</FieldLabel>
            <select
              className="h-12 w-full rounded-full border border-border bg-transparent px-4 text-sm"
              value={selectedLot}
              onChange={(event) => setSelectedLot(event.target.value)}
              required
            >
              <option value="">Select a lot</option>
              {lotChoices.map((lot) => {
                const product = catalog.data?.find((item) => item.id === lot.productId);
                return (
                  <option key={lot.id} value={lot.id}>
                    {lot.label}
                    {product ? ` · ${product.name}` : ''}
                  </option>
                );
              })}
            </select>
          </div>
        )}
        {!lotId && !useLotSelect && (
          <div>
            <FieldLabel>Lot id</FieldLabel>
            <Input value={selectedLot} onChange={(event) => setSelectedLot(event.target.value)} required />
          </div>
        )}
        <div>
          <FieldLabel>Stage</FieldLabel>
          <select
            className="h-12 w-full rounded-full border border-border bg-transparent px-4 text-sm"
            value={kind}
            onChange={(event) => setKind(event.target.value as EventKind)}
          >
            {EVENT_KINDS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>Note</FieldLabel>
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} required />
        </div>
        {!allowed && (
          <p className="text-sm text-orange">{actor.reason ?? 'Your org role cannot append chain events.'}</p>
        )}
        {error && <p className="text-sm text-orange">{error}</p>}
        <Button
          type="submit"
          variant="primary"
          disabled={pending || actor.pending || !allowed || !selectedLot || !note}
        >
          {pending ? 'Saving…' : 'Append event'}
        </Button>
      </form>
    </FormChrome>
  );
}

export function IssueCertificateForm({
  subjectId,
  subjectType = 'lot',
  chrome = 'card',
  onSuccess,
}: {
  subjectId?: string;
  subjectType?: 'lot' | 'product';
  chrome?: 'card' | 'plain';
  onSuccess?: () => void;
}) {
  const actor = useStudioActor();
  const { issueCertificate, pending, error } = useTrackingMutations();
  const [id, setId] = useState(subjectId ?? '');
  const [standard, setStandard] = useState('VegCert Vegan Standard 2026');
  const allowed = canIssueCertificate(actor.role);

  return (
    <FormChrome chrome={chrome} title="Issue certificate">
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void issueCertificate({
            subjectType,
            subjectId: id,
            standard,
            issuerAccountId: actor.accountId ?? 'vegcert.near',
          }).then(() => {
            onSuccess?.();
          });
        }}
      >
        {!subjectId && (
          <div>
            <FieldLabel>Subject id</FieldLabel>
            <Input value={id} onChange={(event) => setId(event.target.value)} required />
          </div>
        )}
        <div>
          <FieldLabel>Standard</FieldLabel>
          <Input value={standard} onChange={(event) => setStandard(event.target.value)} required />
        </div>
        {!allowed && <p className="text-sm text-orange">{actor.reason ?? 'Certifier role required.'}</p>}
        {error && <p className="text-sm text-orange">{error}</p>}
        <Button type="submit" variant="verified" disabled={pending || actor.pending || !allowed || !id}>
          {pending ? 'Saving…' : 'Issue certificate'}
        </Button>
      </form>
    </FormChrome>
  );
}

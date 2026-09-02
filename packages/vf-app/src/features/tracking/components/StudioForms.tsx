'use client';

import { type ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useWallet } from '@/features/wallet';
import { EVENT_KINDS, type EventKind, type Product } from '../types';
import { useOrgRole, useProducts } from '../hooks/use-tracker';
import { useTrackingMutations } from '../hooks/use-tracking-mutations';
import { canIssueCertificate, canRecordEvent, canRegisterProduct } from '../lib/roles';
import { encodeLotQr } from '../lib/qr';

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-sm font-medium text-foreground">{children}</label>;
}

export function RegisterProductForm() {
  const router = useRouter();
  const { accountId } = useWallet();
  const { data: org } = useOrgRole(accountId);
  const { registerProduct, pending, error } = useTrackingMutations();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [claims, setClaims] = useState('');
  const allowed = canRegisterProduct(org?.role) || !org;

  return (
    <Card className="border border-border p-6">
      <h2 className="mb-4 text-xl font-semibold">Register product</h2>
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
            producerAccountId: accountId ?? org?.accountId ?? 'demo.near',
          }).then((product) => {
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
        {!allowed && <p className="text-sm text-orange">Producer role required to publish on core.</p>}
        {error && <p className="text-sm text-orange">{error}</p>}
        <Button type="submit" variant="verified" disabled={pending || !name || !brand}>
          {pending ? 'Saving…' : 'Save product'}
        </Button>
      </form>
    </Card>
  );
}

export function CreateLotForm({ products }: { products?: Product[] }) {
  const router = useRouter();
  const { accountId } = useWallet();
  const catalog = useProducts();
  const list = products ?? catalog.data ?? [];
  const { createLot, pending, error } = useTrackingMutations();
  const [productId, setProductId] = useState(list[0]?.id ?? '');
  const [label, setLabel] = useState('');
  const [harvestedAt, setHarvestedAt] = useState('');
  const [quantity, setQuantity] = useState('');
  const [site, setSite] = useState('');

  return (
    <Card className="border border-border p-6">
      <h2 className="mb-4 text-xl font-semibold">Open a lot</h2>
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
            producerAccountId: accountId ?? 'demo.near',
          }).then((lot) => {
            router.push(`/products/${lot.productId}/lots/${lot.id}`);
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
        {error && <p className="text-sm text-orange">{error}</p>}
        <Button type="submit" variant="primary" disabled={pending || !productId}>
          {pending ? 'Saving…' : 'Create lot'}
        </Button>
      </form>
    </Card>
  );
}

export function RecordEventForm({ lotId }: { lotId?: string }) {
  const { accountId } = useWallet();
  const { data: org } = useOrgRole(accountId);
  const { addEvent, pending, error } = useTrackingMutations();
  const [selectedLot, setSelectedLot] = useState(lotId ?? '');
  const [kind, setKind] = useState<EventKind>('sourced');
  const [note, setNote] = useState('');
  const allowed = canRecordEvent(org?.role) || !org;

  return (
    <Card className="border border-border p-6">
      <h2 className="mb-4 text-xl font-semibold">Record event</h2>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void addEvent({
            lotId: selectedLot,
            kind,
            note,
            orgAccountId: accountId ?? org?.accountId ?? 'demo.near',
          }).then((created) => {
            setNote('');
            window.location.assign(`/scan/${encodeURIComponent(encodeLotQr(created.lotId))}`);
          });
        }}
      >
        {!lotId && (
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
        {!allowed && <p className="text-sm text-orange">Your org role cannot append chain events.</p>}
        {error && <p className="text-sm text-orange">{error}</p>}
        <Button type="submit" variant="primary" disabled={pending || !selectedLot || !note}>
          {pending ? 'Saving…' : 'Append event'}
        </Button>
      </form>
    </Card>
  );
}

export function IssueCertificateForm({ subjectId, subjectType = 'lot' }: { subjectId?: string; subjectType?: 'lot' | 'product' }) {
  const { accountId } = useWallet();
  const { data: org } = useOrgRole(accountId);
  const { issueCertificate, pending, error } = useTrackingMutations();
  const [id, setId] = useState(subjectId ?? '');
  const [standard, setStandard] = useState('VegCert Vegan Standard 2026');
  const allowed = canIssueCertificate(org?.role) || !org;

  return (
    <Card className="border border-border p-6">
      <h2 className="mb-4 text-xl font-semibold">Issue certificate</h2>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void issueCertificate({
            subjectType,
            subjectId: id,
            standard,
            issuerAccountId: accountId ?? org?.accountId ?? 'vegcert.near',
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
        {!allowed && <p className="text-sm text-orange">Certifier role required.</p>}
        {error && <p className="text-sm text-orange">{error}</p>}
        <Button type="submit" variant="verified" disabled={pending || !id}>
          {pending ? 'Saving…' : 'Issue certificate'}
        </Button>
      </form>
    </Card>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, PackagePlus, StickyNote } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SearchInput } from '@/components/ui/search-input';
import { useAppDrawer } from '@/features/shell';
import {
  countLabel,
  filterProductDeskRows,
  lotBundleHref,
  lotCountLabel,
  productDeskRows,
} from '../lib/desk';
import { encodeLotQr } from '../lib/qr';
import type { Lot, Product } from '../types';

export function ProducerDesk({ products, lots }: { products: Product[]; lots: Lot[] }) {
  const { openDrawer } = useAppDrawer();
  const [query, setQuery] = useState('');
  const [openIds, setOpenIds] = useState<string[]>([]);
  const rows = useMemo(
    () => filterProductDeskRows(productDeskRows(products, lots), query),
    [products, lots, query]
  );

  useEffect(() => {
    if (!query.trim()) return;
    setOpenIds(rows.map((row) => row.product.id));
  }, [query, rows]);

  const toggle = (productId: string) => {
    setOpenIds((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]
    );
  };

  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-10 -mx-4 bg-background/95 px-4 py-2 backdrop-blur md:static md:mx-0 md:bg-transparent md:px-0 md:py-0">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search products, lots, claims…"
          aria-label="Search products and lots"
        />
      </div>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-xl font-semibold text-foreground">Products</h2>
          <p className="text-xs text-muted-foreground">
            {rows.length === products.length
              ? countLabel(products.length, 'product')
              : `${rows.length} of ${products.length}`}
          </p>
        </div>

        {rows.map((row) => {
          const open = openIds.includes(row.product.id);
          const panelId = `product-lots-${row.product.id}`;
          return (
            <Card key={row.product.id} className="border border-border p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => toggle(row.product.id)}
                >
                  <div className="flex items-start gap-2">
                    <ChevronDown
                      className={`mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-0' : '-rotate-90'}`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">{row.product.brand}</p>
                      <h3 className="text-lg font-semibold text-foreground">{row.product.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {lotCountLabel(row.lots.length)}
                        {row.lastHarvestedAt ? ` · last ${row.lastHarvestedAt}` : ''}
                      </p>
                    </div>
                  </div>
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  className="self-start"
                  aria-label={`Open lot for ${row.product.name}`}
                  onClick={() => openDrawer({ id: 'create-lot', productId: row.product.id })}
                >
                  <PackagePlus className="h-4 w-4" />
                  Open lot
                </Button>
              </div>

              {open && (
                <div id={panelId} className="mt-4 space-y-3 border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">{row.product.description}</p>
                  {row.product.claims.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {row.product.claims.map((claim) => (
                        <Badge key={claim} variant="outline" className="font-medium">
                          {claim}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {row.product.ingredients.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Ingredients · {row.product.ingredients.join(', ')}
                    </p>
                  )}
                  {row.lots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No lots yet. Open one, then scan the QR.</p>
                  ) : (
                    <ul className="space-y-2">
                      {row.lots.map((lot) => (
                        <li key={lot.id}>
                          <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <Link href={lotBundleHref(lot.id)} className="min-w-0 flex-1">
                              <p className="font-semibold text-foreground">{lot.label}</p>
                              <p className="text-sm text-muted-foreground">
                                {lot.harvestedAt} · {lot.quantity} · {lot.site}
                              </p>
                              <p className="mt-1 font-mono text-xs text-muted-foreground">{encodeLotQr(lot.id)}</p>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              className="self-start"
                              aria-label={`Stamp ${lot.label}`}
                              onClick={() => openDrawer({ id: 'record-event', lotId: lot.id })}
                            >
                              <StickyNote className="h-4 w-4" />
                              Stamp
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Card>
          );
        })}

        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {query.trim()
              ? 'No products or lots match that search.'
              : 'No products yet. Register one to start a lot.'}
          </p>
        )}
      </section>
    </div>
  );
}

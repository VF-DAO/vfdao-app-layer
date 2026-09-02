'use client';

import { type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Award, PackagePlus, ScanLine, StickyNote, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppDrawer } from '@/features/shell/drawer-context';
import type { TrackingDrawerAction } from '@/features/shell/drawer-types';
import { FIXTURE_LOT_ID } from '../api/fixtures';
import { QrScanner } from '../components/QrScanner';
import { useStudioActor } from '../hooks/use-studio-actor';
import { encodeLotQr } from '../lib/qr';
import { canCreateLot, canIssueCertificate, canRecordEvent, canRegisterProduct } from '../lib/roles';
import {
  CreateLotForm,
  IssueCertificateForm,
  RecordEventForm,
  RegisterProductForm,
} from '../components/StudioForms';

function ChoiceButton({
  icon,
  title,
  description,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-2xl border border-border bg-muted/20 p-4 text-left transition-colors hover:border-primary/30 hover:bg-muted/40"
    >
      <div className="mt-0.5 text-primary">{icon}</div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

export function TrackingDrawerContent({ action }: { action: TrackingDrawerAction }) {
  const router = useRouter();
  const { closeDrawer } = useAppDrawer();
  const demoCode = encodeLotQr(FIXTURE_LOT_ID);

  if (action.id === 'scan') {
    return (
      <div className="space-y-4">
        <QrScanner
          onCode={(code) => {
            closeDrawer();
            router.push(`/scan/${encodeURIComponent(code)}`);
          }}
        />
        <button
          type="button"
          className="font-mono text-xs text-primary"
          onClick={() => {
            closeDrawer();
            router.push(`/scan/${encodeURIComponent(demoCode)}`);
          }}
        >
          Try demo · {demoCode}
        </button>
      </div>
    );
  }

  if (action.id === 'studio') {
    return <StudioChoices />;
  }

  if (action.id === 'register-product') {
    return (
      <div className="space-y-3">
        <RegisterProductForm chrome="plain" onSuccess={() => closeDrawer()} />
        <DrawerBackToStudio />
      </div>
    );
  }

  if (action.id === 'create-lot') {
    return (
      <div className="space-y-3">
        <CreateLotForm chrome="plain" productId={action.productId} onSuccess={() => closeDrawer()} />
        <DrawerBackToStudio />
      </div>
    );
  }

  if (action.id === 'record-event') {
    return (
      <div className="space-y-3">
        <RecordEventForm chrome="plain" lotId={action.lotId} onSuccess={() => closeDrawer()} />
        <DrawerBackToStudio />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <IssueCertificateForm
        chrome="plain"
        subjectId={action.subjectId}
        subjectType={action.subjectType}
        onSuccess={() => closeDrawer()}
      />
      <DrawerBackToStudio />
    </div>
  );
}

export function drawerCopy(action: TrackingDrawerAction): {
  title: string;
  subtitle: string;
  icon: ReactNode;
} {
  switch (action.id) {
    case 'scan':
      return {
        title: 'Scan a product',
        subtitle: 'Camera or lot code',
        icon: <ScanLine className="h-5 w-5 text-primary" />,
      };
    case 'studio':
      return {
        title: 'Studio',
        subtitle: 'Choose a quick action',
        icon: <Warehouse className="h-5 w-5 text-primary" />,
      };
    case 'register-product':
      return {
        title: 'Register product',
        subtitle: 'Writes to OnSocial core when a session exists',
        icon: <PackagePlus className="h-5 w-5 text-primary" />,
      };
    case 'create-lot':
      return {
        title: 'Open a lot',
        subtitle: 'One production run, one QR',
        icon: <Warehouse className="h-5 w-5 text-primary" />,
      };
    case 'record-event':
      return {
        title: 'Record event',
        subtitle: 'Append a chain step',
        icon: <StickyNote className="h-5 w-5 text-primary" />,
      };
    case 'issue-certificate':
      return {
        title: 'Issue certificate',
        subtitle: 'Certifier only',
        icon: <Award className="h-5 w-5 text-primary" />,
      };
  }
}

function StudioChoices() {
  const { openDrawer } = useAppDrawer();
  const actor = useStudioActor();
  const choices = [
    {
      id: 'register-product' as const,
      icon: <PackagePlus className="h-5 w-5" />,
      title: 'Register product',
      description: 'Add a SKU to the catalog',
      show: canRegisterProduct(actor.role),
    },
    {
      id: 'create-lot' as const,
      icon: <Warehouse className="h-5 w-5" />,
      title: 'Open a lot',
      description: 'Start a production batch',
      show: canCreateLot(actor.role),
    },
    {
      id: 'record-event' as const,
      icon: <StickyNote className="h-5 w-5" />,
      title: 'Record event',
      description: 'Add a stamp on your path',
      show: canRecordEvent(actor.role),
    },
    {
      id: 'issue-certificate' as const,
      icon: <Award className="h-5 w-5" />,
      title: 'Issue certificate',
      description: 'Certifier stamp for a lot or product',
      show: canIssueCertificate(actor.role),
    },
  ];
  const visible = choices.filter((choice) => choice.show);

  return (
    <div className="space-y-3">
      {actor.usingDemoProducer && (
        <p className="text-sm text-muted-foreground">
          Demo producer · Green Valley Farms. Connect an org wallet to write as yourself.
        </p>
      )}
      {actor.pending && <p className="text-sm text-muted-foreground">Checking org role…</p>}
      {actor.reason && <p className="text-sm text-orange">{actor.reason}</p>}
      {visible.map((choice) => (
        <ChoiceButton
          key={choice.id}
          icon={choice.icon}
          title={choice.title}
          description={choice.description}
          onClick={() => openDrawer({ id: choice.id })}
        />
      ))}
      {!actor.pending && visible.length === 0 && !actor.reason && (
        <p className="text-sm text-muted-foreground">No studio actions for this role.</p>
      )}
    </div>
  );
}

export function DrawerBackToStudio() {
  const { openDrawer } = useAppDrawer();
  return (
    <Button type="button" variant="ghost" size="sm" onClick={() => openDrawer({ id: 'studio' })}>
      All studio actions
    </Button>
  );
}

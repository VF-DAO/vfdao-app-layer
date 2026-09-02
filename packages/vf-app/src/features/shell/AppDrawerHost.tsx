'use client';

import { Drawer } from '@/components/ui/drawer';
import { drawerCopy, TrackingDrawerContent } from '@/features/tracking/drawers/TrackingDrawerContent';
import { useAppDrawer } from './drawer-context';

export function AppDrawerHost() {
  const { action, closeDrawer } = useAppDrawer();
  const copy = action ? drawerCopy(action) : null;

  return (
    <Drawer isOpen={Boolean(action)} onClose={closeDrawer} labelledBy="app-drawer-title">
      {copy && (
        <Drawer.Header
          icon={copy.icon}
          title={copy.title}
          subtitle={copy.subtitle}
          onClose={closeDrawer}
        />
      )}
      <Drawer.Content>{action && <TrackingDrawerContent action={action} />}</Drawer.Content>
    </Drawer>
  );
}

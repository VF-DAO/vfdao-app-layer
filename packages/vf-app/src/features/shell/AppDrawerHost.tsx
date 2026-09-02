'use client';

import { Drawer } from '@/components/ui/drawer';
import { JoinDaoDrawerContent } from '@/features/governance/drawers/JoinDaoDrawerContent';
import { ProfileEditorDrawerContent } from '@/features/profile/drawers/ProfileEditorDrawerContent';
import { drawerCopy, TrackingDrawerContent } from '@/features/tracking/drawers/TrackingDrawerContent';
import { useAppDrawer } from './drawer-context';
import { isTrackingDrawerAction } from './drawer-types';

export function AppDrawerHost() {
  const { action, closeDrawer, isLocked } = useAppDrawer();
  const trackingCopy = action && isTrackingDrawerAction(action) ? drawerCopy(action) : null;

  return (
    <Drawer
      isOpen={Boolean(action)}
      onClose={closeDrawer}
      disableClose={isLocked}
      closeOnBackdrop={!isLocked}
      labelledBy="app-drawer-title"
    >
      {trackingCopy && (
        <Drawer.Header
          icon={trackingCopy.icon}
          title={trackingCopy.title}
          subtitle={trackingCopy.subtitle}
          onClose={closeDrawer}
        />
      )}
      {action?.id === 'join-dao' && <JoinDaoDrawerContent />}
      {action?.id === 'edit-profile' && <ProfileEditorDrawerContent />}
      {action && isTrackingDrawerAction(action) && (
        <Drawer.Content>
          <TrackingDrawerContent action={action} />
        </Drawer.Content>
      )}
    </Drawer>
  );
}

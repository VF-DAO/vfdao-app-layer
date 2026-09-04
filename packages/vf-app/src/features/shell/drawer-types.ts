export type TrackingDrawerAction =
  | { id: 'scan' }
  | { id: 'studio' }
  | { id: 'register-product' }
  | { id: 'create-lot'; productId?: string }
  | { id: 'record-event'; lotId?: string }
  | {
      id: 'issue-certificate';
      subjectId?: string;
      subjectType?: 'org' | 'lot' | 'product';
      onIssued?: () => void;
    }
  | {
      id: 'revoke-certificate';
      certificateId: string;
      standard: string;
      subjectId: string;
      subjectType?: 'org' | 'lot' | 'product';
      onRevoked?: () => void;
    };

export type AppDrawerAction =
  | TrackingDrawerAction
  | { id: 'join-dao' }
  | { id: 'edit-profile'; onSuccess?: () => void };

export function isTrackingDrawerAction(action: AppDrawerAction): action is TrackingDrawerAction {
  return action.id !== 'join-dao' && action.id !== 'edit-profile';
}

export interface AppDrawerContextValue {
  action: AppDrawerAction | null;
  isLocked: boolean;
  openDrawer: (action: AppDrawerAction) => void;
  closeDrawer: () => void;
  setLocked: (locked: boolean) => void;
}

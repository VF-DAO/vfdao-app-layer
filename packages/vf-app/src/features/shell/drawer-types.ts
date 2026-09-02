export type AppDrawerAction =
  | { id: 'scan' }
  | { id: 'studio' }
  | { id: 'register-product' }
  | { id: 'create-lot'; productId?: string }
  | { id: 'record-event'; lotId?: string }
  | { id: 'issue-certificate'; subjectId?: string; subjectType?: 'lot' | 'product' };

export interface AppDrawerContextValue {
  action: AppDrawerAction | null;
  openDrawer: (action: AppDrawerAction) => void;
  closeDrawer: () => void;
}

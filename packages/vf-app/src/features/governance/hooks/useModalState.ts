import { useCallback, useState } from 'react';

export type ModalType = 'success' | 'failure' | 'cancelled' | null;

export interface ModalState {
  type: ModalType;
  txHash?: string;
  error?: string;
}

export interface TestSwapResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export function useModalState() {
  // Main modal state for proposal creation results
  const [modal, setModal] = useState<ModalState>({ type: null });

  // Test swap modal state
  const [showTestSwapModal, setShowTestSwapModal] = useState(false);
  const [testSwapLoading, setTestSwapLoading] = useState(false);
  const [testSwapResult, setTestSwapResult] = useState<TestSwapResult | null>(null);

  // Modal handlers
  const openSuccessModal = useCallback((txHash?: string) => {
    setModal({ type: 'success', txHash });
  }, []);

  const openFailureModal = useCallback((error?: string) => {
    setModal({ type: 'failure', error });
  }, []);

  const openCancelledModal = useCallback(() => {
    setModal({ type: 'cancelled' });
  }, []);

  const closeModal = useCallback(() => {
    setModal({ type: null });
  }, []);

  // Test swap modal handlers
  const openTestSwapModal = useCallback(() => {
    setShowTestSwapModal(true);
  }, []);

  const closeTestSwapModal = useCallback(() => {
    setShowTestSwapModal(false);
    setTestSwapResult(null);
    setTestSwapLoading(false);
  }, []);

  const setTestSwapLoadingState = useCallback((loading: boolean) => {
    setTestSwapLoading(loading);
  }, []);

  const setTestSwapResultState = useCallback((result: TestSwapResult | null) => {
    setTestSwapResult(result);
  }, []);

  return {
    // Main modal state
    modal,
    openSuccessModal,
    openFailureModal,
    openCancelledModal,
    closeModal,

    // Test swap modal state
    showTestSwapModal,
    testSwapLoading,
    testSwapResult,
    openTestSwapModal,
    closeTestSwapModal,
    setTestSwapLoadingState,
    setTestSwapResultState,
  };
}
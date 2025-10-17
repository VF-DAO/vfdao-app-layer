'use client'

import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

// Dynamically import WalletProvider with ssr disabled to avoid server-side issues
const WalletProviderDynamic = dynamic(
  () => import('@/contexts/wallet-context').then((mod) => mod.WalletProvider),
  {
    loading: () => <div>{/* Loading wallet provider */}</div>,
    ssr: false,
  }
)

interface WalletProviderWrapperProps {
  children: ReactNode
  contractId?: string
  network?: 'testnet' | 'mainnet'
}

export function WalletProviderWrapper({
  children,
  contractId = 'vfdao.testnet',
  network = 'testnet',
}: WalletProviderWrapperProps) {
  return (
    <WalletProviderDynamic contractId={contractId} network={network}>
      {children}
    </WalletProviderDynamic>
  )
}

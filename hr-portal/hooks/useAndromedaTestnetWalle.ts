import { useChain, useManager } from '@cosmos-kit/react'
import { useMemo } from 'react'

export const useAndromedaTestnetWallet = (chainName: string = 'andromedatestnet') => {
  const chainContext = useChain(chainName)
  const { getWalletRepo } = useManager()

  const {
    chain,
    assets,
    wallet,
    address,
    username,
    connect,
    disconnect,
    openView,
    status,
    message,
    isWalletConnected,
    isWalletConnecting,
    isWalletDisconnected,
    isWalletNotExist,
    isWalletRejected,
    getRpcEndpoint,
    getRestEndpoint,
    getStargateClient,
    getSigningStargateClient,
    getCosmWasmClient,
    getSigningCosmWasmClient,
  } = chainContext

  // Get available wallets
  const wallets = useMemo(() => {
    return getWalletRepo(chainName)?.wallets || []
  }, [getWalletRepo, chainName])

  return {
    // Chain info
    chain,
    assets,
    
    // Wallet connection
    wallet,
    wallets,
    address,
    username,
    
    // Connection methods
    connect,
    disconnect,
    openView,
    
    // Connection status
    status,
    message,
    isWalletConnected,
    isWalletConnecting,
    isWalletDisconnected,
    isWalletNotExist,
    isWalletRejected,
    
    // Client methods for transactions
    getRpcEndpoint,
    getRestEndpoint,
    getStargateClient,
    getSigningStargateClient,
    getCosmWasmClient,
    getSigningCosmWasmClient,
  }
}
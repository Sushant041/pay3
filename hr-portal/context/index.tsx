'use client'

import { wagmiAdapter, projectId } from '@/config'
import { createAppKit } from '@reown/appkit/react'
import { network } from '@/config'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useState, type ReactNode, createContext, useContext, } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'

interface WalletContextType {
  isConnected: boolean;
  setIsConnected: (value: boolean) => void;
  disconnect: () => void;
  Address: string | null;
  setAddress: (value: string | null) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWalletContext must be used inside WalletProvider");
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [ Address, setAddress] = useState<string | null>(null);

  const disconnect = () => {
    setIsConnected(false);
    setAddress(null);
    if (typeof window !== "undefined" && (window as any).keplr) {
      (window as any).keplr.disconnect?.();
    }
  };

  return (
    <WalletContext.Provider value={{ isConnected, setIsConnected, disconnect,  Address, setAddress }}>
      {children}
    </WalletContext.Provider>
  );
};

// Set up queryClient
const queryClient = new QueryClient()



if (!projectId) {
  throw new Error('Project ID is not defined')
}

const metadata = {
  name: "PayThree",
  description: "Employee Payout Management",
  url: "https://payout-hr.vercel.app",
  icons: ["https://avatars.githubusercontent.com/u/179229932"]
}

function ContextProvider({ children, cookies }: { children: React.ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <WalletProvider> {/* Wrap here */}
            {children}
          </WalletProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}


export default ContextProvider
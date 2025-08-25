'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useState, type ReactNode, createContext, useContext, } from 'react'

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

const queryClient = new QueryClient()


const metadata = {
  name: "PayThree",
  description: "Employee Payout Management",
  url: "https://payout-hr.vercel.app",
  icons: ["https://avatars.githubusercontent.com/u/179229932"]
}

function ContextProvider({ children, cookies }: { children: React.ReactNode; cookies: string | null }) {
  return (
      <QueryClientProvider client={queryClient}>
          <WalletProvider> {/* Wrap here */}
            {children}
          </WalletProvider>
      </QueryClientProvider>
  );
}


export default ContextProvider
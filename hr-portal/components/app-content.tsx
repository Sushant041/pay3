'use client';

import { Sidebar } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Lock, Wallet, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNProgress } from '@/hooks/use-nprogress';
import { BalanceDisplay } from '@/components/ui/balance-display';
import { useWalletContext } from '@/context';

interface AppContentProps {
  children: React.ReactNode;
}

export function AppContent({ children }: AppContentProps) {
  const { isConnected, setIsConnected, disconnect, Address, setAddress } = useWalletContext();
  const [error, setError] = useState<string | null>(null);
  useNProgress();

  // Keplr connect function
  const connectWallet = async () => {
    setError(null);
    try {
      if (!window.keplr) {
        setError('Keplr Wallet is not installed.');
        return;
      }

      const chainId = 'galileo-4'; // change to "andromeda-1" for mainnet

      await window.keplr.experimentalSuggestChain({
        chainId,
        chainName: 'Andromeda Testnet (galileo-4)',
        rpc: 'https://api.andromedaprotocol.io/rpc/testnet',
        rest: 'https://api.andromedaprotocol.io/rest/testnet',
        bip44: { coinType: 118 },
        bech32Config: {
          bech32PrefixAccAddr: 'andr',
          bech32PrefixAccPub: 'andrpub',
          bech32PrefixValAddr: 'andrvaloper',
          bech32PrefixValPub: 'andrvaloperpub',
          bech32PrefixConsAddr: 'andrvalcons',
          bech32PrefixConsPub: 'andrvalconspub',
        },
        currencies: [{ coinDenom: 'ANDR', coinMinimalDenom: 'uandr', coinDecimals: 6 }],
        feeCurrencies: [{ coinDenom: 'ANDR', coinMinimalDenom: 'uandr', coinDecimals: 6 }],
        stakeCurrency: { coinDenom: 'ANDR', coinMinimalDenom: 'uandr', coinDecimals: 6 },
      });

      // Enable wallet for this chain
      await window.keplr.enable(chainId);

      // Get signer + accounts
      const offlineSigner = window.keplr.getOfflineSigner(chainId);
      const accounts = await offlineSigner.getAccounts();

      if (accounts.length > 0) {
        setAddress(accounts[0].address);
        setIsConnected(true);
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletAddress', accounts[0].address);
      } else {
        setError('No account found.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect Keplr wallet.');
    }
  };

  const disconnectWallet = () => {
    disconnect();
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Authorize Access
            </CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              Connect your Andromeda wallet to access the HR Dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-md bg-muted/30 border border-border">
                <Lock className="h-5 w-5 text-primary" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Secure Connection</p>
                  <p className="text-muted-foreground">Your wallet connection is encrypted and secure</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-md bg-muted/30 border border-border">
                <Wallet className="h-5 w-5 text-primary" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Keplr Wallet Support</p>
                  <p className="text-muted-foreground">Connect using Keplr for Andromeda chain</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-full max-w-xs">
                <Button
                  onClick={connectWallet}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                >
                  <b>Connect Keplr Wallet</b>
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              By connecting your wallet, you agree to our terms of service and privacy policy
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-50 bg-card border-r border-border">
        <Sidebar />
      </div>
      <div className="md:pl-64 flex flex-col w-0 flex-1">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-border">
          <div className="flex-1"></div>
          <div className="flex items-center gap-3">
            {/* <BalanceDisplay /> */}
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" size="sm">
              {Address ? `${Address.slice(0, 6)}...${Address.slice(-4)}` : 'Account'}
            </Button>
            <Button
              onClick={disconnectWallet}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              size="sm"
            >
              Disconnect
            </Button>
          </div>

        </div>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Shield, AlertCircle } from 'lucide-react';

interface WalletConnectProps {
  onConnect: () => void;
}

export function WalletConnect({ onConnect }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

const connectWallet = async () => {
  setIsConnecting(true);
  setError(null);

  try {
    // Check if Keplr is installed
    if (!window.keplr) {
      setError('Keplr Wallet is not installed. Please install it to continue.');
      setIsConnecting(false);
      return;
    }

    // Enable Andromeda chain (testnet or mainnet)
    const chainId = "andromeda-testnet"; // or "andromeda-mainnet"
    await window.keplr.enable(chainId);

    // Get signer
    const offlineSigner = await window.keplr.getOfflineSignerAuto(chainId);
    const accounts = await offlineSigner.getAccounts();

    if (accounts && accounts.length > 0) {
      // Store wallet info in localStorage
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAddress', accounts[0].address);

      onConnect();
    } else {
      setError('No accounts found. Please connect your wallet.');
    }
  } catch (err: any) {
    setError(err.message || 'Failed to connect wallet. Please try again.');
  } finally {
    setIsConnecting(false);
  }
};

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Connect Your Wallet
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Connect your wallet to access the HR Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50 border border-border">
              <Shield className="h-5 w-5 text-primary" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Secure Connection</p>
                <p className="text-muted-foreground">Your wallet connection is encrypted and secure</p>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground text-center">
              By connecting your wallet, you agree to our terms of service and privacy policy
            </div>
          </div>

          <Button 
            onClick={connectWallet} 
            disabled={isConnecting}
            className="w-full"
            size="lg"
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 
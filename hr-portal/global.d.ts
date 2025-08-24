export {};

declare global {
  interface Window {
    keplr?: {
      enable: (chainId: string) => Promise<void>;
      experimentalSuggestChain: (config: any) => Promise<void>;
      getOfflineSignerAuto: (chainId: string) => Promise<any>;
    };
  }
}

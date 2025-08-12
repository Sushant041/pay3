import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
// import { Chain } from 'wagmi'

// Load env
export const projectId = "123456";

if (!projectId) {
  throw new Error('Project ID is not defined')
}


export const MorphHoleskyTestnet = {
  id: 2810,
  name: 'Morph Holesky Testnet',
  network: 'morph-holesky-testnet',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-quicknode-holesky.morphl2.io'],
    },
    public: {
      http: ['https://rpc-quicknode-holesky.morphl2.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Morph Holesky Testnet Explorer',
      url: 'https://explorer-holesky.morphl2.io',
    },
  },
}

export const network = MorphHoleskyTestnet
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  networks: [network],
  projectId,
})

// Export Wagmi config
export const config = wagmiAdapter.wagmiConfig
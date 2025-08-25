"use client";

import createClient, { ChainClient } from "@andromedaprotocol/andromeda.js/dist/clients";
import { GasPrice } from "@cosmjs/stargate";
import { toast } from "react-toastify";

/**
 * Hardcoded Andromeda Testnet (galileo-3) config
 */
const TESTNET_CONFIG = {
    chainId: "galileo-4",
    chainUrl: "https://api.andromedaprotocol.io/rpc/testnet",
    addressPrefix: "andr",
    defaultFee: "0.025uandr",
};


/**
 * Connects to Keplr & initializes an Andromeda ChainClient
 */
async function initAndromedaClient(): Promise<ChainClient> {
    if (!window.keplr) {
        throw new Error("Keplr not installed");
    }

    // Suggest chain if not already added to Keplr
    try {
        await window.keplr.enable(TESTNET_CONFIG.chainId);
    } catch {
        await window.keplr.experimentalSuggestChain({
            chainId: TESTNET_CONFIG.chainId,
            chainName: "Andromeda Testnet",
            rpc: TESTNET_CONFIG.chainUrl,
            rest: "https://api.andromedaprotocol.io/rest/testnet",
            bip44: { coinType: 118 },
            bech32Config: {
                bech32PrefixAccAddr: TESTNET_CONFIG.addressPrefix,
                bech32PrefixAccPub: TESTNET_CONFIG.addressPrefix + "pub",
                bech32PrefixValAddr: TESTNET_CONFIG.addressPrefix + "valoper",
                bech32PrefixValPub: TESTNET_CONFIG.addressPrefix + "valoperpub",
                bech32PrefixConsAddr: TESTNET_CONFIG.addressPrefix + "valcons",
                bech32PrefixConsPub: TESTNET_CONFIG.addressPrefix + "valconspub",
            },
            currencies: [
                { coinDenom: "ANDR", coinMinimalDenom: "uandr", coinDecimals: 6 },
            ],
            feeCurrencies: [
                { coinDenom: "ANDR", coinMinimalDenom: "uandr", coinDecimals: 6 },
            ],
            stakeCurrency: {
                coinDenom: "ANDR",
                coinMinimalDenom: "uandr",
                coinDecimals: 6,
            },
            gasPriceStep: { low: 0.01, average: 0.025, high: 0.03 },
        });
        await window.keplr.enable(TESTNET_CONFIG.chainId);
    }

    const signer = await window.keplr.getOfflineSignerAuto(TESTNET_CONFIG.chainId);
    const accounts = await signer.getAccounts();

    // Create Andromeda client
    const client = createClient(TESTNET_CONFIG.addressPrefix);
    await client.connect(TESTNET_CONFIG.chainUrl, signer as any, {
        gasPrice: GasPrice.fromString(TESTNET_CONFIG.defaultFee),
    });

    console.log("Connected accounts:", accounts);
    return client;
}


export async function claimAllTokens(contractAddress: string) {
    if(contractAddress === ''){
        toast.error("Provide a contract addres to claim vesting");
        return null;
    }
    try {
        // Create Andromeda client
        const client = await initAndromedaClient();

        const result = await client.execute(
            contractAddress,
            { claim_all: { up_to_time: null } },
            "auto" // auto-estimate gas
        );

        console.log("Claim successful:", result);
        return result;
    } catch (error) {
       console.log(error);
       return null;
    }
}
"use client";

import createClient, { ChainClient } from "@andromedaprotocol/andromeda.js/dist/clients";
import { GasPrice } from "@cosmjs/stargate";

/**
 * Hardcoded Andromeda Testnet (galileo-3) config
 */
const TESTNET_CONFIG = {
  chainId: "galileo-4",
  chainUrl: "https://api.andromedaprotocol.io/rpc/testnet",
  addressPrefix: "andr",
  defaultFee: "0.025uandr",
};

const ContractAddress = "andr1uarvqvslsg37nkpzkyrntszkad2z7xjleazvw4nalx8h5nqcjjyqrjeff6";

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
const Recipients = [
  {
    address: "andr192f03qa06ncawdtdytelcamgluygx4ayt22498",
    percent: "0.5",
  },
  {
    address: "andr1jhghqn3lw9hlm9ptvffhk504kz888hn79ymwnz",
    percent: "0.5",
  }
];

import { Msg } from "@andromedaprotocol/andromeda.js";

export const ExecuteSplitter = async (
  amount: string,
  recipients: { address: string; percent: string }[] = Recipients
) => {
  try {
    const client = await initAndromedaClient();

    const msg: Msg = {
      send: {
        config: recipients.map(r => ({
          recipient: {
            address: r.address,
            ibc_recovery_address: null,
            msg: null,
          },
          percent: r.percent,
        })),
      },
    };

    const funds = [{ denom: "uandr", amount }];

    const result = await client.execute(
      ContractAddress,
      msg,
      "auto",
      "",
      funds
    );

    console.log("Split executed:", result);
    return result;

  } catch (error) {
    console.error("Error executing splitter:", error);
    throw error; // Optionally rethrow to handle in UI
  }
};

export const CreateVesting = async () => {
  try {
    const client = await initAndromedaClient();
    const componentData = {
      kernel_address: "andr16meeuvwey03jvq26g2gvtpz42zak72hrtw3cpdqha8g64duav88qgs46r7",
      recipient: {
        msg: null,
        ibc_recovery_address: null,
        address: "andr19tm02vzdeg44rjh3q9kg5p6tthzvrr5aespc7w", //address for dynamic vesting cotract
      },
      denom: "uandr",
    };

    console.log(btoa(JSON.stringify(componentData)))

    const msg: Msg = {
      name: "new vesting",
      app_components: [
        {
          name: "vesting-0",
          ado_type: "vesting@3.1.1-b.2",
          component_type: {
            new: btoa(JSON.stringify(componentData)), // Encode to Base64
          },
        },
      ],
      chain_info: [],
      kernel_address: "andr16meeuvwey03jvq26g2gvtpz42zak72hrtw3cpdqha8g64duav88qgs46r7",
    };


    const res = await client.instantiate(
      2364,
      msg,
      'ANDR - Instantiate'
    )
    console.log(res);
  } catch (error) {
    console.log(error);
  }
}
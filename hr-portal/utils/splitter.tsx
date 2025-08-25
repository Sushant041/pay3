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

const SplitterContractAddress = "andr1uarvqvslsg37nkpzkyrntszkad2z7xjleazvw4nalx8h5nqcjjyqrjeff6";
const KernelAddress = "andr16meeuvwey03jvq26g2gvtpz42zak72hrtw3cpdqha8g64duav88qgs46r7";

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
import { Employee } from "@/types";
import { toast } from "react-toastify";


async function updateVesting(employeeId: string, vestingContractAddress: string) {
  try {
    const res = await fetch(`/api/employees/${employeeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vestingContractAddress }),
    });

    const data = await res.json();
    if (data.success) {
      console.log("Employee updated:", data.employee);
    } else {
      console.error("Update failed:", data.error);
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

export const ExecuteSplitter = async (
  amount: string,
  recipients: { address: string; percent: string }[]
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
      SplitterContractAddress,
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


function getAdoAddressByCodeId(
  txResponse: any,
  codeId: string
): string {
  for (const event of txResponse.events) {
    if (event.type === "instantiate") {
      const codeAttr = event.attributes.find(
        (attr: any) => attr.key === "code_id"
      );
      const addrAttr = event.attributes.find(
        (attr: any) => attr.key === "_contract_address"
      );
      if (codeAttr?.value === codeId && addrAttr) {
        return addrAttr.value;
      }
    }
  }
  return "";
}



export const ExecuteVesting = async (VestingContractAddress: string, amount: string, lockup_duration: number, release_duration: number, funds: string) => {
  try {
    const client = await initAndromedaClient();
    const msg: Msg = {
      create_batch: {
        release_amount: {
          amount: amount,
        },
        lockup_duration: lockup_duration,
        release_duration: release_duration,
      }
    };
    console.log("vesting.......", funds, VestingContractAddress, msg);

    const res = await client.execute(
      VestingContractAddress, // contract address
      msg,
      "auto",          // or specify gas amount
      "Create Vesting Batch", // optional memo
      [{ denom: "uandr", amount: funds }] // funds being sent
    );

    console.log(res);
    return res;
  } catch (error) {
    console.log(error, "Error creating vesting for contract address", VestingContractAddress);
    throw error;
  }
}

const CreateNewVesting = async (employee: Employee, Name: string) => {
  try {
    const client = await initAndromedaClient();
    const componentData = {
      kernel_address: KernelAddress,
      recipient: {
        msg: null,
        ibc_recovery_address: null,
        address: employee.walletAddress, //Employee address for dynamic vesting cotract
      },
      denom: "uandr",
    };

    const msg: Msg = {
      name: Name,
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
      kernel_address: KernelAddress,
    };
    const res = await client.instantiate(
      2364,
      msg,
      'ANDR - Instantiate'
    )
    console.log(res);
    const vestingContractAddress = getAdoAddressByCodeId(res, "2387");

    await updateVesting(employee._id, vestingContractAddress)
    return vestingContractAddress;
  } catch (error) {
    console.log(error);
    return "";
  }
}

export async function CreateVesting(Name: string, employee: Employee, amount: string, lockup_duration: number, release_duration: number, funds: string) {
  try {
    const adoAddress = employee.vestingContractAddress ? employee.vestingContractAddress : await CreateNewVesting(employee, Name);
    if (adoAddress === "") {
      toast.error("Failed to create vesting");
      throw new Error("Failed to create vesting")
    }
    const tx = await ExecuteVesting(adoAddress, amount, lockup_duration, release_duration, funds);
    console.log(tx);
    return tx;
  } catch (error) {
    console.log(error, "Error assigning esops for user", employee.walletAddress);
    throw error;
  }
}

import hre, { ethers } from "hardhat";
import { signMetaTxRequest } from "./signer.js";
import { assert } from "chai";
const { oldUserBracket, mockIpfsUri } = require("../test/helpers/constants");

const {
  DefenderRelaySigner,
  DefenderRelayProvider,
} = require("defender-relay-client/lib/ethers");

type DefenderResponse = {
  result: string;
};

async function signEnterPool(
  poolId: number,
  tokenId: number,
  isEditableBracket: boolean
) {
  const credentials = {
    apiKey: process.env.RELAYER_API_KEY,
    apiSecret: process.env.RELAYER_API_SECRET,
  };
  const provider = new DefenderRelayProvider(credentials);
  const signer = new DefenderRelaySigner(credentials, provider, {
    speed: "fast",
  });
  const forwarder = await hre.ethers.getContractAt(
    "MinimalForwarder",
    forwarderAddress,
    signer
  );

  const AUTO_TASKER_WEBHOOK_URL = process.env.AUTO_TASKER_WEBHOOK_URL!;

  assert(
    AUTO_TASKER_WEBHOOK_URL !== undefined,
    "AUTO_TASKER_WEBHOOK_URL is not set"
  );

  assert(
    process.env.DIAMOND_CONTRACT !== undefined,
    "DIAMOND_CONTRACT is not set"
  );
  const diamondAddress = process.env.DIAMOND_CONTRACT!;

  const nfbDiamond = await hre.ethers.getContractAt("IDiamond", diamondAddress);

  const wallet = new ethers.Wallet(process.env.EXAMPLE_USER_PRIVATE_KEY!);

  const from = await wallet.getAddress();

  console.log(`Signing enterPool with meta-tx as ${from}...`);
  const dataEnterPool = nfbDiamond.interface.encodeFunctionData("enterPool", [
    poolId,
    tokenId,
    oldUserBracket,
    mockIpfsUri,
    isEditableBracket,
    ethers.constants.AddressZero,
  ]);

  const resultEnterPool = await signMetaTxRequest(
    process.env.EXAMPLE_USER_PRIVATE_KEY!,
    forwarder,
    {
      to: nfbDiamond.address,
      from: from,
      data: dataEnterPool,
    }
  );

  try {
    const response = await fetch(AUTO_TASKER_WEBHOOK_URL, {
      method: "POST",
      body: JSON.stringify(resultEnterPool),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error! status: ${response.status}`);
    }

    const result = (await response.json()) as DefenderResponse;

    console.log("result is: ", JSON.stringify(result, null, 4));

    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.log("error message: ", error.message);
      return error.message;
    } else {
      console.log("unexpected error: ", error);
      return "An unexpected error occurred";
    }
  }
}

module.exports = signEnterPool;

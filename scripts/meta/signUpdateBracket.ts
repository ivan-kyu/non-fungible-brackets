import hre, { ethers } from "hardhat";
import { signMetaTxRequest } from "./signer.js";
import { assert } from "chai";

type DefenderResponse = {
  result: string;
};

const {
  tournamentsTestConstants,
  mockIpfsUri,
} = require("../test/helpers/constants");
const {
  DefenderRelaySigner,
  DefenderRelayProvider,
} = require("defender-relay-client/lib/ethers");

async function signUpdateBracket(
  poolId: number,
  tokenId: number
) {
  const credentials = {
    apiKey: process.env.RELAYER_API_KEY,
    apiSecret: process.env.RELAYER_API_SECRET,
  };
  const provider = new DefenderRelayProvider(credentials);
  const signer = new DefenderRelaySigner(credentials, provider, {
    speed: "fast",
  });

  const FORWARDER_CONTRACT = process.env.FORWARDER_CONTRACT!;

  const AUTO_TASKER_WEBHOOK_URL = process.env.AUTO_TASKER_WEBHOOK_URL!;

  assert(
    AUTO_TASKER_WEBHOOK_URL !== undefined,
    "AUTO_TASKER_WEBHOOK_URL is not set"
  );

  assert(FORWARDER_CONTRACT !== undefined, "FORWARDER_CONTRACT is not set");

  const forwarder = await hre.ethers.getContractAt(
    "MinimalForwarder",
    FORWARDER_CONTRACT,
    signer
  );

  assert(
    process.env.DIAMOND_CONTRACT !== undefined,
    "DIAMOND_CONTRACT is not set"
  );
  const diamondAddress = process.env.DIAMOND_CONTRACT!;

  const nfbDiamond = await hre.ethers.getContractAt(
    "IDiamond",
    diamondAddress,
    signer
  );

  const wallet = new ethers.Wallet(process.env.EXAMPLE_USER_PRIVATE_KEY!);

  const from = await wallet.getAddress();

  const updateBracketArgs = {
    _poolId: poolId,
    tokenId: tokenId,
    tokenUri: mockIpfsUri,
    oldBracket: tournamentsTestConstants.args.updateBracketArgs.oldBracket,
    newBracket: tournamentsTestConstants.args.updateBracketArgs.newBracket,
  };

  console.log(`Signing updateBracket with meta-tx as ${from}...`);
  const dataUpdateBracket = nfbDiamond.interface.encodeFunctionData(
    "updateBracket",
    [updateBracketArgs]
  );

  const resultUpdateBracket = await signMetaTxRequest(
    process.env.EXAMPLE_USER_PRIVATE_KEY!,
    forwarder,
    {
      to: nfbDiamond.address,
      from: from,
      data: dataUpdateBracket,
    }
  );

  try {
    const response = await fetch(AUTO_TASKER_WEBHOOK_URL, {
      method: "POST",
      body: JSON.stringify(resultUpdateBracket),
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

module.exports = signUpdateBracket;

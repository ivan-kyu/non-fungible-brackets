import hre from "hardhat";
import fs from "fs";
import { Contract } from "ethers";

import { Diamond } from "../utils/diamond";

import {
  DiamondCutFacet,
  DiamondLoupeFacet,
  OwnershipFacet,
  AccessControlFacet,
  NFBOracleFacet,
  NFBRewardPoolFacet,
  NFBTournamentsFacet,
  NFBCoreFacet,
  NFBBracket,
  MinimalForwarder,
} from "../typechain";

export async function verifyDiamond(): Promise<void> {
  const diamondAddress = "0xC636e8E174b1929daB943F7Ed6B6E738e1219fF7";
  const ownerAddress = "0xF6A9A79DC478aA32A897D50e73AB0e173F95eBFe";

  let bracket,
    forwarder,
    cut,
    loupe,
    ownership,
    accessControl,
    oracle,
    tournaments,
    rewardPool,
    core: Contract;
  const nfbBracketAddress = "0x565c3931493EEAC0E30170cC238D9Db79E0496Ae";
  const forwarderAddress = "0xDdCC6C91742c1c0700f84Dcf376891a3263C11b0";

  const cutAddress = "0x524a219ED052657fA9FDC01b95eeeafc61df12D2";
  const loupeAddress = "0x96e31338BB8C92cC6dAD7f7749D3956E49769651";
  const ownershipAddress = "0xbDdED6B7F74F9FC8f985ad995F0C6555781A4C6C";
  const accessControlAddress = "0x947429c3328627F307C9674ad051A206f21E4515";
  const oracleAddress = "0xD1465bE8d75c07839135A539CFb83C7Ee550c619";
  const rewardPoolAddress = "0xA5a60444fBBFCd106137E2741C53D6FA6b5397dd";
  const tournamentAddress = "0xe18a878237757e162a9B50d2a6E41Ebfb2eB5C80";
  const coreAddress = "0x75a21F95f6c5ece5a0Ea045f4a1F698a83e64Ca3";

  bracket = (await hre.ethers.getContractAt(
    "NFBBracket",
    nfbBracketAddress
  )) as NFBBracket;

  forwarder = (await hre.ethers.getContractAt(
    "MinimalForwarder",
    forwarderAddress
  )) as MinimalForwarder;

  cut = (await hre.ethers.getContractAt(
    "DiamondCutFacet",
    cutAddress
  )) as DiamondCutFacet;

  loupe = (await hre.ethers.getContractAt(
    "DiamondLoupeFacet",
    loupeAddress
  )) as DiamondLoupeFacet;

  ownership = (await hre.ethers.getContractAt(
    "OwnershipFacet",
    ownershipAddress
  )) as OwnershipFacet;

  accessControl = (await hre.ethers.getContractAt(
    "AccessControlFacet",
    accessControlAddress
  )) as AccessControlFacet;

  oracle = (await hre.ethers.getContractAt(
    "NFBOracleFacet",
    oracleAddress
  )) as NFBOracleFacet;

  rewardPool = (await hre.ethers.getContractAt(
    "NFBRewardPoolFacet",
    rewardPoolAddress
  )) as NFBRewardPoolFacet;

  tournaments = (await hre.ethers.getContractAt(
    "NFBTournamentsFacet",
    tournamentAddress
  )) as NFBTournamentsFacet;

  core = (await hre.ethers.getContractAt(
    "NFBCoreFacet",
    coreAddress
  )) as NFBCoreFacet;

  const facets = [
    cut,
    loupe,
    ownership,
    accessControl,
    oracle,
    rewardPool,
    core,
    tournaments,
  ];

  const diamondCut = Diamond.getAsAddCuts(facets);

  try {
    const tx = await hre.run("verify:verify", {
      address: diamondAddress,
      constructorArguments: [diamondCut, ownerAddress, forwarderAddress],
    });

    tx.wait();
  } catch (error: any) {
    // logError("NFBDiamond", error.message);
    console.log("error", error);
  }
}

function logError(contractName: string, msg: string) {
  console.log(
    `\x1b[31mError while trying to verify contract: ${contractName}!`
  );
  console.log(`Error message: ${msg}`);
  resetConsoleColor();
}

function resetConsoleColor() {
  console.log("\x1b[0m");
}

verifyDiamond().catch((err) => console.error(err));

import hre, { ethers } from "hardhat";
import { ContractFactory } from "ethers";
import { IDiamond, NFBBracket } from "../typechain";
import { Deployer } from "../utils/deployer";
import fs from "fs";
import { assert } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Diamond } from "../utils/diamond";

export async function deployContracts() {
  await hre.run("compile");

  let deployer: SignerWithAddress;

  [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log(
    `Account balance: ${(await deployer.getBalance()).toString()} \n`
  );

  const rawUpdatePrice = process.env.NFT_UPDATE_PRICE!;

  const NFT_UPDATE_PRICE = ethers.utils.parseEther(rawUpdatePrice);
  const DAO_WALLET = process.env.DAO_WALLET;
  const BASE_URI = process.env.BASE_URI;
  const DELEGATE_CASH_CONTRACT = process.env.DELEGATE_CASH_CONTRACT;

  console.log("rawUpdatePrice", rawUpdatePrice);
  console.log("NFT_UPDATE_PRICE", NFT_UPDATE_PRICE);
  console.log("DAO_WALLET", DAO_WALLET);
  console.log("BASE_URI", BASE_URI);

  assert(NFT_UPDATE_PRICE !== undefined, "NFT_UPDATE_PRICE is not set");
  assert(DAO_WALLET !== undefined, "DAO_WALLET is not set");
  assert(BASE_URI !== undefined, "BASE_URI is not set");
  assert(
    DELEGATE_CASH_CONTRACT !== undefined,
    "DELEGATE_CASH_CONTRACT is not set"
  );

  // The existing version of the forwarder can be used, so no need to redeploy it
  // console.log("Deploying DGENMock...");
  // const dgenMock = await Deployer.deployContract("DGENMock", deployer, [50000]);
  // console.log(`DGENMock deployed to: ${dgenMock.address}`);
  // const dgenMockAddress = dgenMock.address;
  const dgenMockAddress = "0x31494A666De7B8E6301aEcceCd6C61F68F538f13";

  // The existing version of the forwarder can be used, so no need to redeploy it
  // console.log("Deploying MinimalForwarder...");
  // const minimalForwarder = await Deployer.deployContract("MinimalForwarder");
  // console.log(`MinimalForwarder deployed to: ${minimalForwarder.address}`);
  // const minimalForwarderAddress = minimalForwarder.address;
  const minimalForwarderAddress = "0xFAEED365aE97fFd17B69cddA1fde977D5B8717e1";

  // Add Facets to diamond

  console.log("Deploying DiamondCutFacet...");
  const cut = await Deployer.deployContract("DiamondCutFacet");
  console.log(`DiamondCutFacet deployed to: ${cut.address}`);

  console.log("Deploying DiamondLoupeFacet...");
  const loupe = await Deployer.deployContract("DiamondLoupeFacet");
  console.log(`DiamondLoupeFacet deployed to: ${loupe.address}`);

  console.log("Deploying OwnershipFacet...");
  const ownership = await Deployer.deployContract("OwnershipFacet");
  console.log(`OwnershipFacet deployed to: ${ownership.address}`);

  console.log("Deploying AccessControlFacet...");
  const accessControl = await Deployer.deployContract("AccessControlFacet");
  console.log(`AccessControlFacet deployed to: ${accessControl.address}`);

  console.log("Deploying NFBOracleFacet...");
  const oracle = await Deployer.deployContract("NFBOracleFacet");
  console.log(`NFBOracleFacet deployed to: ${oracle.address}`);

  console.log("Deploying NFBRewardPoolFacet...");
  const rewardPool = await Deployer.deployContract("NFBRewardPoolFacet");
  console.log(`NFBRewardPoolFacet deployed to: ${rewardPool.address}`);

  console.log("Deploying NFBTournamentsFacet...");
  const tournamentsFacet = await Deployer.deployContract("NFBTournamentsFacet");
  console.log(`NFBTournamentsFacet deployed to: ${tournamentsFacet.address}`);

  console.log("Deploying NFBBracket...");
  const NFBBracketFactory: ContractFactory = await ethers.getContractFactory(
    "NFBBracket"
  );
  const nfbBracket = (await NFBBracketFactory.deploy()) as NFBBracket;
  console.log(`NFBBracket deployed to: ${nfbBracket.address}`);

  console.log(`Setting BaseURI in NFBBracket please wait...\n`);
  const txSetMetadataBaseURI = await nfbBracket.setMetadataBase(BASE_URI!);
  await txSetMetadataBaseURI.wait();
  console.log(`MetadataBaseURI successfully set in NFBBracket!\n`);

  console.log(`Deploying NFBBracket at address: ${nfbBracket.address}`);

  console.log("Deploying NFBCoreFacet...");
  const core = await Deployer.deployContract("NFBCoreFacet");
  console.log(`NFBCoreFacet deployed to: ${core.address}`);

  console.log("Deploying NFB (Diamond)...");

  const facets = [
    cut,
    loupe,
    ownership,
    accessControl,
    oracle,
    rewardPool,
    core,
    tournamentsFacet,
  ];

  const diamond = await Deployer.deployDiamond(
    "Diamond",
    facets,
    deployer.address,
    minimalForwarderAddress
  );

  console.log(`NFB (Diamond) deployed to: ${diamond.address}`);

  const blockNumber = await ethers.provider.getBlockNumber();
  console.log("Block number: ", blockNumber);

  const nfbDiamond = (await ethers.getContractAt(
    "IDiamond",
    diamond.address
  )) as IDiamond;
  let tx;

  console.log("Initializing Oracle...");

  // Initialize contracts
  tx = await nfbDiamond.initializeOracle();
  tx.wait(); // TODO: add 10 blocks of waiting time to all deployment transactions when everything's done

  console.log("Initializing Тournaments...");

  tx = await nfbDiamond.initializeTournaments({
    nfbBracketAddress: nfbBracket.address,
    delegationRegistryAddress: DELEGATE_CASH_CONTRACT!,
  });
  tx.wait();

  console.log("Initializing Core...");

  tx = await nfbDiamond.initializeCore({
    nfbBracketAddress: nfbBracket.address,
    daoWalletAddress: DAO_WALLET!,
    dgenTokenAddress: dgenMockAddress,
    nftUpdatePrice: NFT_UPDATE_PRICE!,
  });
  tx.wait();

  console.log("Setting Handler Role for Bracket...");

  tx = await nfbBracket.setupHandlerAddress(diamond.address);
  tx.wait();

  console.log("Saving contract addresses...");

  const contracts = {
    network: hre.network.name,
    MinimalForwarder: minimalForwarderAddress,
    IDiamond: nfbDiamond.address,
    NFBBracket: nfbBracket.address,
    facets: {
      cut: cut.address,
      loupe: loupe.address,
      ownership: ownership.address,
      accessControl: accessControl.address,
      oracle: oracle.address,
      rewardPool: rewardPool.address,
      core: core.address,
      tournaments: tournamentsFacet.address,
    },
    daoWallet: DAO_WALLET,
    DGENMock: dgenMockAddress,
    nftUpdatePrice: NFT_UPDATE_PRICE,
    baseUri: BASE_URI,
    blockNumber: blockNumber,
  };

  const contractsString = JSON.stringify(contracts, null, 2);

  fs.writeFileSync("./contracts.json", contractsString);
  console.log("Contracts JSON file saved to ./contracts.json !");

  console.log("Verifying NFBBracket ...");
  try {
    await hre.run("verify:verify", {
      address: nfbBracket.address,
      constructorArguments: [],
    });
  } catch (error: any) {
    console.log("NFBBracket verification error: ", error);
  }

  console.log("Verifying Facets ...");
  const facetsKeys = Object.keys(contracts.facets);
  for (let i = 0; i < facetsKeys.length; i++) {
    try {
      await hre.run("verify:verify", {
        address: JSON.parse(JSON.stringify(contracts.facets))[facetsKeys[i]],
        constructorArguments: [],
      });
    } catch (error: any) {
      console.log(facetsKeys[i], error.message);
    }
  }

  console.log("Verifying NFB (Diamond) ...");
  try {
    await hre.run("verify:verify", {
      address: diamond.address,
      constructorArguments: [
        Diamond.getAsAddCuts(facets),
        deployer.address,
        minimalForwarderAddress,
      ],
    });
  } catch (error: any) {
    console.log("NFBDiamond verification error: ", error);
  }

  console.log("Contracts verified!");
}

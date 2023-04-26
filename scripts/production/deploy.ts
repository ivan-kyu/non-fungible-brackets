import hre, { ethers } from "hardhat";
import { ContractFactory } from "ethers";
import { IDiamond, NFBBracket } from "../../typechain";
import { Deployer } from "../../utils/deployer";
import fs from "fs";
import { ROUND_INDEXES } from "../config/index";
import { assert } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export async function deployContracts() {
  await hre.run("compile");

  let deployer: SignerWithAddress;

  [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log(
    `Account balance: ${(await deployer.getBalance()).toString()} \n`
  );

  const rawUpdatePrice = process.env.NFT_UPDATE_PRICE!;

  const TOURNAMENT_STAGE = process.env.TOURNAMENT_STAGE;
  const NFT_UPDATE_PRICE = ethers.utils.parseEther(rawUpdatePrice);
  const DAO_WALLET = process.env.DAO_WALLET;
  const DGEN_TOKEN_ADDRESS = process.env.DGEN_TOKEN_ADDRESS;
  const BASE_URI = process.env.BASE_URI;
  const DELEGATE_CASH_CONTRACT = process.env.DELEGATE_CASH_CONTRACT;

  console.log("TOURNAMENT_STAGE", TOURNAMENT_STAGE);
  console.log("NFT_UPDATE_PRICE", NFT_UPDATE_PRICE);
  console.log("DAO_WALLET", DAO_WALLET);
  console.log("BASE_URI", BASE_URI);

  assert(TOURNAMENT_STAGE !== undefined, "TOURNAMENT_STAGE is not set");
  assert(NFT_UPDATE_PRICE !== undefined, "NFT_UPDATE_PRICE is not set");
  assert(ROUND_INDEXES?.length !== 0, "ROUND_INDEXES has length of zero");
  assert(DAO_WALLET !== undefined, "DAO_WALLET is not set");
  assert(BASE_URI !== undefined, "BASE_URI is not set");
  assert(
    DELEGATE_CASH_CONTRACT !== undefined,
    "DELEGATE_CASH_CONTRACT is not set"
  );
  assert(DGEN_TOKEN_ADDRESS !== undefined, "DGEN_TOKEN_ADDRESS is not set");

  console.log("Deploying MinimalForwarder...");
  const minimalForwarder = await Deployer.deployContract("MinimalForwarder");
  console.log(`MinimalForwarder deployed to: ${minimalForwarder.address}`);

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

  const diamond = await Deployer.deployDiamond(
    "Diamond",
    [
      cut,
      loupe,
      ownership,
      accessControl,
      oracle,
      rewardPool,
      core,
      tournamentsFacet,
    ],
    deployer.address,
    minimalForwarder.address
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
    dgenTokenAddress: DGEN_TOKEN_ADDRESS!,
    nftUpdatePrice: NFT_UPDATE_PRICE!,
  });
  tx.wait();

  console.log("Setting Handler Role for Bracket...");

  tx = await nfbBracket.setupHandlerAddress(diamond.address);
  tx.wait();

  console.log("Saving contract addresses...");

  const contractsJson = JSON.stringify(
    {
      network: hre.network.name,
      MinimalForwarder: minimalForwarder.address,
      IDiamond: nfbDiamond.address,
      NFBBracket: nfbBracket.address,
      facets: {
        cut: cut.address,
        loupe: loupe.address,
        ownership: ownership.address,
        accessControl: accessControl.address,
        oracle: oracle.address,
        rewardPool: rewardPool.address,
        tournament: tournamentsFacet.address,
        core: core.address,
      },
      daoWallet: DAO_WALLET,
      DGEN: DGEN_TOKEN_ADDRESS,
      nftUpdatePrice: NFT_UPDATE_PRICE,
      tournamentStage: TOURNAMENT_STAGE,
      roundIndexes: ROUND_INDEXES,
      baseUri: BASE_URI,
      blockNumber: blockNumber,
    },
    null,
    2
  );

  fs.writeFileSync("./contracts.json", contractsJson);

  console.log("Contracts JSON file saved to ./contracts.json !");
}

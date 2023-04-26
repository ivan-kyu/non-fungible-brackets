import hre, { ethers } from "hardhat";
import { NFBBracket, ERC20Mock, DelegationRegistryMock } from "../../typechain";
import { Deployer } from "../../utils/deployer";
import { ContractFactory, Signer } from "ethers";
import { nftUpdatePrice, tournamentsTestConstants } from "./constants";
import Users from "./users";
const mockBase: string = "https://mockuri.test/";

export async function init(users: Users): Promise<any[]> {
  const deployer: Signer = users.deployer.signer;
  const user1: Signer = users.user1.signer;
  const daoWalletAddress: string = users.user2.address;
  const roundUpdaterAddress: string = users.user3.address;

  const ERC20Factory: ContractFactory = await hre.ethers.getContractFactory(
    "ERC20Mock"
  );
  const mintQty = 200000000;
  const erc20Mock: ERC20Mock = (await ERC20Factory.connect(user1).deploy(
    mintQty
  )) as ERC20Mock;
  await erc20Mock.deployed();
  const erc20MockAddress: string = erc20Mock.address;

  console.log("Deploying MinimalForwarder...");
  const minimalForwarder = await Deployer.deployContract("MinimalForwarder");
  console.log(`MinimalForwarder deployed to: ${minimalForwarder.address}`);

  // Add Facets to diamond
  console.log("Deploying DiamondCutFacet...");
  const cutFacet = await Deployer.deployContract("DiamondCutFacet");
  console.log(`DiamondCutFacet deployed to: ${cutFacet.address}`);

  console.log("Deploying DiamondLoupeFacet...");
  const loupeFacet = await Deployer.deployContract("DiamondLoupeFacet");
  console.log(`DiamondLoupeFacet deployed to: ${loupeFacet.address}`);

  console.log("Deploying OwnershipFacet...");
  const ownershipFacet = await Deployer.deployContract("OwnershipFacet");
  console.log(`OwnershipFacet deployed to: ${ownershipFacet.address}`);

  console.log("Deploying AccessControlFacet...");
  const accessControlFacet = await Deployer.deployContract(
    "AccessControlFacet"
  );
  console.log(`AccessControlFacet deployed to: ${accessControlFacet.address}`);

  console.log("Deploying NFBOracleFacet...");
  const oracleFacet = await Deployer.deployContract("NFBOracleFacet");
  console.log(`NFBOracleFacet deployed to: ${oracleFacet.address}`);

  console.log("Deploying NFBRewardPoolFacet...");
  const rewardPoolFacet = await Deployer.deployContract("NFBRewardPoolFacet");
  console.log(`NFBRewardPoolFacet deployed to: ${rewardPoolFacet.address}`);

  console.log("Deploying NFBTournamentsFacet...");
  const tournamentsFacet = await Deployer.deployContract("NFBTournamentsFacet");
  console.log(`NFBTournamentsFacet deployed to: ${tournamentsFacet.address}`);

  console.log("Deploying NFBBracket...");
  const NFBBracketFactory: ContractFactory = await ethers.getContractFactory(
    "NFBBracket"
  );
  const nfbBracket = (await NFBBracketFactory.deploy()) as NFBBracket;
  console.log(`NFBBracket deployed to: ${nfbBracket.address}`);

  console.log("Deploying DelegationRegistryMock...");
  const DelegationRegistryMock: ContractFactory =
    await ethers.getContractFactory("DelegationRegistryMock");
  const delegationRegistryMock =
    (await DelegationRegistryMock.deploy()) as DelegationRegistryMock;
  console.log(
    `DelegationRegistryMock deployed to: ${delegationRegistryMock.address}`
  );

  console.log(`Setting BaseURI in NFBBracket please wait...\n`);
  const txSetMetadataBaseURI = await nfbBracket.setMetadataBase(mockBase);
  await txSetMetadataBaseURI.wait();
  console.log(`MetadataBaseURI successfully set in NFBBracket!\n`);

  console.log(`Deploying NFBBracket at address: ${nfbBracket.address}`);

  console.log("Deploying NFBCoreFacet...");
  const coreFacet = await Deployer.deployContract("NFBCoreFacet");
  console.log(`NFBCoreFacet deployed to: ${coreFacet.address}`);

  console.log("Deploying NFB (Diamond)...");

  const diamond = await Deployer.deployDiamond(
    "Diamond",
    [
      cutFacet,
      loupeFacet,
      ownershipFacet,
      accessControlFacet,
      oracleFacet,
      rewardPoolFacet,
      tournamentsFacet,
      coreFacet,
    ],
    await deployer.getAddress(),
    minimalForwarder.address
  );

  console.log(`Diamond deployed to: ${diamond.address}`);

  const nfbDiamond = await ethers.getContractAt("IDiamond", diamond.address);
  let tx;

  // Initialize contracts
  tx = await nfbDiamond.initializeOracle();
  tx.wait(); // TODO: add 10 blocks of waiting time to all deployment transactions when everything's done

  tx = await nfbDiamond.initializeTournaments({
    nfbBracketAddress: nfbBracket.address,
    delegationRegistryAddress: delegationRegistryMock.address,
  });
  tx.wait();

  tx = await nfbDiamond.initializeCore({
    nfbBracketAddress: nfbBracket.address,
    daoWalletAddress: daoWalletAddress,
    dgenTokenAddress: erc20Mock.address,
    nftUpdatePrice: nftUpdatePrice,
  });
  tx.wait();

  const txSetRoundUpdater = await nfbDiamond.grantUpdaterRole(
    roundUpdaterAddress
  );
  await txSetRoundUpdater.wait();
  console.log(
    `Updater permissions to ${roundUpdaterAddress} have been given.\n`
  );

  nfbBracket.setupHandlerAddress(diamond.address);
  console.log(
    `Handler role permissions has been given to the Diamond address ${nfbDiamond.address}.\n`
  );

  return [
    nfbDiamond,
    nfbBracket,
    erc20Mock,
    tournamentsFacet,
    minimalForwarder,
  ];
}

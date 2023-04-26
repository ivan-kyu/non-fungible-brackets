import { ethers } from "hardhat";
import { IDiamond } from "../typechain";
import * as dotenv from "dotenv";
import {
  tournamentsTestConstants,
  roundIndexes,
} from "../test/helpers/constants";
import { assert } from "chai";
import {
  TOP100_TIERED_REWARD_PERCENTAGES,
  TOP100_TIERED_REWARD_RANGES,
  TOP10_TIERED_REWARD_PERCENTAGES,
  TOP10_TIERED_REWARD_RANGES,
  TOP1_TIERED_REWARD_PERCENTAGES,
  TOP1_TIERED_REWARD_RANGES,
  TOP5_TIERED_REWARD_PERCENTAGES,
  TOP5_TIERED_REWARD_RANGES,
} from "./config";
dotenv.config();

async function initialize(
  tournamentId: number,
  roundsCount: number,
  bracketLen: number,
  bracketMaximumPoints: number,
  stage: number,
  sportSeason: number
) {
  const provider = new ethers.providers.AlchemyProvider(
    "maticmum",
    process.env.ALCHEMY_KEY
  );

  const wallet = new ethers.Wallet(process.env.OWNER!, provider);

  assert(
    process.env.DIAMOND_CONTRACT !== undefined,
    "DIAMOND_CONTRACT is not set"
  );
  const diamondAddress = process.env.DIAMOND_CONTRACT!;

  const blockNumber = await ethers.provider.getBlockNumber();
  const block = await ethers.provider.getBlock(blockNumber);

  const ONE_MIN = 60;

  const ONE_HOUR = ONE_MIN * 60;

  const roundStart = block.timestamp + ONE_HOUR;
  const roundEnd = roundStart + 2 * ONE_HOUR;

  const nfbDiamond = (await ethers.getContractAt(
    "IDiamond",
    diamondAddress,
    wallet
  )) as IDiamond;

  console.log("Initializing a tournament ...");

  console.log("Setting rounds...");

  const setRoundsTx = await nfbDiamond.setRounds(
    tournamentId,
    roundsCount,
    tournamentsTestConstants.args.winnersPerRound,
    { gasLimit: 300000 }
  );

  await setRoundsTx.wait();

  console.log("Setting round bounds of 1st round...");

  const setRoundsBoundsTx = await nfbDiamond.setRoundBounds(
    tournamentId,
    1,
    roundStart,
    roundEnd,
    { gasLimit: 300000 }
  );

  await setRoundsBoundsTx.wait();

  console.log("Setting bracket length...");

  const setBracketLenTx = await nfbDiamond.setBracketLength(
    tournamentId,
    bracketLen,
    { gasLimit: 300000 }
  );

  await setBracketLenTx.wait();

  console.log("Setting bracket maximum points...");

  const setMaximumPointsTx = await nfbDiamond.setMaximumPoints(
    tournamentId,
    bracketMaximumPoints,
    { gasLimit: 300000 }
  );

  await setMaximumPointsTx.wait();

  console.log("Setting TOP 5 reward distribution...");

  const addRewardDistributionTop5Tx = await nfbDiamond.addRewardDistribution(
    "Top 5",
    TOP5_TIERED_REWARD_PERCENTAGES,
    TOP5_TIERED_REWARD_RANGES,
    false,
    { gasLimit: 500000 }
  );

  await addRewardDistributionTop5Tx.wait();

  console.log("Setting TOP 10 reward distribution...");

  const addRewardDistributionTop10Tx = await nfbDiamond.addRewardDistribution(
    "Top 10",
    TOP10_TIERED_REWARD_PERCENTAGES,
    TOP10_TIERED_REWARD_RANGES,
    false,
    { gasLimit: 1000000 }
  );

  await addRewardDistributionTop10Tx.wait();

  console.log("Setting TOP 100 reward distribution...");

  const addRewardDistributionTop100Tx = await nfbDiamond.addRewardDistribution(
    "Top 100",
    TOP100_TIERED_REWARD_PERCENTAGES,
    TOP100_TIERED_REWARD_RANGES,
    false,
    { gasLimit: 2000000 }
  );

  await addRewardDistributionTop100Tx.wait();

  console.log("Setting TOP 1 (All or Nothing) reward distribution...");

  const addRewardDistributionTop1Tx = await nfbDiamond.addRewardDistribution(
    "All or Nothing",
    TOP1_TIERED_REWARD_PERCENTAGES,
    TOP1_TIERED_REWARD_RANGES,
    true, // THIS IS THE FLAG FOR ALL OR NOTHING, IT'S USED FOR REPRESENTING THE TOP 1 IN THE FRONTEND ONLY IF THE USER CHOSE ALL OR NOTHING
    { gasLimit: 1000000 }
  );

  await addRewardDistributionTop1Tx.wait();

  console.log("Setting round indices...");

  const setRoundIndexesTx = await nfbDiamond.setRoundIndexes(
    tournamentId,
    roundIndexes,
    {
      gasLimit: 300000,
    }
  );

  await setRoundIndexesTx.wait();

  console.log("Setting tournament stage...");

  const setTournamentStageTx = await nfbDiamond.setTournamentStage(
    tournamentId,
    stage,
    { gasLimit: 300000 }
  );

  await setTournamentStageTx.wait();

  console.log("Setting sport season...");

  const setSportsSeasonTx = await nfbDiamond.setSportSeason(
    tournamentId,
    sportSeason,
    { gasLimit: 300000 }
  );

  await setSportsSeasonTx.wait();

  console.log(`Tournament Initialized!\n`);
}

module.exports = initialize;

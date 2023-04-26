import { ethers, network } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import { IDiamond, MinimalForwarder, ERC20, ERC20Mock } from "../../typechain";
import {
  tournamentStage,
  bracketLength,
  ONE_HOUR,
  roundWinners,
  roundIndexes,
  tournamentsTestConstants,
  zeroAddress,
  bracketStruct,
  mockIpfsUri,
  PrizeModelType,
  PrizeDistributionType,
  RoyaltyType,
} from "./constants";
import { Signer, BigNumber, providers } from "ethers";
import { keccak256 } from "ethers/lib/utils";
import { signMetaTxRequest } from "../../scripts/meta/signer.js";
import { DataTypes } from "../../typechain/contracts/IDiamond";

export async function getTournamentParams() {
  const blockNumber = await ethers.provider.getBlockNumber();
  const block = await ethers.provider.getBlock(blockNumber);
  const roundStart = block.timestamp + ONE_HOUR;
  const roundEnd = roundStart + ONE_HOUR;
  const bracketMaximumPoints = 192;
  return {
    roundStart,
    roundEnd,
    tournamentStage,
    bracketLength,
    bracketMaximumPoints,
  };
}

export function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

export function getBracketHash(bracket: any[]) {
  const encodedBracketStruct = ethers.utils.defaultAbiCoder.encode(
    [
      "tuple(uint32[] teamsIds, uint32 finalsTeamOneScore, uint32 finalsTeamTwoScore)",
    ],
    [bracket]
  );
  return ethers.utils.keccak256(encodedBracketStruct);
}

export async function getInAdvance() {
  const OVERTIME = ONE_HOUR * 24 * 15; // 15 days
  await network.provider.send("evm_increaseTime", [OVERTIME]); // Simulate tournament has finished
  await network.provider.send("evm_mine");
}

export function generateBracket(
  bracket: DataTypes.BracketStruct
): DataTypes.BracketStruct {
  const clonedBracket = bracket.teamsIds.slice() as BigNumber[];
  const randomlySelectedWinners: BigNumber[] = [];

  for (let r = 0; r < roundIndexes.length; r++) {
    let bracketForRound: BigNumber[] = [];
    let clonedBracketForRound: BigNumber[] = [];

    if (r === 0) {
      bracketForRound = clonedBracket;
    } else {
      bracketForRound = randomlySelectedWinners.slice(
        roundIndexes[r - 1],
        roundIndexes[r - 1] + roundWinners[r - 1]
      );
    }

    clonedBracketForRound = bracketForRound.slice();

    for (let i = 0; i < roundWinners[r]; i++) {
      const randomIndex = getRandomInt(clonedBracketForRound.length);
      const selectedWinner = clonedBracketForRound[randomIndex];
      randomlySelectedWinners.push(selectedWinner);
      clonedBracketForRound.splice(randomIndex, 1);
    }
  }

  const winnerBracket = {
    teamsIds: randomlySelectedWinners,
    finalsTeamOneScore: bracket.finalsTeamOneScore,
    finalsTeamTwoScore: bracket.finalsTeamTwoScore,
  };

  return winnerBracket as DataTypes.BracketStruct;

  // return randomlySelectedWinners;
}

export async function setRoundsBoundsAndAdvance(
  nfbDiamond: IDiamond,
  TournamentId: number
) {
  let extraTimeStart = 0;
  let extraTimeEnd = 0;

  for (let i = 1; i <= 5; i++) {
    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);

    extraTimeStart += 2 * ONE_HOUR + extraTimeEnd;
    extraTimeEnd += 3 * ONE_HOUR + extraTimeStart;

    const start = block.timestamp + extraTimeStart;
    const end = block.timestamp + extraTimeEnd;

    await nfbDiamond.setRoundBounds(TournamentId, i + 1, start, end);

    await nfbDiamond.updateRound(TournamentId);
  }

  // End of 6th (final) round is in 14.20 days, so the time is increased with 15 days
  await getInAdvance();
}

export async function emitBracketScoresOnBatches(
  bracketsPerTx: number,
  batches: number,
  tokenIds: number[],
  bracketsArr: DataTypes.BracketStruct[],
  TournamentId: number,
  nfbDiamond: IDiamond
) {
  let batchCounter = 0;

  for (let k = 0; k < batches; k++) {
    const tokenIdsBatch = tokenIds.slice(
      batchCounter,
      batchCounter + bracketsPerTx
    );

    const bracketsArrBatch = bracketsArr.slice(
      batchCounter,
      batchCounter + bracketsPerTx
    );

    await nfbDiamond.emitBracketScores(
      TournamentId,
      tokenIdsBatch,
      bracketsArrBatch
    );

    batchCounter += bracketsPerTx;
  }
}

// Simulates emitting scores and updating for each round 1 to 6
export async function simulateRounds(
  nfbDiamond: IDiamond,
  roundsCount: number,
  winningBrackets: DataTypes.BracketStruct[]
) {
  await nfbDiamond.updateBracketResults(
    tournamentsTestConstants.args.TournamentId,
    bracketStruct
  );

  for (let i = 1; i <= roundsCount; i++) {
    await nfbDiamond.emitBracketScores(
      tournamentsTestConstants.args.TournamentId,
      tournamentsTestConstants.args.WinningTokenIds,
      winningBrackets
    );

    // End the current round
    const OVERTIME = ONE_HOUR * 2; // duration of 1 round
    await network.provider.send("evm_increaseTime", [OVERTIME]);
    await network.provider.send("evm_mine");

    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);

    const startNextRound = block.timestamp + 2 * ONE_HOUR;
    const endNextRound = startNextRound + 2 * ONE_HOUR;

    if (i + 1 <= roundsCount) {
      await nfbDiamond.setRoundBounds(
        tournamentsTestConstants.args.TournamentId,
        i + 1,
        startNextRound,
        endNextRound
      );
      await nfbDiamond.updateRound(tournamentsTestConstants.args.TournamentId);
    }

    if (i == roundsCount) {
      await network.provider.send("evm_increaseTime", [OVERTIME * 15]); // Simulate tournament has finished
      await network.provider.send("evm_mine");
    }
  }
}

export async function setupSigners() {
  const accounts = await ethers.getSigners();
  const deployer: Signer = accounts[0];
  const user: Signer = accounts[1];
  const daoWallet: Signer = accounts[2];

  return [deployer, user, daoWallet];
}

export function addSportsLeague(nfbDiamond: IDiamond) {
  return nfbDiamond.addSportsLeague(
    tournamentsTestConstants.args.SportsLeagueName,
    0
  );
}

export function addTournamentFormat(nfbDiamond: IDiamond) {
  return nfbDiamond.addTournamentFormat(
    tournamentsTestConstants.args.TournamentFormatName,
    0 // bracket
    // 63,
    // [32], // Brackets
    // 63
  );
}

export async function addTournament(nfbDiamond: IDiamond) {
  const blockNumber = await ethers.provider.getBlockNumber();
  const block = await ethers.provider.getBlock(blockNumber);

  return nfbDiamond.addTournament(
    tournamentsTestConstants.args.SportsLeagueIdFootball,
    1,
    tournamentsTestConstants.args.TournamentName,
    block.timestamp - ONE_HOUR,
    block.timestamp + ONE_HOUR,
    2023
  );
}

export async function addPoolMeta(
  signer: Signer,
  from: string,
  forwarder: MinimalForwarder,
  nfbDiamond: IDiamond,
  tournamentId: number,
  poolCurrencyAddress: string,
  allowEditableBrackets?: boolean,
  maxEntries?: number
) {
  const { request, signature } = await signMetaTxRequest(
    signer.provider,
    forwarder,
    {
      from: from,
      to: nfbDiamond.address,
      data: nfbDiamond.interface.encodeFunctionData("addPool", [
        {
          name: tournamentsTestConstants.args.PoolName,
          tournamentId: ethers.BigNumber.from(tournamentId),
          maxEntries: ethers.BigNumber.from(maxEntries),
          entryFee: ethers.BigNumber.from(0),
          poolCurrencyAddress: poolCurrencyAddress,
          accessTokenAddress: zeroAddress,
          accessTokenMinAmount: 0,
          prizeModelType: 0, // PercentageOfEntrieFees, SponsoredPrize, StakeToPlay
          stakeToPlayAmount: 0,
          prizeDistributionType: 1, // Standard
          rewardDistributionId: 2,
          royaltyType: 0,
          royaltyAmount: ethers.BigNumber.from(50),
          sponsoredPrizeAmount: 0,
          isFeatured: false,
          allowEditableBrackets: allowEditableBrackets ?? true,
        },
      ]),
    }
  );
  return forwarder.execute(request, signature);
}

export async function addPool(
  nfbDiamond: IDiamond,
  tournamentId: number,
  poolCurrencyAddress: string,
  allowEditableBrackets?: boolean,
  maxEntries?: number,
  entryFee?: number,
  prizeModelType?: number,
  stakeToPlayAmount?: number,
  rewardDistributionId?: number
) {
  return await nfbDiamond.addPool({
    name: tournamentsTestConstants.args.PoolName,
    tournamentId: ethers.BigNumber.from(tournamentId),
    maxEntries: ethers.BigNumber.from(maxEntries),
    entryFee: entryFee ?? ethers.BigNumber.from(0),
    poolCurrencyAddress: poolCurrencyAddress,
    accessTokenAddress: zeroAddress,
    accessTokenMinAmount: 0,
    prizeModelType: prizeModelType ?? 0, // PercentageOfEntrieFees, SponsoredPrize, StakeToPlay
    stakeToPlayAmount: stakeToPlayAmount ?? 0,
    prizeDistributionType: 1, // Standard
    rewardDistributionId: rewardDistributionId ?? 1,
    royaltyType: 0,
    royaltyAmount: ethers.BigNumber.from(50),
    sponsoredPrizeAmount: 0,
    isFeatured: false,
    allowEditableBrackets: allowEditableBrackets ?? true,
  });
}

export async function addPoolTokenGated(
  signer: providers.Provider | undefined,
  from: string,
  forwarder: MinimalForwarder,
  nfbDiamond: IDiamond,
  tournamentId: number,
  poolCurrencyAddress: string,
  accessTokenAddress: string,
  accessTokenMinAmount: number,
  allowEditableBrackets?: boolean
) {
  const { request, signature } = await signMetaTxRequest(signer, forwarder, {
    from: from,
    to: nfbDiamond.address,
    data: nfbDiamond.interface.encodeFunctionData("addPool", [
      {
        name: tournamentsTestConstants.args.PoolName,
        tournamentId: ethers.BigNumber.from(tournamentId),
        maxEntries: ethers.BigNumber.from(10),
        entryFee: ethers.BigNumber.from(0),
        poolCurrencyAddress: poolCurrencyAddress,
        accessTokenAddress: accessTokenAddress,
        accessTokenMinAmount: BigNumber.from(accessTokenMinAmount),
        prizeModelType: 0, // PercentageOfEntrieFees, SponsoredPrize, StakeToPlay
        stakeToPlayAmount: 0,
        prizeDistributionType: 1, // Standard
        rewardDistributionId: 1,
        royaltyType: 0,
        royaltyAmount: ethers.BigNumber.from(50),
        sponsoredPrizeAmount: 0,
        isFeatured: false,
        allowEditableBrackets: allowEditableBrackets ?? true,
      },
    ]),
  });
  return forwarder.execute(request, signature);
}

export function addPoolWithEntryFee(
  nfbDiamond: IDiamond,
  poolCurrencyAddress: string
) {
  return nfbDiamond.addPool({
    name: tournamentsTestConstants.args.PoolName,
    tournamentId: 1,
    maxEntries: 5,
    entryFee: tournamentsTestConstants.args.addPoolArgs.entryFee,
    poolCurrencyAddress: poolCurrencyAddress,
    accessTokenAddress: zeroAddress,
    accessTokenMinAmount: 0,
    prizeModelType: 0,
    stakeToPlayAmount: 0,
    prizeDistributionType: 0, // Standard
    rewardDistributionId:
      tournamentsTestConstants.args.addPoolArgs.rewardDistributionId, // 1 - Top5, 2 - Top10, 3 - Top100
    royaltyType: 0,
    royaltyAmount: 0,
    sponsoredPrizeAmount: 0,
    isFeatured: false,
    allowEditableBrackets: true,
  });
}

export function addPoolWithCustomRewardDistributionId(
  nfbDiamond: IDiamond,
  poolCurrencyAddress: string,
  rewardDistributionId: number
) {
  return nfbDiamond.addPool({
    name: tournamentsTestConstants.args.PoolName,
    tournamentId: 1,
    maxEntries: 5,
    entryFee: tournamentsTestConstants.args.addPoolArgs.entryFee,
    poolCurrencyAddress: poolCurrencyAddress,
    accessTokenAddress: zeroAddress,
    accessTokenMinAmount: 0,
    prizeModelType: 0,
    stakeToPlayAmount: 0,
    prizeDistributionType: 0, // Standard
    rewardDistributionId: rewardDistributionId, // 1 - Top5, 2 - Top10, 3 - Top100
    royaltyType: 0,
    royaltyAmount: 0,
    sponsoredPrizeAmount: 0,
    isFeatured: false,
    allowEditableBrackets: true,
  });
}

export function addPoolCustomRoyalty(
  nfbDiamond: IDiamond,
  poolCurrencyAddress: string,
  royaltyAmount: BigNumber
) {
  return nfbDiamond.addPool({
    name: tournamentsTestConstants.args.PoolName,
    tournamentId: 1,
    maxEntries: 5,
    entryFee: tournamentsTestConstants.args.addPoolArgs.entryFee,
    poolCurrencyAddress: poolCurrencyAddress,
    accessTokenAddress: zeroAddress,
    accessTokenMinAmount: 0,
    prizeModelType: 0,
    stakeToPlayAmount: 0,
    prizeDistributionType: 0, // Standard
    rewardDistributionId: 3, // 1 - Top5, 2 - Top10, 3 - Top100
    royaltyType: RoyaltyType.Percentage,
    royaltyAmount: royaltyAmount,
    sponsoredPrizeAmount: 0,
    isFeatured: false,
    allowEditableBrackets: true,
  });
}

export function addPoolWithStake(
  nfbDiamond: IDiamond,
  poolCurrencyAddress: string
) {
  return nfbDiamond.addPool({
    name: tournamentsTestConstants.args.PoolName,
    tournamentId: 1,
    maxEntries: 5,
    entryFee: 0,
    poolCurrencyAddress: poolCurrencyAddress,
    accessTokenAddress: zeroAddress,
    accessTokenMinAmount: tournamentsTestConstants.args.addPoolArgs.entryFee,
    prizeModelType: PrizeModelType.StakeToPlay,
    stakeToPlayAmount:
      tournamentsTestConstants.args.addPoolArgs.stakeToPlayAmount,
    prizeDistributionType: PrizeDistributionType.Standard,
    rewardDistributionId:
      tournamentsTestConstants.args.addPoolArgs.rewardDistributionId, // 1 - Top5, 2 - Top10, 3 - Top100
    royaltyType: RoyaltyType.Percentage,
    royaltyAmount: 10,
    sponsoredPrizeAmount: 0,
    isFeatured: false,
    allowEditableBrackets: true,
  });
}

export function addPoolWith2Entries(
  nfbDiamond: IDiamond,
  poolCurrencyAddress: string
) {
  return nfbDiamond.addPool({
    name: tournamentsTestConstants.args.PoolName,
    tournamentId: 1,
    maxEntries: 2,
    entryFee: 0,
    poolCurrencyAddress: poolCurrencyAddress,
    accessTokenAddress: zeroAddress,
    accessTokenMinAmount: 0,
    prizeModelType: 0,
    prizeDistributionType: 0, // Standard
    rewardDistributionId:
      tournamentsTestConstants.args.addPoolArgs.rewardDistributionId, // 1 - Top5, 2 - Top10, 3 - Top100
    stakeToPlayAmount: 0,
    royaltyType: 0,
    royaltyAmount: 10,
    sponsoredPrizeAmount: 0,
    isFeatured: false,
    allowEditableBrackets: true,
  });
}

export function addPoolWithAccessToken(
  nfbDiamond: IDiamond,
  poolCurrencyAddress: string,
  accessTokenAddress: string
) {
  return nfbDiamond.addPool({
    name: tournamentsTestConstants.args.PoolName,
    tournamentId: 1,
    maxEntries: 5,
    entryFee: 0,
    poolCurrencyAddress: poolCurrencyAddress,
    accessTokenAddress: accessTokenAddress,
    accessTokenMinAmount: 200,
    prizeModelType: 0,
    prizeDistributionType: 0, // Standard
    rewardDistributionId:
      tournamentsTestConstants.args.addPoolArgs.rewardDistributionId, // 1 - Top5, 2 - Top10, 3 - Top100
    stakeToPlayAmount: 0,
    royaltyType: 0,
    royaltyAmount: 10,
    sponsoredPrizeAmount: 0,
    isFeatured: false,
    allowEditableBrackets: true,
  });
}

export async function enterPoolMeta(
  signer: Signer,
  from: string,
  forwarder: MinimalForwarder,
  nfbDiamond: IDiamond,
  poolCurrencyContract: ERC20Mock,
  poolId: number,
  bracket: DataTypes.BracketStruct,
  tokenId?: number,
  isEditableBracket?: boolean
) {
  const { request, signature } = await signMetaTxRequest(
    signer.provider,
    forwarder,
    {
      from: from,
      to: nfbDiamond.address,
      data: nfbDiamond.interface.encodeFunctionData("enterPool", [
        ethers.BigNumber.from(poolId),
        ethers.BigNumber.from(tokenId),
        bracket,
        mockIpfsUri,
        isEditableBracket,
        zeroAddress,
      ]),
    }
  );

  return forwarder.execute(request, signature);
}

export async function enterPool(
  signer: Signer,
  from: string,
  forwarder: MinimalForwarder,
  nfbDiamond: IDiamond,
  poolCurrencyContract: ERC20Mock,
  poolId: number,
  bracket: DataTypes.BracketStruct,
  tokenId?: number,
  isEditableBracket?: boolean
) {
  const { request, signature } = await signMetaTxRequest(
    signer.provider,
    forwarder,
    {
      from: from,
      to: nfbDiamond.address,
      data: nfbDiamond.interface.encodeFunctionData("enterPool", [
        ethers.BigNumber.from(poolId),
        ethers.BigNumber.from(tokenId),
        bracket,
        mockIpfsUri,
        isEditableBracket,
        zeroAddress,
      ]),
    }
  );

  return forwarder.execute(request, signature);
}

export function enterPoolTokenGated(
  nfbDiamond: IDiamond,
  accessTokenColdWalletAddress: string,
  poolId?: number
) {
  return nfbDiamond.enterPool(
    poolId ?? tournamentsTestConstants.args.PoolId,
    0,
    bracketStruct,
    mockIpfsUri,
    false,
    accessTokenColdWalletAddress
  );
}

export async function updateBracket(
  signer: Signer,
  from: string,
  forwarder: MinimalForwarder,
  nfbDiamond: IDiamond,
  oldUserBracket: object,
  newUserBracket: object,
  poolId: number,
  tokenId: number
) {
  const { request, signature } = await signMetaTxRequest(
    signer.provider,
    forwarder,
    {
      from: from,
      to: nfbDiamond.address,
      data: nfbDiamond.interface.encodeFunctionData("updateBracket", [
        {
          _poolId: poolId,
          tokenId: tokenId,
          tokenUri: mockIpfsUri,
          oldBracket: oldUserBracket,
          newBracket: newUserBracket,
        },
      ]),
    }
  );
  return forwarder.execute(request, signature);
}

export async function claim(
  signer: Signer,
  from: string,
  forwarder: MinimalForwarder,
  nfbDiamond: IDiamond,
  _poolId: number,
  tokenId: number
) {
  const { request, signature } = await signMetaTxRequest(
    signer.provider,
    forwarder,
    {
      from: from,
      to: nfbDiamond.address,
      data: nfbDiamond.interface.encodeFunctionData("claim", [
        _poolId,
        tokenId,
      ]),
    }
  );
  return forwarder.execute(request, signature);
}

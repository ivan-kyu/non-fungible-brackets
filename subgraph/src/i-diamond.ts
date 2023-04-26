import { BigInt, Bytes, ByteArray } from "@graphprotocol/graph-ts";
import {
  BracketLengthSet as BracketLengthSetEvent,
  DelegateSuccessful as DelegateSuccessfulEvent,
  LogAddPool as LogAddPoolEvent,
  LogAddRewardDistribution as LogAddRewardDistributionEvent,
  LogAddSportsLeague as LogAddSportsLeagueEvent,
  LogAddTournament as LogAddTournamentEvent,
  LogAddTournamentFormat as LogAddTournamentFormatEvent,
  LogBracketResultsUpdated as LogBracketResultsUpdatedEvent,
  LogBracketScoreUpdated as LogBracketScoreUpdatedEvent,
  LogBracketScoresUpdated as LogBracketScoresUpdatedEvent,
  LogBracketUpdated as LogBracketUpdatedEvent,
  LogDisableSportsLeague as LogDisableSportsLeagueEvent,
  LogDisableTournamentFormat as LogDisableTournamentFormatEvent,
  LogFundsPulledOut as LogFundsPulledOutEvent,
  LogNftUpdatePriceUpdated as LogNftUpdatePriceUpdatedEvent,
  LogPoolEntered as LogPoolEnteredEvent,
  LogRewardClaimed as LogRewardClaimedEvent,
  LogRoundReverted as LogRoundRevertedEvent,
  LogRoundUpdated as LogRoundUpdatedEvent,
  LogSetRoundBounds as LogSetRoundBoundsEvent,
  LogStakePoolUpdated as LogStakePoolUpdatedEvent,
  LogTournamentSeasonUpdated as LogTournamentSeasonUpdatedEvent,
  LogWithdrawFundsLeft as LogWithdrawFundsLeftEvent,
  MaximumPointsSet as MaximumPointsSetEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Paused as PausedEvent,
  RoleAdminChanged as RoleAdminChangedEvent,
  RoleGranted as RoleGrantedEvent,
  RoleRevoked as RoleRevokedEvent,
  RoundIndexesSet as RoundIndexesSetEvent,
  TournamentRoundsCountSet as TournamentRoundsCountSetEvent,
  TournamentStageSet as TournamentStageSetEvent,
  TrustedForwarderSet as TrustedForwarderSetEvent,
  Unpaused as UnpausedEvent,
} from "../generated/IDiamond/IDiamond";

import { LogBracketMinted as LogBracketMintedEvent } from "../generated/NFBBRacket/NFBBRacket";

import {
  BracketLengthSet,
  DelegateSuccessful,
  LogAddPool,
  LogAddRewardDistribution,
  LogAddSportsLeague,
  LogAddTournament,
  LogAddTournamentFormat,
  LogBracketMinted,
  LogBracketResultsUpdated,
  LogBracketScoreUpdated,
  LogBracketScoresUpdated,
  LogBracketUpdated,
  LogDisableSportsLeague,
  LogDisableTournamentFormat,
  LogFundsPulledOut,
  LogNftUpdatePriceUpdated,
  LogPoolEntered,
  LogRewardClaimed,
  LogRoundReverted,
  LogRoundUpdated,
  LogSetRoundBoundsRange,
  LogStakePoolUpdated,
  LogTournamentSeasonUpdated,
  LogWithdrawFundsLeft,
  MaximumPointsSet,
  OwnershipTransferred,
  Paused,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked,
  RoundIndexesSet,
  TournamentRoundsCountSet,
  TournamentStageSet,
  TrustedForwarderSet,
  Unpaused,
  Tournament,
  Pool,
  Bracket,
  PoolBracket,
} from "../generated/schema";

function convertToId(id: BigInt): string {
  return id.toString();
}

export function handleBracketLengthSet(event: BracketLengthSetEvent): void {
  const entity = new BracketLengthSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.tournamentId = event.params.tournamentId;
  entity.bracketLength = event.params.bracketLength;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleDelegateSuccessful(event: DelegateSuccessfulEvent): void {
  const entity = new DelegateSuccessful(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.poolId = event.params.poolId;
  entity.coldWalletAddress = event.params.coldWalletAddress;
  entity.callerAddress = event.params.callerAddress;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleLogAddPool(event: LogAddPoolEvent): void {
  const eventEntity = new LogAddPool(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  eventEntity.poolId = event.params.poolId;
  eventEntity.tournamentId = event.params.tournamentId;
  eventEntity.name = event.params.name;
  eventEntity.entryFee = event.params.entryFee;
  eventEntity.stakeToPlayAmount = event.params.stakeToPlayAmount;
  eventEntity.royaltyType = event.params.royaltyType;
  eventEntity.royaltyAmount = event.params.royaltyAmount.toI32();
  eventEntity.prizeModelType = event.params.prizeModelType;
  eventEntity.accessTokenAddress = event.params.accessTokenAddress;
  eventEntity.allowEditableBrackets = event.params.allowEditableBrackets;
  eventEntity.currencyAddress = event.params.poolCurrencyAddress;
  eventEntity.poolFundAddress = event.params.fundingAddress;
  eventEntity.callerAddress = event.params.callerAddress;

  eventEntity.blockNumber = event.block.number;
  eventEntity.blockTimestamp = event.block.timestamp;
  eventEntity.transactionHash = event.transaction.hash;

  eventEntity.save();

  const poolIdBytes = convertToId(event.params.poolId);
  let pool = Pool.load(poolIdBytes);
  if (pool === null) {
    pool = new Pool(poolIdBytes);
  }

  const bytesTournamentId = convertToId(event.params.tournamentId);
  const tournament = Tournament.load(bytesTournamentId);
  if (tournament === null) {
    throw new Error("Could not find tournament while adding pool");
  }
  pool.poolId = event.params.poolId;
  pool.tournament = tournament.id;
  pool.name = event.params.name;
  pool.entryFee = event.params.entryFee;
  pool.stakeToPlayAmount = event.params.stakeToPlayAmount;
  pool.prizeModelType = event.params.prizeModelType;
  pool.accessTokenAddress = event.params.accessTokenAddress;
  pool.allowEditableBrackets = event.params.allowEditableBrackets;
  pool.creatorAddress = event.params.callerAddress;
  pool.fundingAddress = event.params.fundingAddress;
  pool.currencyAddress = event.params.poolCurrencyAddress;
  pool.royaltyAmount = event.params.royaltyAmount.toI32();
  pool.royaltyType = event.params.royaltyType;
  pool.distribution = convertToId(event.params.rewardDistributionId);

  pool.blockNumber = event.block.number;
  pool.blockTimestamp = event.block.timestamp;
  pool.transactionHash = event.transaction.hash;
  pool.currentPoolValue = new BigInt(0);
  pool.numEntrants = new BigInt(0);
  pool.totalStaked = new BigInt(0);

  pool.save();
}

export function handleLogAddRewardDistribution(
  event: LogAddRewardDistributionEvent
): void {
  const entity = new LogAddRewardDistribution(
    convertToId(event.params.rewardDistributionId)
  );
  entity.rewardDistributionId = event.params.rewardDistributionId;
  entity.name = event.params.name;
  entity.isAllOrNothing = event.params.isAllOrNothing;
  entity.rewardPercentages = event.params.rewardPercentages;
  entity.rewardRanges = event.params.rewardRanges;
  entity.callerAddress = event.params.callerAddress;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleLogAddSportsLeague(event: LogAddSportsLeagueEvent): void {
  const entity = new LogAddSportsLeague(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.sportsLeagueId = event.params.sportsLeagueId;
  entity.name = event.params.name;
  entity.sport = event.params.sport;
  entity.callerAddress = event.params.callerAddress;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

/**
 * 
 * @param event type Tournament @entity {
  id: String!
  sportsLeagueId: BigInt! # uint256
  name: String! # string
  tournamentFormatId: BigInt! # uint256
  season: Int! # uint256
  callerAddress: Bytes! # address
  blockNumber: BigInt!
  blockTimestamp: BigInt!
  transactionHash: Bytes!
  format: LogAddTournamentFormat
  pools: [Pool!]! @derivedFrom(field: "tournament")
}
 */
export function handleLogAddTournament(event: LogAddTournamentEvent): void {
  const entityEventLog = new LogAddTournament(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  const tournamentId = event.params.tournamentId;
  entityEventLog.tournamentId = tournamentId;
  entityEventLog.sportsLeagueId = event.params.sportsLeagueId;
  entityEventLog.name = event.params.name;
  entityEventLog.tournamentFormatId = event.params.tournamentFormatId;
  entityEventLog.season = event.params.season;
  entityEventLog.openFrom = event.params.openFrom;
  entityEventLog.openTo = event.params.openTo;
  entityEventLog.callerAddress = event.params.callerAddress;

  entityEventLog.blockNumber = event.block.number;
  entityEventLog.blockTimestamp = event.block.timestamp;
  entityEventLog.transactionHash = event.transaction.hash;

  entityEventLog.save();

  const bytesTournamentId = convertToId(tournamentId);
  let tournament = Tournament.load(bytesTournamentId);
  if (tournament == null) {
    tournament = new Tournament(bytesTournamentId);
  }

  tournament.sportsLeagueId = event.params.sportsLeagueId;
  tournament.name = event.params.name;
  tournament.tournamentFormat = convertToId(event.params.tournamentFormatId);
  tournament.season = event.params.season;
  tournament.openFrom = event.params.openFrom;
  tournament.openTo = event.params.openTo;
  tournament.callerAddress = event.params.callerAddress;

  tournament.blockNumber = event.block.number;
  tournament.blockTimestamp = event.block.timestamp;
  tournament.transactionHash = event.transaction.hash;

  tournament.save();
}

export function handleLogAddTournamentFormat(
  event: LogAddTournamentFormatEvent
): void {
  const entity = new LogAddTournamentFormat(
    convertToId(event.params.tournamentFormatId)
  );
  entity.tournamentFormatId = event.params.tournamentFormatId;
  entity.name = event.params.name;
  const typeEnum = event.params.tournamentType;
  if (typeEnum == new BigInt(0)) {
    entity.tournamentType = "Brackets";
  } else if (typeEnum == new BigInt(1)) {
    entity.tournamentType = "RoundRobin";
  } else if (typeEnum == new BigInt(2)) {
    entity.tournamentType = "Combined";
  } else {
    throw new Error("Unregistered enum value got through");
  }
  entity.callerAddress = event.params.callerAddress;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleLogBracketMinted(event: LogBracketMintedEvent): void {
  const eventEntity = new LogBracketMinted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  eventEntity.triggeredBy = event.params.triggeredBy;
  eventEntity.tokenId = event.params.tokenId;

  eventEntity.blockNumber = event.block.number;
  eventEntity.blockTimestamp = event.block.timestamp;
  eventEntity.transactionHash = event.transaction.hash;

  eventEntity.save();

  const bracket = new Bracket(convertToId(event.params.tokenId));
  bracket.pickedWinners = event.params.bracket.teamsIds;
  bracket.finalsTeam1Points = event.params.bracket.finalsTeamOneScore;
  bracket.finalsTeam2Points = event.params.bracket.finalsTeamTwoScore;
  bracket.pointsByRound = [];
  bracket.totalPoints = new BigInt(0);
  bracket.creator = event.params.triggeredBy;

  bracket.save();
}

export function handleLogBracketUpdated(event: LogBracketUpdatedEvent): void {
  const eventEntity = new LogBracketUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  eventEntity.callerAddress = event.params.callerAddress;
  eventEntity.poolId = event.params.poolId;
  eventEntity.tokenId = event.params.tokenId;
  eventEntity.startUpdateFromIndex = event.params.startUpdateFromIndex;

  eventEntity.blockNumber = event.block.number;
  eventEntity.blockTimestamp = event.block.timestamp;
  eventEntity.transactionHash = event.transaction.hash;

  eventEntity.save();

  const bracket = Bracket.load(convertToId(event.params.tokenId));
  if (bracket === null) {
    throw new Error("Unexpected undefined bracket being updated");
  }
  bracket.pickedWinners = event.params.bracket.teamsIds;
  bracket.finalsTeam1Points = event.params.bracket.finalsTeamOneScore;
  bracket.finalsTeam2Points = event.params.bracket.finalsTeamTwoScore;
  bracket.save();
}

export function handleLogBracketResultsUpdated(
  event: LogBracketResultsUpdatedEvent
): void {
  const entity = new LogBracketResultsUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.from = event.params.from;
  entity.teamsIds = event.params.teamsIds;
  entity.finalsTeamOneScore = event.params.finalsTeamOneScore;
  entity.finalsTeamTwoScore = event.params.finalsTeamTwoScore;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleLogBracketScoreUpdated(
  event: LogBracketScoreUpdatedEvent
): void {
  const eventEntity = new LogBracketScoreUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  eventEntity.tokenId = event.params.tokenId;
  eventEntity.roundScore = event.params.roundScore;
  eventEntity.score = event.params.score;
  eventEntity.round = event.params.round;
  eventEntity.owner = event.params.owner;

  eventEntity.blockNumber = event.block.number;
  eventEntity.blockTimestamp = event.block.timestamp;
  eventEntity.transactionHash = event.transaction.hash;

  eventEntity.save();

  const bracket = Bracket.load(convertToId(event.params.tokenId));
  if (bracket === null) {
    throw new Error("Could not load bracket on score update");
  }

  bracket.pointsByRound.push(new BigInt(event.params.round));
  bracket.totalPoints = new BigInt(event.params.score);

  bracket.save();
}

export function handleLogBracketScoresUpdated(
  event: LogBracketScoresUpdatedEvent
): void {
  const entity = new LogBracketScoresUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.triggeredBy = event.params.triggeredBy;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleLogDisableSportsLeague(
  event: LogDisableSportsLeagueEvent
): void {
  const entity = new LogDisableSportsLeague(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.sportsLeagueId = event.params.sportsLeagueId;
  entity.callerAddress = event.params.callerAddress;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleLogDisableTournamentFormat(
  event: LogDisableTournamentFormatEvent
): void {
  const entity = new LogDisableTournamentFormat(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.tournamentId = event.params.tournamentId;
  entity.callerAddress = event.params.callerAddress;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleLogFundsPulledOut(event: LogFundsPulledOutEvent): void {
  const entity = new LogFundsPulledOut(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.to = event.params.to;
  entity.amount = event.params.amount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleLogNftUpdatePriceUpdated(
  event: LogNftUpdatePriceUpdatedEvent
): void {
  const entity = new LogNftUpdatePriceUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.newNftUpdatePrice = event.params.newNftUpdatePrice;
  entity.callerAddress = event.params.callerAddress;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleLogPoolEntered(event: LogPoolEnteredEvent): void {
  const eventEntity = new LogPoolEntered(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  eventEntity.poolId = event.params.poolId;
  eventEntity.tokenId = event.params.tokenId;
  eventEntity.callerAddress = event.params.callerAddress;

  eventEntity.blockNumber = event.block.number;
  eventEntity.blockTimestamp = event.block.timestamp;
  eventEntity.transactionHash = event.transaction.hash;

  eventEntity.save();

  let poolbracket = PoolBracket.load(
    convertToId(event.params.poolId).concat(convertToId(event.params.tokenId))
  );
  if (poolbracket === null) {
    poolbracket = new PoolBracket(
      convertToId(event.params.poolId).concat(convertToId(event.params.tokenId))
    );
  }
  poolbracket.bracket = convertToId(event.params.tokenId);
  poolbracket.pool = convertToId(event.params.poolId);
  poolbracket.save();

  const pool = Pool.load(convertToId(event.params.poolId));
  if (pool === null) {
    throw new Error("Could not properly load pool on pool being entered");
  }
  pool.numEntrants = pool.numEntrants.plus(new BigInt(1));
  pool.save();
}

export function handleLogRewardClaimed(event: LogRewardClaimedEvent): void {
  const entity = new LogRewardClaimed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.triggeredBy = event.params.triggeredBy;
  entity.tokenId = event.params.tokenId;
  entity.reward = event.params.reward;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleLogRoundReverted(event: LogRoundRevertedEvent): void {
  const entity = new LogRoundReverted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.from = event.params.from;
  entity.newRound = event.params.newRound;
  entity.newRoundIndex = event.params.newRoundIndex;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleLogRoundUpdated(event: LogRoundUpdatedEvent): void {
  const entity = new LogRoundUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.from = event.params.from;
  entity.tournamentId = event.params.tournamentId;
  entity.newRound = event.params.newRound;
  entity.newRoundIndex = event.params.newRoundIndex;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleLogSetRoundBounds(event: LogSetRoundBoundsEvent): void {
  const entity = new LogSetRoundBoundsRange(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.tournamentId = event.params.tournamentId;
  entity.round = event.params.round;
  entity.startRound = event.params.startRound;
  entity.endRound = event.params.endRound;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleLogStakePoolUpdated(
  event: LogStakePoolUpdatedEvent
): void {
  const eventEntity = new LogStakePoolUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  eventEntity.poolId = event.params.poolId;
  eventEntity.newTotalStakesByPool = event.params.newTotalStakesByPool;
  eventEntity.callerAddress = event.params.callerAddress;

  eventEntity.blockNumber = event.block.number;
  eventEntity.blockTimestamp = event.block.timestamp;
  eventEntity.transactionHash = event.transaction.hash;

  eventEntity.save();

  const poolIdBytes = convertToId(event.params.poolId);
  const pool = Pool.load(poolIdBytes);
  if (pool === null) {
    throw new Error("Could not find pool on LogStakePoolUpdated");
  }
  pool.totalStaked = event.params.newTotalStakesByPool;
}

export function handleLogTournamentSeasonUpdated(
  event: LogTournamentSeasonUpdatedEvent
): void {
  const entity = new LogTournamentSeasonUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity._sportsLeagueId = event.params._sportsLeagueId;
  entity._seasonId = event.params._seasonId;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleLogWithdrawFundsLeft(
  event: LogWithdrawFundsLeftEvent
): void {
  const entity = new LogWithdrawFundsLeft(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.poolId = event.params.poolId;
  entity.to = event.params.to;
  entity.amount = event.params.amount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleMaximumPointsSet(event: MaximumPointsSetEvent): void {
  const entity = new MaximumPointsSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.tournamentId = event.params.tournamentId;
  entity.maxPoints = event.params.maxPoints;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  const entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.previousOwner = event.params.previousOwner;
  entity.newOwner = event.params.newOwner;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handlePaused(event: PausedEvent): void {
  const entity = new Paused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.account = event.params.account;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleRoleAdminChanged(event: RoleAdminChangedEvent): void {
  const entity = new RoleAdminChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.role = event.params.role;
  entity.previousAdminRole = event.params.previousAdminRole;
  entity.newAdminRole = event.params.newAdminRole;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleRoleGranted(event: RoleGrantedEvent): void {
  const entity = new RoleGranted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.role = event.params.role;
  entity.account = event.params.account;
  entity.sender = event.params.sender;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleRoleRevoked(event: RoleRevokedEvent): void {
  const entity = new RoleRevoked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.role = event.params.role;
  entity.account = event.params.account;
  entity.sender = event.params.sender;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleRoundIndexesSet(event: RoundIndexesSetEvent): void {
  const entity = new RoundIndexesSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.tournamentId = event.params.tournamentId;
  entity.roundIndexes = event.params.roundIndexes;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleTournamentRoundsCountSet(
  event: TournamentRoundsCountSetEvent
): void {
  const entity = new TournamentRoundsCountSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.tournamentId = event.params.tournamentId;
  entity.roundsCount = event.params.roundsCount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleTournamentStageSet(event: TournamentStageSetEvent): void {
  const entity = new TournamentStageSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.tournamentId = event.params.tournamentId;
  entity.tournamentStage = event.params.tournamentStage;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleTrustedForwarderSet(
  event: TrustedForwarderSetEvent
): void {
  const entity = new TrustedForwarderSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.oldAddress = event.params.oldAddress;
  entity.newAddress = event.params.newAddress;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleUnpaused(event: UnpausedEvent): void {
  const entity = new Unpaused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.account = event.params.account;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

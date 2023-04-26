import { newMockEvent } from "matchstick-as";
import { ethereum, BigInt, Address, Bytes } from "@graphprotocol/graph-ts";
import {
  BracketLengthSet,
  DelegateSuccessful,
  LogAddPool,
  LogAddRewardDistribution,
  LogAddSportsLeague,
  LogAddTournament,
  LogAddTournamentFormat,
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
  LogSetRoundBounds,
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
} from "../generated/IDiamond/IDiamond";

import { LogBracketMinted } from "../generated/NFBBracket/NFBBracket";

export function createBracketLengthSetEvent(
  tournamentId: BigInt,
  bracketLength: i32
): BracketLengthSet {
  const bracketLengthSetEvent = changetype<BracketLengthSet>(newMockEvent());

  bracketLengthSetEvent.parameters = new Array();

  bracketLengthSetEvent.parameters.push(
    new ethereum.EventParam(
      "tournamentId",
      ethereum.Value.fromUnsignedBigInt(tournamentId)
    )
  );
  bracketLengthSetEvent.parameters.push(
    new ethereum.EventParam(
      "bracketLength",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(bracketLength))
    )
  );

  return bracketLengthSetEvent;
}

export function createDelegateSuccessfulEvent(
  poolId: BigInt,
  coldWalletAddress: Address,
  callerAddress: Address
): DelegateSuccessful {
  const delegateSuccessfulEvent = changetype<DelegateSuccessful>(
    newMockEvent()
  );

  delegateSuccessfulEvent.parameters = new Array();

  delegateSuccessfulEvent.parameters.push(
    new ethereum.EventParam("poolId", ethereum.Value.fromUnsignedBigInt(poolId))
  );
  delegateSuccessfulEvent.parameters.push(
    new ethereum.EventParam(
      "coldWalletAddress",
      ethereum.Value.fromAddress(coldWalletAddress)
    )
  );
  delegateSuccessfulEvent.parameters.push(
    new ethereum.EventParam(
      "callerAddress",
      ethereum.Value.fromAddress(callerAddress)
    )
  );

  return delegateSuccessfulEvent;
}

export function createLogAddPoolEvent(
  poolId: BigInt,
  name: string,
  entryFee: BigInt,
  prizeModelType: BigInt,
  accessTokenAddress: Address,
  allowEditableBrackets: boolean,
  callerAddress: Address
): LogAddPool {
  const logAddPoolEvent = changetype<LogAddPool>(newMockEvent());

  logAddPoolEvent.parameters = new Array();

  logAddPoolEvent.parameters.push(
    new ethereum.EventParam("poolId", ethereum.Value.fromUnsignedBigInt(poolId))
  );
  logAddPoolEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  );
  logAddPoolEvent.parameters.push(
    new ethereum.EventParam(
      "entryFee",
      ethereum.Value.fromUnsignedBigInt(entryFee)
    )
  );
  logAddPoolEvent.parameters.push(
    new ethereum.EventParam(
      "prizeModelType",
      ethereum.Value.fromUnsignedBigInt(prizeModelType)
    )
  );
  logAddPoolEvent.parameters.push(
    new ethereum.EventParam(
      "accessTokenAddress",
      ethereum.Value.fromAddress(accessTokenAddress)
    )
  );
  logAddPoolEvent.parameters.push(
    new ethereum.EventParam(
      "allowEditableBrackets",
      ethereum.Value.fromBoolean(allowEditableBrackets)
    )
  );
  logAddPoolEvent.parameters.push(
    new ethereum.EventParam(
      "callerAddress",
      ethereum.Value.fromAddress(callerAddress)
    )
  );

  return logAddPoolEvent;
}

export function createLogAddRewardDistributionEvent(
  rewardDistributionId: BigInt,
  name: string,
  isAllOrNothing: boolean,
  callerAddress: Address
): LogAddRewardDistribution {
  const logAddRewardDistributionEvent = changetype<LogAddRewardDistribution>(
    newMockEvent()
  );

  logAddRewardDistributionEvent.parameters = new Array();

  logAddRewardDistributionEvent.parameters.push(
    new ethereum.EventParam(
      "rewardDistributionId",
      ethereum.Value.fromUnsignedBigInt(rewardDistributionId)
    )
  );
  logAddRewardDistributionEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  );
  logAddRewardDistributionEvent.parameters.push(
    new ethereum.EventParam(
      "isAllOrNothing",
      ethereum.Value.fromBoolean(isAllOrNothing)
    )
  );
  logAddRewardDistributionEvent.parameters.push(
    new ethereum.EventParam(
      "callerAddress",
      ethereum.Value.fromAddress(callerAddress)
    )
  );

  return logAddRewardDistributionEvent;
}

export function createLogAddSportsLeagueEvent(
  sportsLeagueId: BigInt,
  name: string,
  sport: BigInt,
  callerAddress: Address
): LogAddSportsLeague {
  const logAddSportsLeagueEvent = changetype<LogAddSportsLeague>(
    newMockEvent()
  );

  logAddSportsLeagueEvent.parameters = new Array();

  logAddSportsLeagueEvent.parameters.push(
    new ethereum.EventParam(
      "sportsLeagueId",
      ethereum.Value.fromUnsignedBigInt(sportsLeagueId)
    )
  );
  logAddSportsLeagueEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  );
  logAddSportsLeagueEvent.parameters.push(
    new ethereum.EventParam("sport", ethereum.Value.fromUnsignedBigInt(sport))
  );
  logAddSportsLeagueEvent.parameters.push(
    new ethereum.EventParam(
      "callerAddress",
      ethereum.Value.fromAddress(callerAddress)
    )
  );

  return logAddSportsLeagueEvent;
}

export function createLogAddTournamentEvent(
  tournamentId: BigInt,
  callerAddress: Address
): LogAddTournament {
  const logAddTournamentEvent = changetype<LogAddTournament>(newMockEvent());

  logAddTournamentEvent.parameters = new Array();

  logAddTournamentEvent.parameters.push(
    new ethereum.EventParam(
      "tournamentId",
      ethereum.Value.fromUnsignedBigInt(tournamentId)
    )
  );
  logAddTournamentEvent.parameters.push(
    new ethereum.EventParam(
      "callerAddress",
      ethereum.Value.fromAddress(callerAddress)
    )
  );

  return logAddTournamentEvent;
}

export function createLogAddTournamentFormatEvent(
  tournamentFormatId: BigInt,
  name: string,
  tournamentType: BigInt,
  callerAddress: Address
): LogAddTournamentFormat {
  const logAddTournamentFormatEvent = changetype<LogAddTournamentFormat>(
    newMockEvent()
  );

  logAddTournamentFormatEvent.parameters = new Array();

  logAddTournamentFormatEvent.parameters.push(
    new ethereum.EventParam(
      "tournamentFormatId",
      ethereum.Value.fromUnsignedBigInt(tournamentFormatId)
    )
  );
  logAddTournamentFormatEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  );
  logAddTournamentFormatEvent.parameters.push(
    new ethereum.EventParam(
      "tournamentType",
      ethereum.Value.fromUnsignedBigInt(tournamentType)
    )
  );
  logAddTournamentFormatEvent.parameters.push(
    new ethereum.EventParam(
      "callerAddress",
      ethereum.Value.fromAddress(callerAddress)
    )
  );

  return logAddTournamentFormatEvent;
}

export function createLogBracketMintedEvent(
  triggeredBy: Address,
  tokenId: BigInt
): LogBracketMinted {
  const logBracketMintedEvent = changetype<LogBracketMinted>(newMockEvent());

  logBracketMintedEvent.parameters = new Array();

  logBracketMintedEvent.parameters.push(
    new ethereum.EventParam(
      "triggeredBy",
      ethereum.Value.fromAddress(triggeredBy)
    )
  );
  logBracketMintedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  );

  return logBracketMintedEvent;
}

export function createLogBracketResultsUpdatedEvent(
  from: Address,
  teamsIds: Array<BigInt>,
  finalsTeamOneScore: BigInt,
  finalsTeamTwoScore: BigInt
): LogBracketResultsUpdated {
  const logBracketResultsUpdatedEvent = changetype<LogBracketResultsUpdated>(
    newMockEvent()
  );

  logBracketResultsUpdatedEvent.parameters = new Array();

  logBracketResultsUpdatedEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  );
  logBracketResultsUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "teamsIds",
      ethereum.Value.fromUnsignedBigIntArray(teamsIds)
    )
  );
  logBracketResultsUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "finalsTeamOneScore",
      ethereum.Value.fromUnsignedBigInt(finalsTeamOneScore)
    )
  );
  logBracketResultsUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "finalsTeamTwoScore",
      ethereum.Value.fromUnsignedBigInt(finalsTeamTwoScore)
    )
  );

  return logBracketResultsUpdatedEvent;
}

export function createLogBracketScoreUpdatedEvent(
  tokenId: BigInt,
  roundScore: i32,
  score: i32,
  round: i32,
  owner: Address
): LogBracketScoreUpdated {
  const logBracketScoreUpdatedEvent = changetype<LogBracketScoreUpdated>(
    newMockEvent()
  );

  logBracketScoreUpdatedEvent.parameters = new Array();

  logBracketScoreUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  );
  logBracketScoreUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "roundScore",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(roundScore))
    )
  );
  logBracketScoreUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "score",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(score))
    )
  );
  logBracketScoreUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "round",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(round))
    )
  );
  logBracketScoreUpdatedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  );

  return logBracketScoreUpdatedEvent;
}

export function createLogBracketScoresUpdatedEvent(
  triggeredBy: Address
): LogBracketScoresUpdated {
  const logBracketScoresUpdatedEvent = changetype<LogBracketScoresUpdated>(
    newMockEvent()
  );

  logBracketScoresUpdatedEvent.parameters = new Array();

  logBracketScoresUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "triggeredBy",
      ethereum.Value.fromAddress(triggeredBy)
    )
  );

  return logBracketScoresUpdatedEvent;
}

export function createLogBracketUpdatedEvent(
  callerAddress: Address,
  poolId: BigInt,
  tokenId: BigInt,
  startUpdateFromIndex: i32
): LogBracketUpdated {
  const logBracketUpdatedEvent = changetype<LogBracketUpdated>(newMockEvent());

  logBracketUpdatedEvent.parameters = new Array();

  logBracketUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "callerAddress",
      ethereum.Value.fromAddress(callerAddress)
    )
  );
  logBracketUpdatedEvent.parameters.push(
    new ethereum.EventParam("poolId", ethereum.Value.fromUnsignedBigInt(poolId))
  );
  logBracketUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  );
  logBracketUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "startUpdateFromIndex",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(startUpdateFromIndex))
    )
  );

  return logBracketUpdatedEvent;
}

export function createLogDisableSportsLeagueEvent(
  sportsLeagueId: BigInt,
  callerAddress: Address
): LogDisableSportsLeague {
  const logDisableSportsLeagueEvent = changetype<LogDisableSportsLeague>(
    newMockEvent()
  );

  logDisableSportsLeagueEvent.parameters = new Array();

  logDisableSportsLeagueEvent.parameters.push(
    new ethereum.EventParam(
      "sportsLeagueId",
      ethereum.Value.fromUnsignedBigInt(sportsLeagueId)
    )
  );
  logDisableSportsLeagueEvent.parameters.push(
    new ethereum.EventParam(
      "callerAddress",
      ethereum.Value.fromAddress(callerAddress)
    )
  );

  return logDisableSportsLeagueEvent;
}

export function createLogDisableTournamentFormatEvent(
  tournamentId: BigInt,
  callerAddress: Address
): LogDisableTournamentFormat {
  const logDisableTournamentFormatEvent =
    changetype<LogDisableTournamentFormat>(newMockEvent());

  logDisableTournamentFormatEvent.parameters = new Array();

  logDisableTournamentFormatEvent.parameters.push(
    new ethereum.EventParam(
      "tournamentId",
      ethereum.Value.fromUnsignedBigInt(tournamentId)
    )
  );
  logDisableTournamentFormatEvent.parameters.push(
    new ethereum.EventParam(
      "callerAddress",
      ethereum.Value.fromAddress(callerAddress)
    )
  );

  return logDisableTournamentFormatEvent;
}

export function createLogFundsPulledOutEvent(
  to: Address,
  amount: BigInt
): LogFundsPulledOut {
  const logFundsPulledOutEvent = changetype<LogFundsPulledOut>(newMockEvent());

  logFundsPulledOutEvent.parameters = new Array();

  logFundsPulledOutEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  );
  logFundsPulledOutEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  );

  return logFundsPulledOutEvent;
}

export function createLogNftUpdatePriceUpdatedEvent(
  newNftUpdatePrice: BigInt,
  callerAddress: Address
): LogNftUpdatePriceUpdated {
  const logNftUpdatePriceUpdatedEvent = changetype<LogNftUpdatePriceUpdated>(
    newMockEvent()
  );

  logNftUpdatePriceUpdatedEvent.parameters = new Array();

  logNftUpdatePriceUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newNftUpdatePrice",
      ethereum.Value.fromUnsignedBigInt(newNftUpdatePrice)
    )
  );
  logNftUpdatePriceUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "callerAddress",
      ethereum.Value.fromAddress(callerAddress)
    )
  );

  return logNftUpdatePriceUpdatedEvent;
}

export function createLogPoolEnteredEvent(
  poolId: BigInt,
  tokenId: BigInt,
  callerAddress: Address
): LogPoolEntered {
  const logPoolEnteredEvent = changetype<LogPoolEntered>(newMockEvent());

  logPoolEnteredEvent.parameters = new Array();

  logPoolEnteredEvent.parameters.push(
    new ethereum.EventParam("poolId", ethereum.Value.fromUnsignedBigInt(poolId))
  );
  logPoolEnteredEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  );
  logPoolEnteredEvent.parameters.push(
    new ethereum.EventParam(
      "callerAddress",
      ethereum.Value.fromAddress(callerAddress)
    )
  );

  return logPoolEnteredEvent;
}

export function createLogRewardClaimedEvent(
  triggeredBy: Address,
  tokenId: BigInt,
  reward: BigInt
): LogRewardClaimed {
  const logRewardClaimedEvent = changetype<LogRewardClaimed>(newMockEvent());

  logRewardClaimedEvent.parameters = new Array();

  logRewardClaimedEvent.parameters.push(
    new ethereum.EventParam(
      "triggeredBy",
      ethereum.Value.fromAddress(triggeredBy)
    )
  );
  logRewardClaimedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  );
  logRewardClaimedEvent.parameters.push(
    new ethereum.EventParam("reward", ethereum.Value.fromUnsignedBigInt(reward))
  );

  return logRewardClaimedEvent;
}

export function createLogRoundRevertedEvent(
  from: Address,
  newRound: i32,
  newRoundIndex: i32
): LogRoundReverted {
  const logRoundRevertedEvent = changetype<LogRoundReverted>(newMockEvent());

  logRoundRevertedEvent.parameters = new Array();

  logRoundRevertedEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  );
  logRoundRevertedEvent.parameters.push(
    new ethereum.EventParam(
      "newRound",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(newRound))
    )
  );
  logRoundRevertedEvent.parameters.push(
    new ethereum.EventParam(
      "newRoundIndex",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(newRoundIndex))
    )
  );

  return logRoundRevertedEvent;
}

export function createLogRoundUpdatedEvent(
  from: Address,
  tournamentId: BigInt,
  newRound: i32,
  newRoundIndex: i32
): LogRoundUpdated {
  const logRoundUpdatedEvent = changetype<LogRoundUpdated>(newMockEvent());

  logRoundUpdatedEvent.parameters = new Array();

  logRoundUpdatedEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  );
  logRoundUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "tournamentId",
      ethereum.Value.fromUnsignedBigInt(tournamentId)
    )
  );
  logRoundUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newRound",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(newRound))
    )
  );
  logRoundUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newRoundIndex",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(newRoundIndex))
    )
  );

  return logRoundUpdatedEvent;
}

export function createLogSetRoundBoundsEvent(
  tournamentId: BigInt,
  round: i32,
  startRound: BigInt,
  endRound: BigInt
): LogSetRoundBounds {
  const logSetRoundBoundsEvent = changetype<LogSetRoundBounds>(newMockEvent());

  logSetRoundBoundsEvent.parameters = new Array();

  logSetRoundBoundsEvent.parameters.push(
    new ethereum.EventParam(
      "tournamentId",
      ethereum.Value.fromUnsignedBigInt(tournamentId)
    )
  );
  logSetRoundBoundsEvent.parameters.push(
    new ethereum.EventParam(
      "round",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(round))
    )
  );
  logSetRoundBoundsEvent.parameters.push(
    new ethereum.EventParam(
      "startRound",
      ethereum.Value.fromUnsignedBigInt(startRound)
    )
  );
  logSetRoundBoundsEvent.parameters.push(
    new ethereum.EventParam(
      "endRound",
      ethereum.Value.fromUnsignedBigInt(endRound)
    )
  );

  return logSetRoundBoundsEvent;
}

export function createLogStakePoolUpdatedEvent(
  poolId: BigInt,
  newTotalStakesByPool: BigInt,
  callerAddress: Address
): LogStakePoolUpdated {
  const logStakePoolUpdatedEvent = changetype<LogStakePoolUpdated>(
    newMockEvent()
  );

  logStakePoolUpdatedEvent.parameters = new Array();

  logStakePoolUpdatedEvent.parameters.push(
    new ethereum.EventParam("poolId", ethereum.Value.fromUnsignedBigInt(poolId))
  );
  logStakePoolUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newTotalStakesByPool",
      ethereum.Value.fromUnsignedBigInt(newTotalStakesByPool)
    )
  );
  logStakePoolUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "callerAddress",
      ethereum.Value.fromAddress(callerAddress)
    )
  );

  return logStakePoolUpdatedEvent;
}

export function createLogTournamentSeasonUpdatedEvent(
  _sportsLeagueId: BigInt,
  _seasonId: BigInt
): LogTournamentSeasonUpdated {
  const logTournamentSeasonUpdatedEvent =
    changetype<LogTournamentSeasonUpdated>(newMockEvent());

  logTournamentSeasonUpdatedEvent.parameters = new Array();

  logTournamentSeasonUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "_sportsLeagueId",
      ethereum.Value.fromUnsignedBigInt(_sportsLeagueId)
    )
  );
  logTournamentSeasonUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "_seasonId",
      ethereum.Value.fromUnsignedBigInt(_seasonId)
    )
  );

  return logTournamentSeasonUpdatedEvent;
}

export function createLogWithdrawFundsLeftEvent(
  poolId: BigInt,
  to: Address,
  amount: BigInt
): LogWithdrawFundsLeft {
  const logWithdrawFundsLeftEvent = changetype<LogWithdrawFundsLeft>(
    newMockEvent()
  );

  logWithdrawFundsLeftEvent.parameters = new Array();

  logWithdrawFundsLeftEvent.parameters.push(
    new ethereum.EventParam("poolId", ethereum.Value.fromUnsignedBigInt(poolId))
  );
  logWithdrawFundsLeftEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  );
  logWithdrawFundsLeftEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  );

  return logWithdrawFundsLeftEvent;
}

export function createMaximumPointsSetEvent(
  tournamentId: BigInt,
  maxPoints: i32
): MaximumPointsSet {
  const maximumPointsSetEvent = changetype<MaximumPointsSet>(newMockEvent());

  maximumPointsSetEvent.parameters = new Array();

  maximumPointsSetEvent.parameters.push(
    new ethereum.EventParam(
      "tournamentId",
      ethereum.Value.fromUnsignedBigInt(tournamentId)
    )
  );
  maximumPointsSetEvent.parameters.push(
    new ethereum.EventParam(
      "maxPoints",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(maxPoints))
    )
  );

  return maximumPointsSetEvent;
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  const ownershipTransferredEvent = changetype<OwnershipTransferred>(
    newMockEvent()
  );

  ownershipTransferredEvent.parameters = new Array();

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  );
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  );

  return ownershipTransferredEvent;
}

export function createPausedEvent(account: Address): Paused {
  const pausedEvent = changetype<Paused>(newMockEvent());

  pausedEvent.parameters = new Array();

  pausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  );

  return pausedEvent;
}

export function createRoleAdminChangedEvent(
  role: Bytes,
  previousAdminRole: Bytes,
  newAdminRole: Bytes
): RoleAdminChanged {
  const roleAdminChangedEvent = changetype<RoleAdminChanged>(newMockEvent());

  roleAdminChangedEvent.parameters = new Array();

  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  );
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "previousAdminRole",
      ethereum.Value.fromFixedBytes(previousAdminRole)
    )
  );
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newAdminRole",
      ethereum.Value.fromFixedBytes(newAdminRole)
    )
  );

  return roleAdminChangedEvent;
}

export function createRoleGrantedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleGranted {
  const roleGrantedEvent = changetype<RoleGranted>(newMockEvent());

  roleGrantedEvent.parameters = new Array();

  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  );
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  );
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  );

  return roleGrantedEvent;
}

export function createRoleRevokedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleRevoked {
  const roleRevokedEvent = changetype<RoleRevoked>(newMockEvent());

  roleRevokedEvent.parameters = new Array();

  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  );
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  );
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  );

  return roleRevokedEvent;
}

export function createRoundIndexesSetEvent(
  tournamentId: BigInt,
  roundIndexes: Array<i32>
): RoundIndexesSet {
  const roundIndexesSetEvent = changetype<RoundIndexesSet>(newMockEvent());

  roundIndexesSetEvent.parameters = new Array();

  roundIndexesSetEvent.parameters.push(
    new ethereum.EventParam(
      "tournamentId",
      ethereum.Value.fromUnsignedBigInt(tournamentId)
    )
  );
  roundIndexesSetEvent.parameters.push(
    new ethereum.EventParam(
      "roundIndexes",
      ethereum.Value.fromI32Array(roundIndexes)
    )
  );

  return roundIndexesSetEvent;
}

export function createTournamentRoundsCountSetEvent(
  tournamentId: BigInt,
  roundsCount: i32
): TournamentRoundsCountSet {
  const tournamentRoundsCountSetEvent = changetype<TournamentRoundsCountSet>(
    newMockEvent()
  );

  tournamentRoundsCountSetEvent.parameters = new Array();

  tournamentRoundsCountSetEvent.parameters.push(
    new ethereum.EventParam(
      "tournamentId",
      ethereum.Value.fromUnsignedBigInt(tournamentId)
    )
  );
  tournamentRoundsCountSetEvent.parameters.push(
    new ethereum.EventParam(
      "roundsCount",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(roundsCount))
    )
  );

  return tournamentRoundsCountSetEvent;
}

export function createTournamentStageSetEvent(
  tournamentId: BigInt,
  tournamentStage: i32
): TournamentStageSet {
  const tournamentStageSetEvent = changetype<TournamentStageSet>(
    newMockEvent()
  );

  tournamentStageSetEvent.parameters = new Array();

  tournamentStageSetEvent.parameters.push(
    new ethereum.EventParam(
      "tournamentId",
      ethereum.Value.fromUnsignedBigInt(tournamentId)
    )
  );
  tournamentStageSetEvent.parameters.push(
    new ethereum.EventParam(
      "tournamentStage",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(tournamentStage))
    )
  );

  return tournamentStageSetEvent;
}

export function createTrustedForwarderSetEvent(
  oldAddress: Address,
  newAddress: Address
): TrustedForwarderSet {
  const trustedForwarderSetEvent = changetype<TrustedForwarderSet>(
    newMockEvent()
  );

  trustedForwarderSetEvent.parameters = new Array();

  trustedForwarderSetEvent.parameters.push(
    new ethereum.EventParam(
      "oldAddress",
      ethereum.Value.fromAddress(oldAddress)
    )
  );
  trustedForwarderSetEvent.parameters.push(
    new ethereum.EventParam(
      "newAddress",
      ethereum.Value.fromAddress(newAddress)
    )
  );

  return trustedForwarderSetEvent;
}

export function createUnpausedEvent(account: Address): Unpaused {
  const unpausedEvent = changetype<Unpaused>(newMockEvent());

  unpausedEvent.parameters = new Array();

  unpausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  );

  return unpausedEvent;
}

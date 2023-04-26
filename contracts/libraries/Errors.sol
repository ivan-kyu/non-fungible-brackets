// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

library Errors {
    error TournamentsFacet__SportsLeagueNotActive(uint256 sportsLeagueId);
    error TournamentsFacet__TournamentFormatNotActive(uint256 tournamentId);
    error TournamentsFacet__TournamentNotActive(uint256 tournamentId);
    error TournamentsFacet__NotEnoughAmountTokenGatedAccess(
        uint256 poolId,
        uint256 accountBalance,
        address callerAddress
    );
    error TournamentsFacet__PoolAlreadyFull(
        uint256 poolId,
        address callerAddress
    );
    error TournamentsFacet__TournamentClosedForPoolCreation(
        uint256 tournamentId,
        address callerAddress
    );
    error TournamentsFacet__TournamentAlreadyStarted(
        uint256 poolId,
        address callerAddress
    );
    error TournamentsFacet__PoolNotActive(
        uint256 poolId,
        address callerAddress
    );
    error TournamentsFacet__EntryFeeTokenBalanceInsufficient(
        uint256 poolId,
        uint256 tokenBalance,
        address callerAddress
    );
    error TournamentsFacet__BracketDifferentFromExisting(
        uint256 poolId,
        uint256 tokenId,
        address callerAddress
    );
    error TournamentsFacet__TokenAlreadyInPool(
        uint256 _poolId,
        uint256 _tokenId,
        address callerAddress
    );
    error TournamentsFacet__InvalidBracketLength(
        uint256 tournamentId,
        uint256 actualBracketLength,
        uint256 expectedBracketLength
    );
    error TournamentsFacet__PoolDoesntAllowEditableBrackets(
        uint256 poolId,
        address callerAddress
    );
    error TournamentsFacet__CantEnterPoolFromAnotherSeason(
        uint256 poolId,
        uint256 poolSeasonId,
        uint256 currentSeasonId,
        address callerAddress
    );
    error TournamentsFacet__StakeToPlayShouldntHaveEntryFee(
        uint256 tournamentId,
        address callerAddress
    );
    error TournamentsFacet__StakeToPlayShouldHaveAmount(
        uint256 tournamentId,
        address callerAddress
    );
    error TournamentsFacet__InvalidDelegateVaultPairing(
        uint256 poolId,
        address accessTokenColdWalletAddress,
        address callerAddress
    );
    error TournamentsFacet__RewardDistributionNotFound(
        uint256 rewardDistributionId,
        address callerAddress
    );
    error TournamentsFacet__CallerIsNotPoolCreator(
        uint256 poolId,
        address poolCreator,
        address callerAddress
    );
    error OracleFacet__WinnersPerRoundAndRoundsCountLengthsDiffer(
        uint256 winnersPerRoundLength,
        uint8 roundsCount
    );
    error TournamentsFacet__PoolDoesntExist(
        uint256 poolId,
        address callerAddress
    );
}

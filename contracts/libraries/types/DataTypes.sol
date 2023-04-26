// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

library DataTypes {
    // ============ Constructor Args ============

    struct OracleCtrArgs {
        uint8 tournamentStage;
        uint8 bracketLength;
        uint8[] roundIndexes;
    }
    struct RewardDistribution {
        uint256 id;
        string name;
        uint256[] rewardPercentages;
        uint256[] rewardRanges;
        uint16 maxWinnersCount;
    }

    struct CoreFacetArgs {
        address nfbBracketAddress;
        address daoWalletAddress;
        address dgenTokenAddress;
        uint256 nftUpdatePrice;
    }

    struct TournamentsFacetArgs {
        address nfbBracketAddress;
        address delegationRegistryAddress;
    }

    enum PrizeModelType {
        PercentageOfEntryFees,
        SponsoredPrize,
        StakeToPlay
    }

    enum PrizeDistributionType {
        Standard, // Tiered
        WinnerTakesAll
    }

    enum RoyaltyType {
        Percentage
    }

    enum Sport {
        Basketball,
        Football
    }

    struct SportsLeague {
        uint256 id;
        string name; // NCAA, NBA
        Sport sport;
        bool isActive;
    }

    enum TournamentType {
        Brackets,
        RoundRobin,
        Combined
    }

    struct TournamentFormat {
        uint256 id;
        string name;
        TournamentType tournamentType;
        // uint8 bracketLength; // if TournamentType == Brackets // TODO: these three are stored in the oracle for now but could be moved here
        // uint8[] roundIndexes; // if TournamentType == Brackets
        // uint8 tournamentStage; // if TournamentType == Brackets
        bool isActive;
    }

    struct Tournament {
        uint256 id;
        string name; // ex. March Madness
        uint256 sportsLeagueId;
        uint256 tournamentFormatId;
        uint256 openFrom; // tournament start date for pool creation
        uint256 openTo; // tournament end date for pool creation
        uint16 season;
        bool isActive;
    }

    struct Pool {
        uint256 id;
        string name;
        uint256 tournamentId;
        uint256 maxEntries;
        uint256 entries;
        uint256 entryFee;
        address poolCurrencyAddress;
        address accessTokenAddress;
        uint256 accessTokenMinAmount;
        PrizeModelType prizeModelType;
        uint256 stakeToPlayAmount;
        PrizeDistributionType prizeDistributionType;
        uint256 rewardDistributionId;
        RoyaltyType royaltyType;
        uint256 royaltyAmount;
        uint256 totalPrizePoolAmount;
        bool allowEditableBrackets;
        uint256 seasonId;
        bool isFeatured;
        address creatorAddress;
        address poolFundAddress;
    }

    struct AddPoolArgs {
        string name;
        uint256 tournamentId;
        uint256 maxEntries;
        uint256 entryFee;
        address poolCurrencyAddress;
        address accessTokenAddress;
        uint256 accessTokenMinAmount;
        PrizeModelType prizeModelType;
        uint256 stakeToPlayAmount;
        PrizeDistributionType prizeDistributionType;
        uint256 rewardDistributionId;
        RoyaltyType royaltyType;
        uint256 royaltyAmount;
        uint256 sponsoredPrizeAmount;
        bool isFeatured;
        bool allowEditableBrackets;
    }

    struct UpdateBracketVariables {
        uint256 tournamentId;
        uint8 round;
        uint16[] updatedBracket;
        uint8 currRound;
        uint8 startUpdateFromIndex;
    }

    struct FinalsScores {
        uint32 finalsTeamOneScore;
        uint32 finalsTeamTwoScore;
    }

    struct Bracket {
        uint256[] teamsIds;
        uint32 finalsTeamOneScore;
        uint32 finalsTeamTwoScore;
    }

    struct UpdateBracketArgs {
        uint256 _poolId;
        uint256 tokenId;
        string tokenUri;
        Bracket oldBracket;
        Bracket newBracket;
    }

    struct UpdateBracketMemoryVars {
        uint256 tournamentId;
        uint256 tournamentStart;
        uint256 newBracketLen;
        uint256[] oldBracketTeamsIds;
        uint256[] newBracketTeamsIds;
        uint256[] updatedBracketTeamsIds;
        uint256[] oracleBracketTruthResults;
        uint8[] tournamentRoundIndexes;
        uint8[] winnersPerRound;
        uint8 round;
        uint8 currRound;
        uint8 startUpdateFromIndex;
    }
}

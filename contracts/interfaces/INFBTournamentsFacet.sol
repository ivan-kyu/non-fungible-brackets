// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {DataTypes} from "../libraries/types/DataTypes.sol";

interface INFBTournamentsFacet {
    event LogAddSportsLeague(
        uint256 indexed sportsLeagueId,
        string name,
        uint256 sport,
        address callerAddress
    );
    event LogDisableSportsLeague(
        uint256 indexed sportsLeagueId,
        address callerAddress
    );
    event LogAddTournamentFormat(
        uint256 indexed tournamentFormatId,
        string name,
        uint256 tournamentType,
        address callerAddress
    );
    event LogDisableTournamentFormat(
        uint256 indexed tournamentId,
        address callerAddress
    );
    event LogAddTournament(
        uint256 indexed tournamentId,
        uint256 indexed sportsLeagueId,
        string name,
        uint256 tournamentFormatId,
        uint16 season,
        uint256 openFrom,
        uint256 openTo,
        address callerAddress
    );
    event LogAddPool(
        uint256 indexed poolId,
        uint256 indexed tournamentId,
        string name,
        uint256 entryFee,
        uint256 prizeModelType,
        uint256 stakeToPlayAmount,
        address accessTokenAddress,
        uint256 rewardDistributionId,
        DataTypes.RoyaltyType royaltyType,
        uint256 royaltyAmount,
        bool allowEditableBrackets,
        address poolCurrencyAddress,
        address fundingAddress,
        address callerAddress
    );
    event LogPoolEntered(
        uint256 indexed poolId,
        uint256 indexed tokenId,
        address callerAddress
    );
    event LogBracketUpdated(
        DataTypes.Bracket bracket,
        address callerAddress,
        uint256 poolId,
        uint256 tokenId,
        uint8 startUpdateFromIndex
    );
    event DelegateSuccessful(
        uint256 indexed poolId,
        address coldWalletAddress,
        address callerAddress
    );

    function initializeTournaments(DataTypes.TournamentsFacetArgs memory _args)
        external;

    function addSportsLeague(string calldata name, DataTypes.Sport sport)
        external;

    function disableSportsLeague(uint256 sportsLeagueId) external;

    function addTournamentFormat(
        string calldata name,
        DataTypes.TournamentType tournamentType //,
        // uint8 bracketLength,
        // uint8[] memory roundIndexes,
        // uint8 tournamentStage
    ) external;

    function disableTournamentFormat(uint256 tournamentId) external;

    function addTournament(
        uint256 sportsLeagueId,
        uint256 tournamentFormatId,
        string calldata name, // ex. March Madness
        uint256 openFrom, // tournament start date for pool creation
        uint256 openTo, // tournament end date for pool creation
        uint16 season
    ) external;

    function addPool(DataTypes.AddPoolArgs calldata _args) external;

    function enterPool(
        uint256 _poolId,
        uint256 _tokenId,
        DataTypes.Bracket memory _bracket,
        string memory _tokenUri,
        bool _isEditableBracket,
        address _accessTokenColdWalletAddress
    ) external;

    function updateBracket(DataTypes.UpdateBracketArgs memory args) external;
}

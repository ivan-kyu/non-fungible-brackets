// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {DataTypes} from "../libraries/types/DataTypes.sol";

interface INFBOracleFacet {
    event TournamentStageSet(uint256 tournamentId, uint8 tournamentStage);
    event TournamentRoundsCountSet(uint256 tournamentId, uint8 roundsCount);
    event BracketLengthSet(uint256 tournamentId, uint8 bracketLength);
    event MaximumPointsSet(uint256 tournamentId, uint16 maxPoints);
    event RoundIndexesSet(uint256 tournamentId, uint8[] roundIndexes);

    event LogRoundUpdated(
        address from,
        uint256 tournamentId,
        uint8 newRound,
        uint8 newRoundIndex
    );
    event LogRoundReverted(address from, uint8 newRound, uint8 newRoundIndex);
    event LogBracketResultsUpdated(
        address from,
        uint256[] teamsIds,
        uint32 finalsTeamOneScore,
        uint32 finalsTeamTwoScore
    );
    event LogSetRoundBounds(
        uint256 tournamentId,
        uint8 round,
        uint256 startRound,
        uint256 endRound
    );
    event LogTournamentSeasonUpdated(
        uint256 _sportsLeagueId,
        uint256 _seasonId
    );

    function initializeOracle() external;

    function setSportSeason(uint256 _sportsLeagueId, uint256 _seasonId)
        external;

    function setTournamentStage(uint256 tournamentId, uint8 _tournamentStage)
        external;

    function setRounds(
        uint256 _tournamentId,
        uint8 _roundsCount,
        uint8[] memory _winnersPerRound
    ) external;

    function setBracketLength(uint256 _tournamentId, uint8 _bracketLength)
        external;

    function setMaximumPoints(uint256 _tournamentId, uint16 _maxPoints)
        external;

    function getMaximumPoints(uint256 _tournamentId)
        external
        view
        returns (uint16);

    function getTournamentRoundIndexes(uint256 _tournamentId)
        external
        view
        returns (uint8[] memory);

    function getBracketLength(uint256 _tournamentId)
        external
        view
        returns (uint8);

    function getBracketResults(uint256 _tournamentId, uint256 index)
        external
        view
        returns (uint256);

    function setRoundIndexes(
        uint256 _tournamentId,
        uint8[] calldata _roundIndexes
    ) external;

    function updateBracketResults(
        uint256 _tournamentId,
        DataTypes.Bracket memory _newBracketResults
    ) external;

    function calcBracketPoints(
        uint256 _tournamentId,
        DataTypes.Bracket memory bracket
    ) external view returns (uint8, uint8);

    function updateRound(uint256 _tournamentId) external;

    function setRoundBounds(
        uint256 _tournamentId,
        uint8 roundToSet,
        uint256 startRound,
        uint256 endRound
    ) external;

    function getRoundsBounds(
        uint256 _tournamentId,
        uint8 round,
        uint8 startRound
    ) external view returns (uint256);

    function getRound(uint256 _tournamentId) external view returns (uint8);

    function getRoundIndex(uint256 _tournamentId) external view returns (uint8);

    function revertRoundInEmergency(uint256 _tournamentId) external;

    function calcPointsWillBeLost(
        uint256 _tournamentId,
        DataTypes.Bracket memory bracket
    ) external view returns (uint8);

    function getBracketPotential(
        uint256 _tournamentId,
        DataTypes.Bracket memory bracket
    ) external view returns (uint16);
}

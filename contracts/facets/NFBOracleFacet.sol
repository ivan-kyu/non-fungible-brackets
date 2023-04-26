// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {LibOwnership} from "../libraries/LibOwnership.sol";
import {LibPausable} from "../libraries/LibPausable.sol";
import {LibAccessControl} from "../libraries/LibAccessControl.sol";
import {LibNFBOracleStorage} from "../libraries/LibNFBOracleStorage.sol";
import {LibNFBTournamentsStorage} from "../libraries/LibNFBTournamentsStorage.sol";
import {INFBOracleFacet} from "../interfaces/INFBOracleFacet.sol";
import {DataTypes} from "../libraries/types/DataTypes.sol";
import {Errors} from "../libraries/Errors.sol";

contract NFBOracleFacet is INFBOracleFacet {
    /**
     * @dev Source of truth for all calculations. Index of the bracket represents the match starting from 0 up to 66. The element is the winning team from that match.
     * TODO might need to have a different approach. We need to think of a way to calculate correct result for each bracket in `calcBracketPoints`. We could not be using the `roundIndex`
     * as it gets updated after each round and its not reliable. Might need to have another state variable which indicates for a certain match index how many points are granted
     */

    // ============ Constructor ============
    function initializeOracle() external {}

    function getBracketResults(uint256 _tournamentId, uint256 index)
        public
        view
        returns (uint256)
    {
        return
            LibNFBOracleStorage
                .dstorage()
                .tournamentToBracketResults[_tournamentId]
                .teamsIds[index];
    }

    function getTournamentStage(uint256 _tournamentId)
        public
        view
        returns (uint8)
    {
        return
            LibNFBOracleStorage.dstorage().tournamentToTournamentStage[
                _tournamentId
            ];
    }

    function getTournamentRoundIndexes(uint256 _tournamentId)
        public
        view
        returns (uint8[] memory)
    {
        return
            LibNFBOracleStorage.dstorage().tournamentToRoundIndexes[
                _tournamentId
            ];
    }

    function getTournamentBracketLenght(uint256 _tournamentId)
        public
        view
        returns (uint8)
    {
        return
            LibNFBOracleStorage.dstorage().tournamentToBracketLength[
                _tournamentId
            ];
    }

    function getRound(uint256 _tournamentId) public view returns (uint8) {
        return LibNFBOracleStorage.dstorage().tournamentToRound[_tournamentId];
    }

    function getRoundIndex(uint256 _tournamentId) public view returns (uint8) {
        return
            LibNFBOracleStorage.dstorage().tournamentToRoundIndex[
                _tournamentId
            ];
    }

    // @notice Gets bracket length
    /// @param _tournamentId _tournamentId
    function getBracketLength(uint256 _tournamentId)
        external
        view
        returns (uint8)
    {
        return
            LibNFBOracleStorage.dstorage().tournamentToBracketLength[
                _tournamentId
            ];
    }

    // @notice Sets the current season of a given tournament
    /// @param _tournamentId sportsLeagueId from TournamentsFacet
    /// @param _seasonId seasonId could be a custom number (ex. 2023, 2024, 20231 - first season of the year, 20232 - second season of the year)
    function setSportSeason(uint256 _tournamentId, uint256 _seasonId) external {
        LibOwnership.enforceIsContractOwner();

        LibNFBTournamentsStorage.Storage
            storage dsTournaments = LibNFBTournamentsStorage.dstorage();

        require(
            dsTournaments.tournaments[_tournamentId].isActive,
            "OracleFacet: Tournament inactive!"
        );
        uint256 currentSeasonId = LibNFBOracleStorage
            .dstorage()
            .tournamentToTournamentSeasonId[_tournamentId];
        require(
            _seasonId > currentSeasonId,
            "NFB Oracle: Season cannot be rolled back"
        );

        LibNFBOracleStorage.dstorage().tournamentToTournamentSeasonId[
                _tournamentId
            ] = _seasonId;

        emit LogTournamentSeasonUpdated(_tournamentId, _seasonId);
    }

    // @notice Sets tournament stage
    /// @param _tournamentStage tournament stage
    function setTournamentStage(uint256 _tournamentId, uint8 _tournamentStage)
        external
    {
        LibOwnership.enforceIsContractOwner();

        LibNFBOracleStorage.dstorage().tournamentToTournamentStage[
                _tournamentId
            ] = _tournamentStage;
        emit TournamentStageSet(_tournamentId, _tournamentStage);
    }

    // @notice Sets tournament stage
    /// @param _tournamentId tournamentId
    /// @param _roundsCount how many rounds the tournament has
    /// @param winnersPerRound number of winners relatively per each round
    function setRounds(
        uint256 _tournamentId,
        uint8 _roundsCount,
        uint8[] memory winnersPerRound
    ) external {
        LibOwnership.enforceIsContractOwner();

        if (winnersPerRound.length != _roundsCount) {
            revert Errors
                .OracleFacet__WinnersPerRoundAndRoundsCountLengthsDiffer(
                    winnersPerRound.length,
                    _roundsCount
                );
        }

        LibNFBOracleStorage.dstorage().tournamentToWinnersPerRound[
                _tournamentId
            ] = winnersPerRound;

        LibNFBOracleStorage.dstorage().tournamentToRoundsCount[
            _tournamentId
        ] = _roundsCount;
        emit TournamentRoundsCountSet(_tournamentId, _roundsCount);
    }

    // @notice Sets bracket length
    /// @param _bracketLength bracket length
    function setBracketLength(uint256 _tournamentId, uint8 _bracketLength)
        external
    {
        LibOwnership.enforceIsContractOwner();

        LibNFBOracleStorage.dstorage().tournamentToBracketLength[
                _tournamentId
            ] = _bracketLength;

        uint256[] memory teamsIds = new uint256[](_bracketLength);

        LibNFBOracleStorage.dstorage().tournamentToBracketResults[
            _tournamentId
        ] = DataTypes.Bracket(teamsIds, 0, 0);
        emit BracketLengthSet(_tournamentId, _bracketLength);
    }

    // @notice Gets tournament bracket max points
    /// @param _tournamentId _tournamentId
    function getMaximumPoints(uint256 _tournamentId)
        external
        view
        returns (uint16)
    {
        return
            LibNFBOracleStorage.dstorage().tournamentMaxPoints[_tournamentId];
    }

    // @notice Sets tournament bracket max points
    /// @param _tournamentId _tournamentId
    /// @param _maxPoints bracket maximum points
    function setMaximumPoints(uint256 _tournamentId, uint16 _maxPoints)
        external
    {
        LibOwnership.enforceIsContractOwner();

        LibNFBOracleStorage.dstorage().tournamentMaxPoints[
            _tournamentId
        ] = _maxPoints;

        emit MaximumPointsSet(_tournamentId, _maxPoints);
    }

    // @notice Sets round indexes
    /// @param _roundIndexes round indexes
    function setRoundIndexes(
        uint256 _tournamentId,
        uint8[] memory _roundIndexes
    ) external {
        LibOwnership.enforceIsContractOwner();

        LibNFBOracleStorage.dstorage().tournamentToRoundIndexes[
                _tournamentId
            ] = _roundIndexes;

        LibNFBOracleStorage.dstorage().tournamentToRound[_tournamentId] = 1;
        LibNFBOracleStorage.dstorage().tournamentToRoundIndex[
            _tournamentId
        ] = 1;
        LibNFBOracleStorage.dstorage().START = 0;
        LibNFBOracleStorage.dstorage().END = 1;
        emit RoundIndexesSet(_tournamentId, _roundIndexes);
    }

    function onlyMatchingLengths(
        uint256 _tournamentId,
        DataTypes.Bracket memory bracket
    ) internal view {
        require(
            bracket.teamsIds.length ==
                LibNFBOracleStorage.dstorage().tournamentToBracketLength[
                    _tournamentId
                ],
            "NFBO: lengths don't match"
        );
    }

    /**
     * @dev Sets start and end timestamp of the current round.
     * @param startRound uint256 representing the start of the current round
     * @param endRound uint256 representing the end of the current round
     * Requirements:
     *
     * - `startRound` must be passed.
     * - `endRound` must be passed.
     * -  only owner of the contract can call.
     *
     * Emits a {LogSetRoundBounds} event.
     */
    function setRoundBounds(
        uint256 _tournamentId,
        uint8 roundToSet,
        uint256 startRound,
        uint256 endRound
    ) public {
        LibAccessControl.onlyRole(LibAccessControl.updaterRole());
        uint8 roundsCount = LibNFBOracleStorage
            .dstorage()
            .tournamentToRoundsCount[_tournamentId];
        require(
            roundToSet >= 1 && roundToSet <= roundsCount,
            "NFBO: Invalid round"
        );
        require(startRound > block.timestamp, "NFBO: Invalid start round");
        require(startRound < endRound, "NFBO: Invalid end round");

        LibNFBOracleStorage.Storage storage dsNFBOracle = LibNFBOracleStorage
            .dstorage();

        require(
            roundToSet == 1 ||
                startRound >
                dsNFBOracle.tournamentToRoundsBounds[_tournamentId][
                    roundToSet - 1
                ][1], // if not in first round, check whether start of the current round is higher than the end of previous
            "NFBO: Invalid round params"
        );

        dsNFBOracle.tournamentToRoundsBounds[_tournamentId][roundToSet][
                dsNFBOracle.START
            ] = startRound;
        dsNFBOracle.tournamentToRoundsBounds[_tournamentId][roundToSet][
                dsNFBOracle.END
            ] = endRound;

        emit LogSetRoundBounds(_tournamentId, roundToSet, startRound, endRound);
    }

    /**
     * @dev Updates the score multiplier, used for calculation of points for a correct prediction. Score multiplier is updated after each round finishes.
     * Requirements:
     *
     * - only owner of the contract can call.
     *
     * Emits a {LogRoundUpdated} event.
     */
    function updateRound(uint256 _tournamentId) external {
        LibPausable.enforceNotPaused();
        LibAccessControl.onlyRole(LibAccessControl.updaterRole());

        LibNFBOracleStorage.Storage storage dsNFBOracle = LibNFBOracleStorage
            .dstorage();

        require(
            dsNFBOracle.tournamentToRound[_tournamentId] <
                dsNFBOracle.tournamentToRoundIndexes[_tournamentId].length,
            "NFBO: already in last round"
        );

        dsNFBOracle.tournamentToRound[_tournamentId]++;
        dsNFBOracle.tournamentToRoundIndex[_tournamentId] *= 2;

        emit LogRoundUpdated(
            msg.sender,
            _tournamentId,
            dsNFBOracle.tournamentToRound[_tournamentId],
            dsNFBOracle.tournamentToRoundIndex[_tournamentId]
        );
    }

    /**
     * @dev Gets start and end timestamp of the current round.
     * @param round uint8 representing the round
     * @param startRound uint256 representing the start of the specified round
     * Requirements:
     *
     * - `round` must be passed.
     * - `startRound` must be passed.
     */
    function getRoundsBounds(
        uint256 _tournamentId,
        uint8 round,
        uint8 startRound
    ) external view returns (uint256) {
        return
            LibNFBOracleStorage.dstorage().tournamentToRoundsBounds[
                _tournamentId
            ][round][startRound];
    }

    /**
     * @dev Triggered by an external service so we get the correct sports data
     * @param _newBracketResults - used to override current `bracketResults` with the most up to date state of the tournament.
     * Requirements:
     *
     * - only owner of the contract can call.
     *
     * Emits a {LogBracketResultsUpdated} event.
     */
    function updateBracketResults(
        uint256 _tournamentId,
        DataTypes.Bracket memory _newBracketResults
    ) external {
        LibPausable.enforceNotPaused();
        onlyMatchingLengths(_tournamentId, _newBracketResults);
        LibAccessControl.onlyRole(LibAccessControl.updaterRole());
        LibNFBOracleStorage.dstorage().tournamentToBracketResults[
                _tournamentId
            ] = _newBracketResults;

        emit LogBracketResultsUpdated(
            msg.sender,
            _newBracketResults.teamsIds,
            _newBracketResults.finalsTeamOneScore,
            _newBracketResults.finalsTeamTwoScore
        );
    }

    //compare to the matches[], where we have a match update the score by increasing it with roundIndex.
    /**
     * @dev Calculates a given bracket result by comparing it to the latest state of the tournament from `bracketResults`. When 2 elements positioned at the same index are equal, points are added.
     * @param bracket - which we are going to calculate the result against.
     * @return `bracketPoints` and `roundPoints` respectively the total points for the bracket and the points generated through the round.
     * Requirements:
     *
     * `bracket` length should be equal to `bracketLength`
     */
    function calcBracketPoints(
        uint256 _tournamentId,
        DataTypes.Bracket memory bracket
    ) public view returns (uint8, uint8) {
        onlyMatchingLengths(_tournamentId, bracket);
        onlyMatchingLengths(
            _tournamentId,
            LibNFBOracleStorage.dstorage().tournamentToBracketResults[
                _tournamentId
            ]
        );
        return LibNFBOracleStorage.calcBracketPoints(_tournamentId, bracket);
    }

    /**
     * @dev Calculates a given bracket points which are lost due to lost match in previous round.
     * @param bracket - which we are going to calculate the points lost against.
     * @return bracketPoints
     * Requirements:
     *
     * `bracket` length should be equal to `bracketLength`
     */
    function calcPointsWillBeLost(
        uint256 _tournamentId,
        DataTypes.Bracket memory bracket
    ) public view returns (uint8) {
        onlyMatchingLengths(_tournamentId, bracket);
        LibNFBOracleStorage.Storage storage dsNFBOracle = LibNFBOracleStorage
            .dstorage();

        if (
            dsNFBOracle.tournamentToRound[_tournamentId] == 1 ||
            dsNFBOracle.tournamentToRound[_tournamentId] ==
            dsNFBOracle.tournamentToRoundIndexes[_tournamentId].length
        ) {
            return 0; // Return 0 points if we are in the first or last round
        }

        uint8 pointsLost = 0;
        uint8 startIndex = dsNFBOracle.tournamentToRoundIndexes[_tournamentId][
            dsNFBOracle.tournamentToRound[_tournamentId] - 2
        ];
        uint8 roundWinners = dsNFBOracle.tournamentToTournamentStage[
            _tournamentId
        ] / (dsNFBOracle.tournamentToRoundIndex[_tournamentId] / 2);

        for (uint8 i = startIndex; i < startIndex + roundWinners; i++) {
            if (
                bracket.teamsIds[i] ==
                dsNFBOracle.tournamentToBracketResults[_tournamentId].teamsIds[
                    i
                ]
            ) {
                continue;
            }

            uint8 currentActiveRound = dsNFBOracle.tournamentToRound[
                _tournamentId
            ] - 1;
            uint8 currActiveRoundIndex = dsNFBOracle.tournamentToRoundIndex[
                _tournamentId
            ];

            for (
                uint8 k = currentActiveRound;
                k < dsNFBOracle.tournamentToRoundIndexes[_tournamentId].length;
                k++
            ) {
                uint8 currStartIndex = dsNFBOracle.tournamentToRoundIndexes[
                    _tournamentId
                ][currentActiveRound];
                uint8 currRoundWinners = dsNFBOracle
                    .tournamentToTournamentStage[_tournamentId] /
                    currActiveRoundIndex;

                for (uint8 j = 0; j < currRoundWinners; j++) {
                    if (
                        bracket.teamsIds[currStartIndex + j] ==
                        bracket.teamsIds[i]
                    ) {
                        pointsLost += currActiveRoundIndex;
                    }
                }

                currentActiveRound += 1;
                currActiveRoundIndex *= 2;
            }
        }

        return pointsLost;
    }

    /**
     * @dev Get potentially the highest possible score which this bracket is able to accumulate based on it's current result and how many winning teams in the bracket have left in the tournament
     * @param bracket array of matches that are going to be evaluated along with the last two scores
     * @return bracketPoints highest possible score which this bracket is able to accumulate
     */
    function getBracketPotential(
        uint256 _tournamentId,
        DataTypes.Bracket memory bracket
    ) external view returns (uint16) {
        onlyMatchingLengths(_tournamentId, bracket);

        LibNFBOracleStorage.Storage storage dsNFBOracle = LibNFBOracleStorage
            .dstorage();

        uint8 roundsCount = LibNFBOracleStorage
            .dstorage()
            .tournamentToRoundsCount[_tournamentId];

        if (dsNFBOracle.tournamentToRound[_tournamentId] == 1) {
            return
                LibNFBOracleStorage.dstorage().tournamentMaxPoints[
                    _tournamentId
                ]; // Return max points if first round hasn't started or results aren't updated.
        }
        if (dsNFBOracle.tournamentToRound[_tournamentId] == roundsCount) {
            (uint8 finalRoundBracketPoints, ) = calcBracketPoints(
                _tournamentId,
                bracket
            );

            return finalRoundBracketPoints; // Return the points which the bracket has generated in the last round.
        }

        uint8 roundToCalculateFrom = dsNFBOracle
            .tournamentToBracketResults[_tournamentId]
            .teamsIds[
                dsNFBOracle.tournamentToRoundIndexes[_tournamentId][
                    dsNFBOracle.tournamentToRound[_tournamentId] - 1
                ]
            ] == 0
            ? dsNFBOracle.tournamentToRound[_tournamentId]
            : dsNFBOracle.tournamentToRound[_tournamentId] + 1;

        (uint8 bracketPoints, ) = calcBracketPoints(_tournamentId, bracket);
        uint16 pointsWillBeLost = calcPointsWillBeLost(_tournamentId, bracket); // Points which will be lost from teams which have lost earlier than expected in the tournament.
        uint16 maxPointsPrevRounds = (roundToCalculateFrom - 1) * 32; // Multiply max points of each round (32) by the rounds passed.
        uint16 pointsLostPrevRounds = maxPointsPrevRounds - bracketPoints;

        return
            LibNFBOracleStorage.dstorage().tournamentMaxPoints[_tournamentId] -
            pointsLostPrevRounds -
            pointsWillBeLost;
    }

    /**
     * @dev this functions is intended to never be used, but as we heavily rely on live scores we'd need an emergency function on how to revert back the round,
     * in order to correctly emit all scores from the round we are currently in. As the rounds are being updated automatically, we have to have an approach to revert
     * in case of a mistake in a live event, or if an event is completed after the predicted end of the round has ended.
     */
    function revertRoundInEmergency(uint256 _tournamentId) public {
        LibPausable.enforcePaused();
        LibAccessControl.onlyRole(LibAccessControl.updaterRole());

        LibNFBOracleStorage.Storage storage dsNFBOracle = LibNFBOracleStorage
            .dstorage();

        require(
            dsNFBOracle.tournamentToRound[_tournamentId] > 1,
            "NFBO: still in first round"
        );

        dsNFBOracle.tournamentToRound[_tournamentId] -= 1;
        dsNFBOracle.tournamentToRoundIndex[_tournamentId] /= 2;

        emit LogRoundReverted(
            msg.sender,
            dsNFBOracle.tournamentToRound[_tournamentId],
            dsNFBOracle.tournamentToRoundIndex[_tournamentId]
        );
    }
}

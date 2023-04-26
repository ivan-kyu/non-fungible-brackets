// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./LibDiamond.sol";
import "./types/DataTypes.sol";

library LibNFBOracleStorage {
    bytes32 constant STORAGE_POSITION =
        keccak256("diamond.standard.nfb.oracle.storage");

    struct Storage {
        mapping(uint256 => DataTypes.Bracket) tournamentToBracketResults; // Array of `n` elements representing the winner from the past rounds.
        mapping(uint256 => uint8[]) tournamentToRoundIndexes; // Array of indexes from where each round starts.
        mapping(uint256 => uint8) tournamentToBracketLength; // Number representing the required length for the bracket.
        mapping(uint256 => uint8) tournamentToRound; // Starts from 1. Updated after each round has finished.
        mapping(uint256 => uint8) tournamentToRoundsCount; // tournamentId -> roundsCount
        mapping(uint256 => uint8) tournamentToRoundIndex; // Starts from 1. Updated after each round has finished, serves as multiplier for getting the points for each bracket and as divider for getting the winners for each round.
        mapping(uint256 => uint8) tournamentToTournamentStage; // Divided by `roundIndex` for getting the winners for each round.
        mapping(uint256 => uint8[]) tournamentToWinnersPerRound;
        mapping(uint256 => uint16) tournamentMaxPoints;
        uint8 START;
        uint8 END;
        // tournamentId => round => (startRound => endRound)
        mapping(uint256 => mapping(uint8 => mapping(uint8 => uint256))) tournamentToRoundsBounds;
        mapping(uint256 => uint256) tournamentToTournamentSeasonId;
    }

    /// @dev The diamond storage for the Oracle
    /// @return ds The oracle diamond storage pointer
    function dstorage() internal pure returns (Storage storage ds) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
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
        uint256 tournamentId,
        DataTypes.Bracket memory bracket
    ) internal view returns (uint8, uint8) {
        uint8 bracketPoints = 0;
        uint8 roundPoints = 0;
        uint8 currentRound = 0;
        uint8 currentRoundIndex = 1;

        Storage storage ds = dstorage();

        // for each round
        for (uint256 i = 0; i < ds.tournamentToRound[tournamentId]; i++) {
            uint8 startIndex = ds.tournamentToRoundIndexes[tournamentId][
                currentRound
            ];
            uint8 roundWinners = ds.tournamentToTournamentStage[tournamentId] /
                currentRoundIndex;
            uint8 currentActiveRound = ds.tournamentToRound[tournamentId] - 1;

            for (uint8 k = 0; k < roundWinners; k++) {
                if (
                    bracket.teamsIds[startIndex + k] !=
                    ds.tournamentToBracketResults[tournamentId].teamsIds[
                        startIndex + k
                    ]
                ) {
                    continue;
                }

                bracketPoints += currentRoundIndex;

                if (i == currentActiveRound) {
                    roundPoints += currentRoundIndex;
                }
            }

            currentRound += 1;
            currentRoundIndex *= 2;
        }

        return (bracketPoints, roundPoints);
    }
}

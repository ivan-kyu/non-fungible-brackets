// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {DataTypes} from "../libraries/types/DataTypes.sol";

interface INFBCoreFacet {
    event LogBracketScoreUpdated(
        uint256 tokenId,
        uint16 roundScore,
        uint16 score,
        uint8 round,
        address owner
    );
    event LogBracketScoresUpdated(address triggeredBy);

    event TrustedForwarderSet(address oldAddress, address newAddress);

    event LogNftUpdatePriceUpdated(
        uint256 newNftUpdatePrice,
        address callerAddress
    );

    // Emitted once the pause is triggered by an `account`
    event Paused(address indexed account);
    // Emitted once the pause is lifted by an `account`
    event Unpaused(address indexed account);

    function initializeCore(DataTypes.CoreFacetArgs memory _args) external;

    function setTrustedForwarder(address _newTrustedForwarder) external;

    function getTop(uint256 _poolId) external view returns (uint256[] memory);

    function updateBracketScores(
        uint256 _poolId,
        uint32 actualFinalsScore,
        uint256[] memory tokenIds
    ) external;

    function emitBracketScores(
        uint256 _tournamentId,
        uint256[] memory tokenIds,
        DataTypes.Bracket[] memory brackets
    ) external;

    function getNftScores(uint256 tokenId) external view returns (uint8);

    function getNftUpdatedInRound(uint8 round, uint256 tokenId)
        external
        view
        returns (bool);

    function isPaused() external view returns (bool);

    function pause() external;

    function unpause() external;
}

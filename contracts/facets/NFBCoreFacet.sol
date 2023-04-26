// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";
import {LibOwnership} from "../libraries/LibOwnership.sol";
import {LibPausable} from "../libraries/LibPausable.sol";
import {LibAccessControl} from "../libraries/LibAccessControl.sol";
import {LibNFBCoreStorage} from "../libraries/LibNFBCoreStorage.sol";
import {LibNFBOracleStorage} from "../libraries/LibNFBOracleStorage.sol";
import {LibNFBRewardPoolStorage} from "../libraries/LibNFBRewardPoolStorage.sol";
import {LibNFBTournamentsStorage} from "../libraries/LibNFBTournamentsStorage.sol";
import {INFBCoreFacet} from "../interfaces/INFBCoreFacet.sol";
import {DataTypes} from "../libraries/types/DataTypes.sol";
import {NFBBracket} from "../NFBBracket.sol";
import {LibPausable} from "../libraries/LibPausable.sol";
import {LibSecurityStorage} from "../libraries/LibSecurityStorage.sol";

contract NFBCoreFacet is INFBCoreFacet {
    using SafeMath for uint256;

    modifier nonReentrant() {
        LibSecurityStorage.nonReentrantBefore();
        _;
        LibSecurityStorage.nonReentrantAfter();
    }

    // Shorten the contract storage call
    function dstorage()
        internal
        pure
        returns (LibNFBCoreStorage.Storage storage ds)
    {
        return LibNFBCoreStorage.dstorage();
    }

    function onlyWithTokenUri(string memory tokenUri) private pure {
        require(bytes(tokenUri).length != 0, "NFBR: Only with TokenUri");
    }

    function onlyWithCorrectLength(
        uint256 _tournamentId,
        DataTypes.Bracket memory bracket
    ) private view {
        uint8 bracketLength = LibNFBOracleStorage
            .dstorage()
            .tournamentToBracketLength[_tournamentId];

        require(
            bracket.teamsIds.length == bracketLength,
            "NFBR: Invalid bracket length"
        );
    }

    function onlyMatchingLengths(uint256 tokenIdsLength, uint256 bracketsLength)
        private
        pure
    {
        require(
            tokenIdsLength == bracketsLength && tokenIdsLength > 0,
            "NFBR: Not a valid length"
        );
    }

    function onlyMatchingHashes(bytes32 currHash, bytes32 storedHash)
        private
        pure
    {
        require(currHash == storedHash, "NFBR: Not a valid bracket");
    }

    function initializeCore(DataTypes.CoreFacetArgs memory _args) external {
        LibOwnership.enforceIsContractOwner();
        require(
            _args.nfbBracketAddress != address(0),
            "NFBCoreFacet: Invalid Bracket address"
        );
        require(
            _args.daoWalletAddress != address(0),
            "NFBCoreFacet: Invalid DAO address"
        );
        require(
            _args.dgenTokenAddress != address(0),
            "NFBCoreFacet: Invalid DGEN token address"
        );
        dstorage().nfbBracketAddress = _args.nfbBracketAddress;
        dstorage().daoWalletAddress = _args.daoWalletAddress;
        dstorage().dgenTokenAddress = _args.dgenTokenAddress;
        dstorage().nftUpdatePrice = _args.nftUpdatePrice;
    }

    function getNftUpdatedTournament(uint256 _tokenId)
        external
        view
        returns (bool)
    {
        return dstorage().nftUpdatedTournament[_tokenId];
    }

    /**
     * @dev Updates the NFT update price
     * @param _newNftUpdatePrice new NFT update price
     */
    function updateNftUpdatePrice(uint256 _newNftUpdatePrice) external {
        LibOwnership.enforceIsContractOwner();
        dstorage().nftUpdatePrice = _newNftUpdatePrice;

        emit LogNftUpdatePriceUpdated(
            _newNftUpdatePrice,
            LibNFBCoreStorage._msgSender()
        );
    }

    /**
     * @dev Checks if `teamID` is included in the last round emitted winners from `NFBOracle`.
     * @param teamID uint16 representing the id which is checked in the last round emitted winners from `NFBOracle`.
     * @param prevRoundStart uint8 representing the index where the last round starts.
     * @param prevRoundEnd uint8 representing the index where the last round ends.
     */
    function checkIdInLastRoundResults(
        uint256 tournamentId,
        uint16 teamID,
        uint8 prevRoundStart,
        uint8 prevRoundEnd
    ) private view returns (bool) {
        for (uint256 i = prevRoundStart; i <= prevRoundEnd; i++) {
            if (
                LibNFBOracleStorage
                    .dstorage()
                    .tournamentToBracketResults[tournamentId]
                    .teamsIds[i] == teamID
            ) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Returns top `poolWinnersCount` tokenIds with maximum length of `maximumWinnersCount`.
     * @return uint16[] memory
     */
    function getTop(uint256 _poolId) public view returns (uint256[] memory) {
        return LibNFBCoreStorage.getTop(_poolId);
    }

    /**
     * @dev Checks if bracket is among the winners `n` winners. Keeps descending sorted array.
     * @param tokenIds array of ids which is are going to be included in `poolWinningBrackets`
     *
     * Requirements:
     *
     * - must be called by the owner of the contract
     * - the hash of the bracket in `brackets` array must be equal to the hash stored in the contract upon creation
     *
     * emits a {LogBracketScoresUpdated} event.
     */
    function updateBracketScores(
        uint256 _poolId,
        uint32 actualFinalsScoreSum,
        uint256[] memory tokenIds
    ) external {
        LibOwnership.enforceIsContractOwner();

        uint256 tournamentId = LibNFBTournamentsStorage.getTournamentIdByPoolId(
            _poolId
        );

        DataTypes.Pool memory pool = LibNFBTournamentsStorage.getPoolById(
            _poolId
        );

        uint8 round = LibNFBOracleStorage.dstorage().tournamentToRound[
            tournamentId
        ];
        uint8 roundsCount = LibNFBOracleStorage
            .dstorage()
            .tournamentToRoundsCount[tournamentId];

        DataTypes.RewardDistribution
            memory rewardDistribution = LibNFBRewardPoolStorage
                .getRewardDistribution(pool.rewardDistributionId);

        uint16 maximumWinnersCount = rewardDistribution.maxWinnersCount;

        require(
            (round == roundsCount) &&
                (block.timestamp >
                    LibNFBOracleStorage.dstorage().tournamentToRoundsBounds[
                        tournamentId
                    ][roundsCount][1]) &&
                (LibNFBOracleStorage.dstorage().tournamentToRoundsBounds[
                    tournamentId
                ][roundsCount][1] > 0),
            "NFBR: Tournament hasn't ended"
        );

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];

            if (dstorage().nftUpdatedTournament[tokenId] || tokenId == 0)
                continue;

            if (!dstorage().nftUpdatedInRound[round][tokenId]) continue;

            if (isScoreLowerThanLast(_poolId, tokenId)) continue;

            dstorage().nftUpdatedTournament[tokenId] = true;

            if (dstorage().poolWinnersCount[_poolId] < maximumWinnersCount) {
                dstorage().poolWinnersCount[_poolId]++;
            }

            insertTokenId(
                _poolId,
                tokenId,
                dstorage().nftScores[tokenId],
                actualFinalsScoreSum
            );
        }

        emit LogBracketScoresUpdated(msg.sender);
    }

    /**
     * @dev Checks if `poolWinningBrackets` array is fulfilled and checks if the bracket passed has lower score than the last winning bracket.
     * @param tokenId uint256 respresenting the current tokenId
     * @return bool
     */
    function isScoreLowerThanLast(uint256 poolId, uint256 tokenId)
        private
        view
        returns (bool)
    {
        DataTypes.Pool memory pool = LibNFBTournamentsStorage.getPoolById(
            poolId
        );

        DataTypes.RewardDistribution
            memory rewardDistribution = LibNFBRewardPoolStorage
                .getRewardDistribution(pool.rewardDistributionId);

        return
            dstorage().poolWinnersCount[poolId] ==
            rewardDistribution.maxWinnersCount &&
            dstorage().nftScores[tokenId] <
            dstorage().nftScores[
                dstorage().poolWinningBrackets[poolId][
                    dstorage().poolWinnersCount[poolId] - 1
                ]
            ];
    }

    function getNftScores(uint256 tokenId) public view returns (uint8) {
        return dstorage().nftScores[tokenId];
    }

    function getNftUpdatedInRound(uint8 round, uint256 tokenId)
        public
        view
        returns (bool)
    {
        return dstorage().nftUpdatedInRound[round][tokenId];
    }

    /**
     * @dev Inserts the passed tokenId in the `winningBracket` array if the bracket has higher score than the current tokenId (poolWinningBrackets[poolId][n]).
     * If the score are equal then they're compared by their number of updates which check is executed in `tiebreakerLevelOne`, wins the tokenId
     * with lower number of updates.
     * In case they both have equal number of updates, the tokenIds are compared by their tokenIds in `tiebreakerLevelTwo`, the lower one wins.
     *
     * @param poolId uint256 representing the current bracket tokenId
     * @param tokenId uint256 representing the current bracket tokenId
     * @param score uint16 representing the current bracket score
     * @param actualFinalsScore actual sum of the finals match
     */
    function insertTokenId(
        uint256 poolId,
        uint256 tokenId,
        uint8 score,
        uint32 actualFinalsScore
    ) private {
        uint16 n = 0;

        DataTypes.Pool memory pool = LibNFBTournamentsStorage.getPoolById(
            poolId
        );

        DataTypes.RewardDistribution
            memory rewardDistribution = LibNFBRewardPoolStorage
                .getRewardDistribution(pool.rewardDistributionId);

        for (n; n < dstorage().poolWinnersCount[poolId]; n++) {
            if (
                dstorage().poolWinnersCount[poolId] <
                rewardDistribution.maxWinnersCount &&
                dstorage().poolWinningBrackets[poolId][n] == 0
            ) {
                break; // Break loop in `n` iteration if `winningBrackets` has length less than the max of `maximumWinnersCount` and current score and tokenId are equal to 0
            }
            if (
                score >
                dstorage().nftScores[dstorage().poolWinningBrackets[poolId][n]]
            ) {
                break; // Break loop in `n` iteration if current `bracket` has higher score than `winningBrackets[n]`
            } else if (
                score ==
                dstorage().nftScores[dstorage().poolWinningBrackets[poolId][n]]
            ) {
                if (
                    tiebreakerLevelOne(
                        tokenId,
                        dstorage().poolWinningBrackets[poolId][n],
                        actualFinalsScore
                    )
                ) {
                    break;
                }
            }
        }

        for (uint256 j = dstorage().poolWinnersCount[poolId] - 1; j > n; j--) {
            dstorage().poolWinningBrackets[poolId][j] = dstorage()
                .poolWinningBrackets[poolId][j - 1];
        }

        if (n < rewardDistribution.maxWinnersCount) {
            dstorage().poolWinningBrackets[poolId][n] = tokenId;
        }
    }

    function abs(int256 x) private pure returns (int256) {
        return x >= 0 ? x : -x;
    }

    /**
     * @dev Checks which of both brackets is closer to the absolute sum of the scores of the finals.
     *
     * @param currTokenId uint256 respresenting the current tokenId
     * @param selectedTokenId uint256 respresenting the tokenId which is going to be added in `winningBrackets`
     * @param actualSum uint32 representing the actual (true one) sum of the scores of the finals match.
     *
     * @return bool
     */
    function tiebreakerLevelOne(
        uint256 selectedTokenId,
        uint256 currTokenId,
        uint32 actualSum
    ) private view returns (bool) {
        NFBBracket bracketContract = NFBBracket(dstorage().nfbBracketAddress);

        (
            uint32 selectedTokenIdTeamOneScore,
            uint32 selectedTokenIdTeamTwoScore
        ) = bracketContract.tokenIdToFinalsScoresPredictions(selectedTokenId);

        (
            uint32 currTokenIdTeamOneScore,
            uint32 currTokenIdTeamTwoScore
        ) = bracketContract.tokenIdToFinalsScoresPredictions(currTokenId);

        uint32 selectedTokenIdSum = selectedTokenIdTeamOneScore +
            selectedTokenIdTeamTwoScore;
        uint32 currTokenIdSum = currTokenIdTeamOneScore +
            currTokenIdTeamTwoScore;
        unchecked {
            if (
                abs(int256(uint256(actualSum - selectedTokenIdSum))) <
                abs(int256(uint256(actualSum - currTokenIdSum)))
            ) {
                return true;
            }
            if (
                abs(int256(uint256(actualSum - currTokenIdSum))) <
                abs(int256(uint256(actualSum - selectedTokenIdSum)))
            ) {
                return false;
            }
        }
        // they are equal
        return tiebreakerLevelTwo(selectedTokenId, currTokenId);
    }

    /**
     * @dev Checks if selected tokenId has less updates with current tokenId. If both have equal number of updates, `tiebreakerLevelTwo` is invoked.
     *
     * @param currTokenId uint256 respresenting the current tokenId
     * @param selectedTokenId uint256 respresenting the tokenId which is going to be added in `poolWinningBrackets`
     *
     * @return bool
     */
    function tiebreakerLevelTwo(uint256 selectedTokenId, uint256 currTokenId)
        private
        view
        returns (bool)
    {
        uint16 selectedBracketUpdates = uint16(
            NFBBracket(dstorage().nfbBracketAddress).tokenIdToNumberOfUpdates(
                selectedTokenId
            )
        );
        uint16 currBracketUpdates = uint16(
            NFBBracket(dstorage().nfbBracketAddress).tokenIdToNumberOfUpdates(
                currTokenId
            )
        );

        if (selectedBracketUpdates < currBracketUpdates) {
            return true;
        } else if (currBracketUpdates == selectedBracketUpdates) {
            return tiebreakerLevelThree(selectedTokenId, currTokenId);
        }

        return false;
    }

    /**
     * @dev Checks if selected tokenId is lower than the current tokenId.
     *
     * @param currTokenId uint256 respresenting the current tokenId
     * @param selectedTokenId uint256 respresenting the tokenId which is going to be added in `poolWinningBrackets`
     *
     * @return bool
     */
    function tiebreakerLevelThree(uint256 selectedTokenId, uint256 currTokenId)
        private
        pure
        returns (bool)
    {
        return selectedTokenId < currTokenId;
    }

    /**
     * @dev Calculates each bracket points and emits event.
     * @param tokenIds array of ids which is are going to be queried
     * @param brackets array of arrays representing the raw data stored against each NFT bracket
     * Requirements:
     *
     * - must be called by the owner of the contract
     * - the hash of the bracket in `brackets` array must be equal to the hash stored in the contract upon creation
     *
     * emits a {LogBracketScoreUpdated} event for every tokenId when the score is updated with its current owner.
     */
    function emitBracketScores(
        uint256 _tournamentId,
        uint256[] memory tokenIds,
        DataTypes.Bracket[] memory brackets
    ) external {
        onlyMatchingLengths(tokenIds.length, brackets.length);
        uint8 round = LibNFBOracleStorage.dstorage().tournamentToRound[
            _tournamentId
        ];

        for (uint256 i = 0; i < tokenIds.length; i++) {
            bytes32 currHash = keccak256(abi.encode(brackets[i]));
            bytes32 storedHash = NFBBracket(dstorage().nfbBracketAddress)
                .tokenIdTokenHash(tokenIds[i]);
            onlyMatchingHashes(currHash, storedHash);
            (uint8 bracketPoints, uint8 roundPoints) = LibNFBOracleStorage
                .calcBracketPoints(_tournamentId, brackets[i]);
            address bracketOwner = NFBBracket(dstorage().nfbBracketAddress)
                .ownerOf(tokenIds[i]);

            dstorage().nftUpdatedInRound[round][tokenIds[i]] = true;

            dstorage().nftScores[tokenIds[i]] = bracketPoints;

            emit LogBracketScoreUpdated(
                tokenIds[i],
                roundPoints,
                bracketPoints,
                round,
                bracketOwner
            );
        }
    }

    function isPaused() external view returns (bool) {
        return LibPausable.isPaused();
    }

    /**
     * @dev Pauses NFBOracle contract.
     * Requirements:
     *
     * - must be called by the contract owner only
     *
     */
    function pause() external {
        LibOwnership.enforceIsContractOwner();
        LibPausable.setPaused();

        emit Paused(msg.sender);
    }

    /**
     * @dev Unpauses NFBOracle contract.
     * Requirements:
     *
     * - must be called by the contract owner only
     *
     */
    function unpause() external {
        LibOwnership.enforceIsContractOwner();
        LibPausable.setUnpaused();

        emit Unpaused(msg.sender);
    }

    /// @dev Sets a new trusted forwarder
    /// @param _newTrustedForwarder The new owner address
    /// Emits {TrustedForwarderSet} event
    function setTrustedForwarder(address _newTrustedForwarder) external {
        LibOwnership.enforceIsContractOwner();

        LibDiamond.DiamondStorage storage dsDiamond = LibDiamond
            .diamondStorage();

        address previousForwarder = dsDiamond.trustedForwarder;
        require(
            previousForwarder != _newTrustedForwarder,
            "Previous forwarder and new forwarder must be different"
        );

        dsDiamond.trustedForwarder = _newTrustedForwarder;

        emit TrustedForwarderSet(previousForwarder, _newTrustedForwarder);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {LibOwnership} from "../libraries/LibOwnership.sol";
import {LibAccessControl} from "../libraries/LibAccessControl.sol";
import {LibPausable} from "../libraries/LibPausable.sol";
import {LibNFBRewardPoolStorage} from "../libraries/LibNFBRewardPoolStorage.sol";
import {LibNFBOracleStorage} from "../libraries/LibNFBOracleStorage.sol";
import {LibNFBCoreStorage} from "../libraries/LibNFBCoreStorage.sol";
import {LibNFBTournamentsStorage} from "../libraries/LibNFBTournamentsStorage.sol";
import {INFBRewardPoolFacet} from "../interfaces/INFBRewardPoolFacet.sol";
import {NFBBracket} from "../NFBBracket.sol";
import {DataTypes} from "../libraries/types/DataTypes.sol";
import {LibSecurityStorage} from "../libraries/LibSecurityStorage.sol";
import {PoolFund} from "../PoolFund.sol";
import {Errors} from "../libraries/Errors.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFBRewardPoolFacet is INFBRewardPoolFacet {
    using Counters for Counters.Counter;

    modifier nonReentrant() {
        LibSecurityStorage.nonReentrantBefore();
        _;
        LibSecurityStorage.nonReentrantAfter();
    }

    function initializeRewardPool() external {}

    function dstorage()
        internal
        pure
        returns (LibNFBRewardPoolStorage.Storage storage)
    {
        return LibNFBRewardPoolStorage.dstorage();
    }

    function nfbCoreStorage()
        internal
        pure
        returns (LibNFBCoreStorage.Storage storage)
    {
        return LibNFBCoreStorage.dstorage();
    }

    function nfbOracleStorage()
        internal
        pure
        returns (LibNFBOracleStorage.Storage storage)
    {
        return LibNFBOracleStorage.dstorage();
    }

    function nfbTournamentsStorage()
        internal
        pure
        returns (LibNFBTournamentsStorage.Storage storage)
    {
        return LibNFBTournamentsStorage.dstorage();
    }

    bytes32 public constant HANDLER_ROLE = keccak256("HANDLER_ROLE");

    function addRewardDistribution(
        string calldata _name,
        uint256[] calldata _rewardPercentages,
        uint256[] calldata _rewardRanges,
        bool _isAllOrNothing
    ) external {
        LibOwnership.enforceIsContractOwner();
        dstorage().lastRewardDistributionId.increment();
        uint256 newRewardDistributionId = dstorage()
            .lastRewardDistributionId
            .current();

        DataTypes.RewardDistribution memory newRewardDistribution = DataTypes
            .RewardDistribution({
                id: newRewardDistributionId,
                name: _name,
                rewardPercentages: _rewardPercentages,
                rewardRanges: _rewardRanges,
                maxWinnersCount: uint16(
                    _rewardRanges[_rewardRanges.length - 1] - 1
                ) // Top5 tier ranges example: [1, 2, 3, 4, 5, 6], so maxWinnersCount should be = 5
            });

        dstorage().rewardDistributions[
            newRewardDistributionId
        ] = newRewardDistribution;

        emit LogAddRewardDistribution(
            newRewardDistributionId,
            _name,
            _isAllOrNothing,
            _rewardPercentages,
            _rewardRanges,
            msg.sender
        );
    }

    /**
     * @dev Pull the funds left in the contract out 180 days after the end of 6th (final) round,
     * respectively the end of the tournament.
     *
     * Requirements:
     *
     * -  only the creator of the pool
     * -  only after specific period of time the funds left could be pulled out
     *
     * emits a {LogSetRoundBounds} event.
     */
    function pullFundsOut(uint256 _poolId) public nonReentrant {
        // 180 days must have passed after the end of the tournament
        DataTypes.Pool memory pool = LibNFBTournamentsStorage.dstorage().pools[
            _poolId
        ];

        // only pool creator can withdraw everything left in the pool fund
        if (pool.creatorAddress != msg.sender) {
            revert Errors.TournamentsFacet__CallerIsNotPoolCreator(
                _poolId,
                pool.creatorAddress,
                msg.sender
            );
        }

        LibNFBOracleStorage.Storage storage dsNFBOracle = LibNFBOracleStorage
            .dstorage();

        uint8 roundsCount = dsNFBOracle.tournamentToRoundsCount[
            pool.tournamentId
        ];

        require(
            (dsNFBOracle.tournamentToRound[pool.tournamentId] == roundsCount) &&
                (block.timestamp >
                    (dsNFBOracle.tournamentToRoundsBounds[pool.tournamentId][
                        roundsCount
                    ][1] + 180 days)),
            "NFBR: Withdrawing funds locked"
        );

        uint256 amountLeft = IERC20(pool.poolCurrencyAddress).balanceOf(
            pool.poolFundAddress
        );

        require(
            PoolFund(pool.poolFundAddress).withdraw(msg.sender, amountLeft),
            "Reward Pool Facet: Withdraw failed"
        );

        emit LogFundsPulledOut(msg.sender, amountLeft);
    }

    function getTotalRewards(uint256 _poolId) external view returns (uint256) {
        DataTypes.Pool memory pool = nfbTournamentsStorage().pools[_poolId];
        uint256 poolFundBalance = IERC20(pool.poolCurrencyAddress).balanceOf(
            pool.poolFundAddress
        );
        return poolFundBalance;
    }

    /**
     * @dev Gets the `totalStakesByPool`
     * @param _poolId poolId
     * * Requirements:
     *
     */
    function getStakePoolStakesAmount(uint256 _poolId)
        external
        view
        returns (uint256)
    {
        return dstorage().totalStakesByPool[_poolId];
    }

    /**
     * @dev Claims a reward if the NFT bracket is among the winners of the tournament. Send it to the current owner of the NFT. Might be called by anyone willing to pay for the gas.
     * @param tokenId id which is recorded as a winner in the contract
     * Requirements:
     *
     * - `block.timestamp` must be after the tournament has finished.
     */
    function claim(uint256 _poolId, uint256 tokenId) external nonReentrant {
        LibPausable.enforceNotPaused();
        _claim(_poolId, tokenId);
    }

    /**
     * @dev Calculates reward percent for given bracket position in the winning brackets array in diamond.
     * @param position - which we are going to calculate the reward against.
     * @return reward
     * Requirements:
     *
     * the balance in the currency which the Diamond operates must be higher than zero
     */
    function calcReward(uint256 poolId, uint256 position)
        public
        view
        returns (uint256)
    {
        return LibNFBRewardPoolStorage.calcReward(poolId, position, false); // false - means !isCalledByWithdraw, i.e. it's called for visualizing purposes durring the tournament
    }

    /**
     * @dev Internal Function for claiming funds from the nfbRewardPoolFacet. Claims a reward if the NFT bracket is among the winners of the tournament.
     * @param tokenId id which is recorded as a winner in the contract
     * Requirements:
     *
     * - `block.timestamp` must be after the tournament has finished.
     * - `tokenId` must be amongst the first `maximumWinnersCount` in the `nextWinningTokenIds` mapping
     *
     * Emits a {LogRewardClaimed} event.
     */
    function _claim(uint256 _poolId, uint256 tokenId) private {
        DataTypes.Pool memory pool = LibNFBTournamentsStorage.dstorage().pools[
            _poolId
        ];

        uint8 roundsCount = LibNFBOracleStorage
            .dstorage()
            .tournamentToRoundsCount[pool.tournamentId];

        uint256 lastRoundEndingTime = nfbOracleStorage()
            .tournamentToRoundsBounds[pool.tournamentId][roundsCount][1];

        require(
            (LibNFBOracleStorage.dstorage().tournamentToRound[
                pool.tournamentId
            ] == roundsCount) &&
                lastRoundEndingTime > 0 &&
                block.timestamp > (lastRoundEndingTime + 1 days),
            "NFBR: Invalid claim"
        );

        uint256 poolFundBalance = IERC20(pool.poolCurrencyAddress).balanceOf(
            pool.poolFundAddress
        );

        // if the tournament has ended we can get a snapshot of the total rewards accumulated in the pool fund and store them in totalRewardsByPool
        // the totalRewardsByPool[_poolId] == 0 check below, assures that the we are going to take the snapshot only the first time, so if someone sponsors the pool fund after the tournament has ended, the totalRewardsByPool will not be updated
        // in case if someone sponsors the pool fund after the tournament has ended, the creator of the pool should be able to pull out the remaining funds in the pool fund
        if (
            dstorage().totalRewardsByPool[_poolId] == 0 &&
            poolFundBalance > dstorage().totalRewardsByPool[_poolId]
        ) {
            dstorage().totalRewardsByPool[_poolId] = poolFundBalance;
        }

        address bracketOwner = NFBBracket(nfbCoreStorage().nfbBracketAddress)
            .ownerOf(tokenId);
        require(
            bracketOwner == LibNFBCoreStorage._msgSender(),
            "NFBR: Not the bracket owner"
        );
        uint256[] memory poolWinningBrackets = LibNFBCoreStorage.getTop(
            _poolId
        );
        bool canClaim = false;
        uint16 position = 1;

        DataTypes.RewardDistribution
            memory rewardDistribution = LibNFBRewardPoolStorage
                .getRewardDistribution(pool.rewardDistributionId);

        uint16 maximumWinnersCount = rewardDistribution.maxWinnersCount;

        for (position; position <= maximumWinnersCount; position++) {
            if (poolWinningBrackets[position - 1] == tokenId) {
                canClaim = true;
                break;
            }
        }

        require(canClaim, "NFBR: Caller isn't amongst winners");
        require(
            !dstorage().hasClaimed[_poolId][position],
            "NFBR: Already claimed"
        );

        uint256 amount = LibNFBRewardPoolStorage.withdraw(
            _poolId,
            bracketOwner,
            position
        );

        emit LogRewardClaimed(bracketOwner, tokenId, amount);
    }
}

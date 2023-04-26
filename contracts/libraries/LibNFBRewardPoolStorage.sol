// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./LibDiamond.sol";
import "./LibOwnership.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {LibAccessControl} from "../libraries/LibAccessControl.sol";
import {LibNFBTournamentsStorage} from "../libraries/LibNFBTournamentsStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import {DataTypes} from "../libraries/types/DataTypes.sol";
import {PoolFund} from "../PoolFund.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

library LibNFBRewardPoolStorage {
    using Counters for Counters.Counter;
    bytes32 constant STORAGE_POSITION =
        keccak256("diamond.standard.nfb.rewardpool.storage");

    struct Storage {
        // poolId => totalRewards
        mapping(uint256 => uint256) totalRewardsByPool;
        // poolId => totalStakes
        mapping(uint256 => uint256) totalStakesByPool;
        // poolId => address => stakeDeposited
        mapping(uint256 => mapping(address => bool)) addressStakeDepositedByPool;
        Counters.Counter lastRewardDistributionId;
        // rewardDistributionId => RewardDistribution
        mapping(uint256 => DataTypes.RewardDistribution) rewardDistributions;
        // poolId => position => hasClaimed
        mapping(uint256 => mapping(uint256 => bool)) hasClaimed;
    }
    event LogStakePoolUpdated(
        uint256 poolId,
        uint256 newTotalStakesByPool,
        address callerAddress
    );

    /// @dev The diamond storage for the Reward Pool
    /// @return ds The Reward Pool diamond storage pointer
    function dstorage() internal pure returns (Storage storage ds) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    function getRewardDistribution(uint256 rewardDistributionId)
        internal
        view
        returns (DataTypes.RewardDistribution memory)
    {
        return dstorage().rewardDistributions[rewardDistributionId];
    }

    /**
     * @dev Set that position for `winningBracket` as claimed
     * @param position winning brackets position array in Diamond
     * * Requirements:
     *
     */
    function setClaimed(uint256 _poolId, uint256 position) private {
        dstorage().hasClaimed[_poolId][position] = true;
    }

    /**
     * @dev Updates the `totalStakesByPool` when user joins a pool which is StakeToPlay
     * @param amount amount which will be added to the `totalStakesByPool`
     * * Requirements:
     *
     * - must be called from Diamond only.
     *
     */
    function updateStakePool(
        uint256 _poolId,
        address _callerAddress,
        uint256 amount
    ) internal {
        Storage storage ds = dstorage();

        ds.totalStakesByPool[_poolId] += amount;
        ds.addressStakeDepositedByPool[_poolId][_callerAddress] = true;

        emit LogStakePoolUpdated(
            _poolId,
            ds.totalStakesByPool[_poolId],
            _callerAddress
        );
    }

    /**
     * @dev Calculates reward percent for given bracket position in the winning brackets array in diamond.
     * @param position - which we are going to calculate the reward against.
     * @return reward
     * Requirements:
     *
     * the balance in the currency which the Diamond operates must be higher than zero
     */
    function calcReward(
        uint256 _poolId,
        uint256 position,
        bool isCalledByWithdraw
    ) internal view returns (uint256) {
        Storage storage ds = dstorage();
        LibNFBTournamentsStorage.Storage
            storage tournamentsStorage = LibNFBTournamentsStorage.dstorage();
        DataTypes.Pool memory pool = tournamentsStorage.pools[_poolId];

        uint256 poolTotalRewards;

        if (isCalledByWithdraw) {
            // if isCalledByWithdraw function, it means the tournament has ended and we use the stored in totalRewardsByPool snapshot of the rewards
            poolTotalRewards = dstorage().totalRewardsByPool[_poolId];
        } else {
            // if !isCalledByWithdraw function, it means calcReward is being called by the front end in the middle of the tournament for displaying purposes of the 'current' accumulated rewards
            poolTotalRewards = IERC20(pool.poolCurrencyAddress).balanceOf(
                pool.poolFundAddress
            );
        }

        if (poolTotalRewards == 0) return 0;

        uint256[] memory rewardRanges = ds
            .rewardDistributions[pool.rewardDistributionId]
            .rewardRanges;
        uint256[] memory rewardPercentages = ds
            .rewardDistributions[pool.rewardDistributionId]
            .rewardPercentages;

        if (
            pool.royaltyType == DataTypes.RoyaltyType.Percentage &&
            pool.royaltyAmount > 0
        ) {
            uint256 calculatedRoyalty = (poolTotalRewards *
                pool.royaltyAmount) / 10000; // Basis points (bps) // royaltyAmount is a percentage

            poolTotalRewards -= calculatedRoyalty;
        }

        for (uint256 r = 0; r < rewardRanges.length - 1; r++) {
            if (
                (position >= rewardRanges[r]) &&
                (position < rewardRanges[r + 1])
            ) {
                uint256 winnersCountInRange = rewardRanges[r + 1] -
                    rewardRanges[r];
                uint256 rewardForAllInCurrentRange = (poolTotalRewards *
                    rewardPercentages[r]) / 10000; // percentages are in Basis points (bps) - 100% = 10000 bps // 5% = 500 bps, so that's why the divider is 10000
                uint256 rewardForOneInCurrentRange = rewardForAllInCurrentRange /
                        winnersCountInRange;

                return rewardForOneInCurrentRange;
            }
        }

        return 0;
    }

    /**
     * @dev Send certain amount of funds, depending on the ranking `to` the owner of a winning bracket
     * @param _to player who will receive its reward
     * @param position position which the bracket takes in `poolWinningBrackets`.
     * * Requirements:
     *
     * - must be called from Diamond only.
     *
     */
    function withdraw(
        uint256 _poolId,
        address _to,
        uint256 position
    ) internal returns (uint256) {
        uint256 _amount = calcReward(_poolId, position, true); // isCalledByWithdraw = true

        setClaimed(_poolId, position);

        Storage storage ds = dstorage();
        LibNFBTournamentsStorage.Storage
            storage tournamentsStorage = LibNFBTournamentsStorage.dstorage();
        DataTypes.Pool memory pool = tournamentsStorage.pools[_poolId];

        // if pool is stake to play
        if (
            pool.prizeModelType == DataTypes.PrizeModelType.StakeToPlay &&
            pool.stakeToPlayAmount > 0 &&
            ds.addressStakeDepositedByPool[_poolId][_to]
        ) {
            require(
                // diamond to send the stake back to the user
                IERC20(pool.poolCurrencyAddress).transfer(
                    _to,
                    pool.stakeToPlayAmount
                )
            );

            ds.addressStakeDepositedByPool[_poolId][_to] = false;
        }

        require(
            // pool fund to send the reward to the user
            PoolFund(pool.poolFundAddress).withdraw(_to, _amount),
            "Reward Pool: failed to withdraw reward from PoolFund contract"
        );

        return _amount;
    }
}

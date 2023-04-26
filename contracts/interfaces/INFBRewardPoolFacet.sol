// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {DataTypes} from "../libraries/types/DataTypes.sol";

interface INFBRewardPoolFacet {
    event LogRewardClaimed(
        address triggeredBy,
        uint256 tokenId,
        uint256 reward
    );
    event LogFundsPulledOut(address to, uint256 amount);
    event LogWithdrawFundsLeft(uint256 poolId, address to, uint256 amount);
    event LogStakePoolUpdated(
        uint256 poolId,
        uint256 newTotalStakesByPool,
        address callerAddress
    );

    event LogAddRewardDistribution(
        uint256 rewardDistributionId,
        string name,
        bool isAllOrNothing,
        uint256[] rewardPercentages,
        uint256[] rewardRanges,
        address callerAddress
    );

    function initializeRewardPool() external;

    function claim(uint256 _poolId, uint256 tokenId) external;

    function getTotalRewards(uint256 _poolId) external view returns (uint256);

    function calcReward(uint256 poolId, uint256 position)
        external
        view
        returns (uint256);

    function pullFundsOut(uint256 _poolId) external;

    function addRewardDistribution(
        string calldata _name,
        uint256[] calldata _rewardPercentages,
        uint256[] calldata _rewardRanges,
        bool _isAllOrNothing
    ) external;

    function getStakePoolStakesAmount(uint256 _poolId)
        external
        view
        returns (uint256);
}

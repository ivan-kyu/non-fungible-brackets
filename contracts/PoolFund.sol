// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract PoolFund is Ownable {
    using SafeERC20 for IERC20;
    address private operatingTokenAddress;

    constructor(address _operatingTokenAddress) {
        require(
            _operatingTokenAddress != address(0),
            "PoolFund: OperatingTokenIsZero"
        );
        operatingTokenAddress = _operatingTokenAddress;
    }

    function withdraw(address _to, uint256 _amount)
        external
        onlyOwner
        returns (bool)
    {
        IERC20(operatingTokenAddress).safeTransfer(_to, _amount);

        return true;
    }
}

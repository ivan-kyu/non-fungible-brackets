// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DGENMock is ERC20 {
    constructor(uint256 mintQty) ERC20("DGENMock", "DGM") {
        _mint(msg.sender, mintQty * 10**18);
    }
}

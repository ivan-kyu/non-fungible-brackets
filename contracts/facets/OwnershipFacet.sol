// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {LibOwnership} from "../libraries/LibOwnership.sol";
import {IERC173} from "../interfaces/IERC173.sol";

contract OwnershipFacet is IERC173 {
    /// @notice Transfer ownership to `_newOwner`
    /// @dev Transfers contract ownership to a new address
    /// @param _newOwner The address of the new owner
    function transferOwnership(address _newOwner) external override {
        LibOwnership.enforceIsContractOwner();
        LibOwnership.setContractOwner(_newOwner);
    }

    /// @notice Gets the current contract owner
    /// @return owner_ The contract owner
    function owner() external view override returns (address owner_) {
        owner_ = LibOwnership.contractOwner();
    }
}

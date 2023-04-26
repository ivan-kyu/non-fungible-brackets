// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
import "./LibDiamond.sol";

library LibOwnership {
    /// @notice Emitted when ownership is transfered
    /// @param previousOwner The old owner address
    /// @param newOwner The new owner address
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    /// @dev Sets a new contract owner
    /// @param _newOwner The new owner address
    /// Emits {OwnershipTransferred} event
    function setContractOwner(address _newOwner) internal {
        LibDiamond.DiamondStorage storage dsDiamond = LibDiamond
            .diamondStorage();

        address previousOwner = dsDiamond.contractOwner;
        require(
            previousOwner != _newOwner,
            "Previous owner and new owner must be different"
        );

        dsDiamond.contractOwner = _newOwner;

        emit OwnershipTransferred(previousOwner, _newOwner);
    }

    /// @dev Gets the current contract owner address
    /// @return contractOwner_ The contract owner address
    function contractOwner() internal view returns (address contractOwner_) {
        contractOwner_ = LibDiamond.diamondStorage().contractOwner;
    }

    /// @dev Enforces that the caller is contract owner
    function enforceIsContractOwner() internal view {
        require(
            msg.sender == LibDiamond.diamondStorage().contractOwner,
            "Must be contract owner"
        );
    }
}

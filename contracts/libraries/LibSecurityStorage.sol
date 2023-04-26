// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

library LibSecurityStorage {
    bytes32 constant STORAGE_POSITION =
        keccak256("diamond.standard.nfb.security.storage");

    // TODO : Add initial statusReentrancyGuard set

    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    struct Storage {
        /// @notice used form cusomt ReentrancyGuard implementation
        uint256 statusReentrancyGuard;
    }

    function dstorage() internal pure returns (Storage storage ds) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    function nonReentrantBefore() internal {
        Storage storage ds = dstorage();

        require(
            ds.statusReentrancyGuard != _ENTERED,
            "ReentrancyGuard: reentrant call"
        );

        ds.statusReentrancyGuard = _ENTERED;
    }

    function nonReentrantAfter() internal {
        Storage storage ds = dstorage();

        ds.statusReentrancyGuard = _NOT_ENTERED;
    }

    /// @notice Enforces that the address specified is not address(0)
    /// @param _address The address that is being validated
    function enforceValidAddress(address _address) internal pure {
        require(_address != address(0), "Not a valid address");
    }
}

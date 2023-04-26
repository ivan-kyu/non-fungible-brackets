// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
import "./LibDiamond.sol";
import "./LibNFBCoreStorage.sol";

library LibPausable {
    bytes32 constant STORAGE_POSITION =
        keccak256("diamond.standard.nfb.security.pausable");

    function dstorage() internal pure returns (Storage storage ds) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    struct Storage {
        bool paused;
    }

    function setPaused() internal {
        dstorage().paused = true;
    }

    function setUnpaused() internal {
        dstorage().paused = false;
    }

    function isPaused() internal view returns (bool) {
        return dstorage().paused;
    }

    function enforceNotPaused() internal view {
        require(!isPaused(), "NFB paused");
    }

    function enforcePaused() internal view {
        require(isPaused(), "NFB unpaused");
    }
}

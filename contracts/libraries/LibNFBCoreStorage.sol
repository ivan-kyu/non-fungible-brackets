// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./LibDiamond.sol";
import "../NFBBracket.sol";
import "../facets/NFBOracleFacet.sol";

library LibNFBCoreStorage {
    bytes32 constant STORAGE_POSITION =
        keccak256("diamond.standard.nfb.core.storage");

    struct Storage {
        address nfbBracketAddress;
        address daoWalletAddress;
        address dgenTokenAddress;
        // pool => winnersCount
        mapping(uint256 => uint16) poolWinnersCount;
        uint256 nftUpdatePrice;
        mapping(uint256 => uint256[]) poolWinningBrackets;
        // nft => score
        mapping(uint256 => uint8) nftScores;
        // round => (nft => bool)
        mapping(uint8 => mapping(uint256 => bool)) nftUpdatedInRound;
        // nft => bool
        mapping(uint256 => bool) nftUpdatedTournament;
    }

    /// @dev The diamond storage for the Core
    /// @return ds The core diamond storage pointer
    function dstorage() internal pure returns (Storage storage ds) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    /**
     * @dev Returns top `poolWinnersCount` tokenIds with maximum length of `maximumWinnersCount`.
     * @return uint256[] memory
     */
    function getTop(uint256 _poolId) internal view returns (uint256[] memory) {
        Storage storage ds = dstorage();

        uint256[] memory topBracketIds = new uint256[](
            ds.poolWinnersCount[_poolId]
        );

        for (uint16 i = 0; i < ds.poolWinnersCount[_poolId]; i++) {
            topBracketIds[i] = ds.poolWinningBrackets[_poolId][i];
        }

        return topBracketIds;
    }

    function isTrustedForwarder(address forwarder)
        internal
        view
        returns (bool)
    {
        LibDiamond.DiamondStorage storage dsDiamond = LibDiamond
            .diamondStorage();
        return forwarder == address(dsDiamond.trustedForwarder);
    }

    function _msgSender() internal view returns (address sender) {
        if (isTrustedForwarder(msg.sender)) {
            // The assembly code is more direct than the Solidity version using `abi.decode`.
            assembly {
                sender := shr(96, calldataload(sub(calldatasize(), 20)))
            }
        } else {
            return msg.sender;
        }
    }

    function _msgData() internal view returns (bytes calldata) {
        if (isTrustedForwarder(msg.sender)) {
            return msg.data[:msg.data.length - 20];
        }
        return msg.data;
    }
}

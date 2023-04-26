// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)
* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535
*
* Implementation of a diamond.
/******************************************************************************/

import {LibDiamond} from "./libraries/LibDiamond.sol";
import {LibAccessControl} from "./libraries/LibAccessControl.sol";
import {IDiamondCut} from "./interfaces/IDiamondCut.sol";

import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import "./libraries/LibDiamond.sol";
import "./libraries/LibOwnership.sol";
import "./interfaces/IDiamondCut.sol";
import "./interfaces/IDiamondLoupe.sol";
import "./interfaces/IERC173.sol";
import "./interfaces/IAccessControl.sol";

contract Diamond {
    constructor(
        IDiamondCut.FacetCut[] memory _diamondCut,
        address _owner,
        address _trustedForwarder
    ) {
        require(_owner != address(0), "owner must not be 0x0");

        LibOwnership.setContractOwner(_owner);

        LibAccessControl.initAccessControl();
        LibAccessControl._setupRole(
            LibAccessControl.defaultAdminRole(),
            _owner
        );
        LibAccessControl._setupRole(LibAccessControl.updaterRole(), _owner);

        LibDiamond.diamondCut(_diamondCut, address(0), new bytes(0));

        LibDiamond.DiamondStorage storage dsDiamond = LibDiamond
            .diamondStorage();

        dsDiamond.trustedForwarder = _trustedForwarder;

        dsDiamond.supportedInterfaces[type(IERC165).interfaceId] = true;
        dsDiamond.supportedInterfaces[type(IDiamondCut).interfaceId] = true;
        dsDiamond.supportedInterfaces[type(IDiamondLoupe).interfaceId] = true;
        dsDiamond.supportedInterfaces[type(IERC173).interfaceId] = true;
        dsDiamond.supportedInterfaces[type(IERC721).interfaceId] = true;
        dsDiamond.supportedInterfaces[type(IERC721Metadata).interfaceId] = true;
        dsDiamond.supportedInterfaces[
            type(IERC721Enumerable).interfaceId
        ] = true;
        dsDiamond.supportedInterfaces[type(IAccessControl).interfaceId] = true;
    }

    // Find facet for function that is called and execute the
    // function if a facet is found and return any value.
    fallback() external payable {
        LibDiamond.DiamondStorage storage dsDiamond = LibDiamond
            .diamondStorage();

        // get facet from function selector
        address facet = dsDiamond
            .selectorToFacetAndPosition[msg.sig]
            .facetAddress;
        require(facet != address(0), "Diamond: Function does not exist");
        // Execute external function from facet using delegatecall and return any value.
        assembly {
            // copy function selector and any arguments
            calldatacopy(0, 0, calldatasize())
            // execute function call using the facet
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
            // get any return value
            returndatacopy(0, 0, returndatasize())
            // return any return value or error back to the caller
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }
}

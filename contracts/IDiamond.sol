// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./interfaces/IDiamondCut.sol";
import "./interfaces/IDiamondLoupe.sol";
import "./interfaces/IERC173.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "./interfaces/IAccessControl.sol";
import "./interfaces/INFBOracleFacet.sol";
import "./interfaces/INFBRewardPoolFacet.sol";
import "./interfaces/INFBTournamentsFacet.sol";
import "./interfaces/INFBCoreFacet.sol";

interface IDiamond is
    IDiamondCut,
    IDiamondLoupe,
    IAccessControl,
    IERC173,
    IERC165,
    INFBOracleFacet,
    INFBRewardPoolFacet,
    INFBTournamentsFacet,
    INFBCoreFacet
{}

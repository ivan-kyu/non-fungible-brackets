// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./LibDiamond.sol";
import "../NFBBracket.sol";
import "../facets/NFBOracleFacet.sol";
import "../facets/NFBRewardPoolFacet.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import {DataTypes} from "./types/DataTypes.sol";

library LibNFBTournamentsStorage {
    using SafeMath for uint256;
    using Counters for Counters.Counter;

    bytes32 constant STORAGE_POSITION =
        keccak256("diamond.standard.nfb.tournaments.storage");

    /// @dev The diamond storage for the Tournaments
    /// @return ds The tournaments diamond storage pointer
    function dstorage() internal pure returns (Storage storage ds) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    struct Storage {
        address nfbBracketAddress;
        address delegationRegistryAddress;
        Counters.Counter lastSportsLeagueId;
        mapping(uint256 => DataTypes.SportsLeague) sportsLeagues;
        Counters.Counter lastTournamentFormatId;
        mapping(uint256 => DataTypes.TournamentFormat) tournamentFormats;
        Counters.Counter lastTournamentId;
        uint256[] tournamentIds;
        mapping(uint256 => DataTypes.Tournament) tournaments;
        Counters.Counter lastPoolId;
        mapping(uint256 => DataTypes.Pool) pools;
        // pool => tokenIds
        mapping(uint256 => mapping(uint256 => bool)) poolTokenIds;
    }

    function getTournamentFormatIdByPoolId(uint256 _poolId)
        internal
        view
        returns (uint256)
    {
        return
            dstorage()
                .tournaments[dstorage().pools[_poolId].tournamentId]
                .tournamentFormatId;
    }

    function getTournamentIdByPoolId(uint256 _poolId)
        internal
        view
        returns (uint256)
    {
        return dstorage().pools[_poolId].tournamentId;
    }

    function getsportsLeagueIdByPoolId(uint256 _poolId)
        internal
        view
        returns (uint256)
    {
        return
            dstorage()
                .tournaments[dstorage().pools[_poolId].tournamentId]
                .sportsLeagueId;
    }

    function getPoolById(uint256 _poolId)
        internal
        view
        returns (DataTypes.Pool memory)
    {
        return dstorage().pools[_poolId];
    }
}

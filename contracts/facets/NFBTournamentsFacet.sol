// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {LibOwnership} from "../libraries/LibOwnership.sol";
import {INFBTournamentsFacet} from "../interfaces/INFBTournamentsFacet.sol";
import {LibNFBTournamentsStorage} from "../libraries/LibNFBTournamentsStorage.sol";
import {LibNFBRewardPoolStorage} from "../libraries/LibNFBRewardPoolStorage.sol";
import {LibNFBOracleStorage} from "../libraries/LibNFBOracleStorage.sol";
import {LibNFBCoreStorage} from "../libraries/LibNFBCoreStorage.sol";
import {NFBBracket} from "../NFBBracket.sol";
import {DataTypes} from "../libraries/types/DataTypes.sol";
import {Errors} from "../libraries/Errors.sol";
import {IDelegationRegistry} from "../interfaces/IDelegationRegistry.sol";
import {PoolFund} from "../PoolFund.sol";
import {LibPausable} from "../libraries/LibPausable.sol";

contract NFBTournamentsFacet is INFBTournamentsFacet, ReentrancyGuard {
    using SafeMath for uint256;
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;

    function dstorage()
        internal
        pure
        returns (LibNFBTournamentsStorage.Storage storage ds)
    {
        return LibNFBTournamentsStorage.dstorage();
    }

    function initializeTournaments(DataTypes.TournamentsFacetArgs memory _args)
        external
    {
        LibOwnership.enforceIsContractOwner();
        require(
            _args.nfbBracketAddress != address(0),
            "NFBTournamentsFacet: Invalid bracket address"
        );
        dstorage().nfbBracketAddress = _args.nfbBracketAddress;
        dstorage().delegationRegistryAddress = _args.delegationRegistryAddress;
    }

    modifier notEmptyString(string calldata stringToCheck) {
        require(bytes(stringToCheck).length > 0, "Empty input string.");
        _;
    }

    function onlyWithTokenUri(string memory tokenUri) private pure {
        require(bytes(tokenUri).length != 0, "NFBR: Only with TokenUri");
    }

    function onlyWithCorrectLength(
        uint256 _tournamentId,
        DataTypes.Bracket memory bracket
    ) private view {
        uint256 bracketLength = LibNFBOracleStorage
            .dstorage()
            .tournamentToBracketLength[_tournamentId];

        if (bracket.teamsIds.length != bracketLength) {
            revert Errors.TournamentsFacet__InvalidBracketLength(
                _tournamentId,
                bracket.teamsIds.length,
                bracketLength
            );
        }
    }

    function addSportsLeague(string calldata name, DataTypes.Sport sport)
        external
        notEmptyString(name)
    {
        LibOwnership.enforceIsContractOwner();
        dstorage().lastSportsLeagueId.increment();
        uint256 newSportsLeagueId = dstorage().lastSportsLeagueId.current();
        DataTypes.SportsLeague memory newSportsLeague = DataTypes.SportsLeague(
            newSportsLeagueId,
            name,
            sport,
            true
        );

        dstorage().sportsLeagues[newSportsLeagueId] = newSportsLeague;

        emit LogAddSportsLeague(
            newSportsLeagueId,
            name,
            uint256(sport),
            msg.sender
        );
    }

    function disableSportsLeague(uint256 sportsLeagueId) external {
        LibOwnership.enforceIsContractOwner();
        dstorage().sportsLeagues[sportsLeagueId].isActive = false;

        emit LogDisableSportsLeague(sportsLeagueId, msg.sender);
    }

    // TOURNAMENT TYPES
    function addTournamentFormat(
        string calldata name,
        DataTypes.TournamentType tournamentType
    ) external notEmptyString(name) {
        LibOwnership.enforceIsContractOwner();

        dstorage().lastTournamentFormatId.increment();
        uint256 newTournamentFormatId = dstorage()
            .lastTournamentFormatId
            .current();
        DataTypes.TournamentFormat memory newTournamentFormat = DataTypes
            .TournamentFormat({
                id: newTournamentFormatId,
                name: name,
                tournamentType: tournamentType,
                isActive: true
            });

        dstorage().tournamentFormats[
            newTournamentFormatId
        ] = newTournamentFormat;

        emit LogAddTournamentFormat(
            newTournamentFormatId,
            name,
            uint256(tournamentType),
            msg.sender
        );
    }

    function disableTournamentFormat(uint256 tournamentFormatId) external {
        LibOwnership.enforceIsContractOwner();
        dstorage().tournamentFormats[tournamentFormatId].isActive = false;

        emit LogDisableTournamentFormat(tournamentFormatId, msg.sender);
    }

    // TOURNAMENTS
    function addTournament(
        uint256 sportsLeagueId,
        uint256 tournamentFormatId,
        string calldata name,
        uint256 openFrom, // tournament start date for pool creation
        uint256 openTo, // tournament end date for pool creation
        uint16 season
    ) external notEmptyString(name) {
        LibOwnership.enforceIsContractOwner();
        enforceSportsLeagueActive(sportsLeagueId);
        enforceTournamentFormatActive(tournamentFormatId);

        dstorage().lastTournamentId.increment();
        uint256 newTournamentId = dstorage().lastTournamentId.current();
        DataTypes.Tournament memory newTournament = DataTypes.Tournament({
            id: newTournamentId,
            name: name,
            sportsLeagueId: sportsLeagueId,
            tournamentFormatId: tournamentFormatId,
            openFrom: openFrom,
            openTo: openTo,
            season: season,
            isActive: true
        });

        dstorage().tournaments[newTournamentId] = newTournament;

        emit LogAddTournament(
            newTournamentId,
            sportsLeagueId,
            name,
            tournamentFormatId,
            season,
            openFrom,
            openTo,
            msg.sender
        );
    }

    /**
     * @dev Creates a new Pool (tournament instance) for a Tournament. Executed by user
     * @param _args.name - name of the pool
     * @param _args.tournamentId ID of the Tournament
     * @param _args.maxEntries - of the pool, could be 0 (unlimited)
     * @param _args.entryFee - the fee for other users to join (could be 0 - free access)
     * @param _args.poolCurrencyAddress - what currency (ERC20 contract) does the pool use for entryFee, royaltyAmount, prize distributions, etc
     * @param _args.accessTokenAddress - (ERC20 or ERC721 contract) the token required to be existing in user wallet (token gated access)
     * @param _args.accessTokenMinAmount; - the minimum amount required of the token for token gated access
     * @param _args.prizeModelType - enum for three options: PercentageOfEntryFees, SponsoredPrize, StakeToPlay (users' fee would be only staked and returned after the tournament + sponsored prize if someone sponsors the pool)
     * @param _args.prizeDistributionType - enum for Standard, WinnerTakesAll
     * @param _args.rewardDistributionId - added by admins, Top5, Top10, Top100, etc
     * @param _args.royaltyType - enum for Percentage, more in future?
     * @param _args.royaltyAmount - amount for the royaltyType option
     * @param _args.stakeToPlayAmount - if prizeModelType = StakeToPlay is chosen, stakeToPlayAmount should be entered (how much the users entering are required to stake to enter)
     * @param _args.isFeatured - only admin can set the tournament as Featured
     * @param _args.allowEditableBrackets - yes/no allow the pool to be joined by editable brackets
     * Requirements:
     *
     * Emits a {LogAddPool} event.
     */
    function addPool(DataTypes.AddPoolArgs calldata _args) external {
        enforceTournamentActive(_args.tournamentId);

        DataTypes.Tournament memory tournament = dstorage().tournaments[
            _args.tournamentId
        ];

        uint256 currentSeasonId = LibNFBOracleStorage
            .dstorage()
            .tournamentToTournamentSeasonId[_args.tournamentId];

        if (
            block.timestamp < tournament.openFrom || // TODO: admins should update this per tournament as well
            block.timestamp > tournament.openTo ||
            block.timestamp >=
            LibNFBOracleStorage.dstorage().tournamentToRoundsBounds[
                _args.tournamentId
            ][1][0]
        ) {
            revert Errors.TournamentsFacet__TournamentClosedForPoolCreation(
                _args.tournamentId,
                LibNFBCoreStorage._msgSender()
            );
        }

        if (_args.prizeModelType == DataTypes.PrizeModelType.StakeToPlay) {
            if (_args.entryFee > 0) {
                revert Errors.TournamentsFacet__StakeToPlayShouldntHaveEntryFee(
                        _args.tournamentId,
                        LibNFBCoreStorage._msgSender()
                    );
            }

            if (_args.stakeToPlayAmount == 0) {
                revert Errors.TournamentsFacet__StakeToPlayShouldHaveAmount(
                    _args.tournamentId,
                    LibNFBCoreStorage._msgSender()
                );
            }
        }

        if (
            LibNFBRewardPoolStorage
                .dstorage()
                .rewardDistributions[_args.rewardDistributionId]
                .rewardRanges
                .length == 0
        ) {
            revert Errors.TournamentsFacet__RewardDistributionNotFound(
                _args.rewardDistributionId,
                LibNFBCoreStorage._msgSender()
            );
        }

        // By Hris: when current tournament dont expect more brackets to be submited (tourn. closed) the season in oracle must be incremented
        dstorage().lastPoolId.increment();
        uint256 newPoolId = dstorage().lastPoolId.current();

        DataTypes.Pool memory newPool = DataTypes.Pool({
            id: newPoolId,
            name: _args.name,
            tournamentId: _args.tournamentId,
            maxEntries: _args.maxEntries,
            entries: 0,
            entryFee: _args.entryFee,
            poolCurrencyAddress: _args.poolCurrencyAddress,
            accessTokenAddress: _args.accessTokenAddress,
            accessTokenMinAmount: _args.accessTokenMinAmount,
            prizeModelType: _args.prizeModelType,
            stakeToPlayAmount: _args.stakeToPlayAmount,
            prizeDistributionType: _args.prizeDistributionType,
            rewardDistributionId: _args.rewardDistributionId,
            royaltyType: _args.royaltyType,
            royaltyAmount: _args.royaltyAmount,
            totalPrizePoolAmount: 0,
            allowEditableBrackets: _args.allowEditableBrackets,
            seasonId: currentSeasonId,
            isFeatured: _args.isFeatured,
            creatorAddress: LibNFBCoreStorage._msgSender(),
            poolFundAddress: address(new PoolFund(_args.poolCurrencyAddress))
        });

        dstorage().pools[newPoolId] = newPool;

        DataTypes.RewardDistribution
            memory rewardDistribution = LibNFBRewardPoolStorage
                .getRewardDistribution(newPool.rewardDistributionId);

        LibNFBCoreStorage.dstorage().poolWinningBrackets[
            newPoolId
        ] = new uint256[](rewardDistribution.maxWinnersCount);

        emitNewPool(newPool);
    }

    // needed this to get past stack too deep error
    function emitNewPool(DataTypes.Pool memory _pool) internal {
        emit LogAddPool(
            _pool.id,
            _pool.tournamentId,
            _pool.name,
            _pool.entryFee,
            uint256(_pool.prizeModelType),
            _pool.stakeToPlayAmount,
            _pool.accessTokenAddress,
            _pool.rewardDistributionId,
            _pool.royaltyType,
            _pool.royaltyAmount,
            _pool.allowEditableBrackets,
            _pool.poolCurrencyAddress,
            _pool.poolFundAddress,
            LibNFBCoreStorage._msgSender()
        );
    }

    /**
     * @dev Enters pool with existing NFT or mints an NFT from the nfbBracket contract and updates the reward pool with the entry fee amount
     * @param _poolId pool to enter
     * @param _tokenId should be != 0 if entering with already existing NFT
     * @param _bracket array of all the predictions as raw data that the user has committed. Will be used to generate hash against the current bracket and stored in the nfbBracket
     * @param _tokenUri ipfs hash where the raw data will be stored.
     * @param _isEditableBracket yes/no whether the bracket can be edited after creation. Editable bracket cannot join non-editable pool.
     * @param _accessTokenColdWalletAddress if the user uses a delegated hot wallet (he's having his NFTs in a cold wallet) he can pass the cold wallet address here
     * Requirements:
     *
     * - `tokenUri` must be passed.
     * - `bracket` must be filled with number of elements specified for its tournament type.
     * - `block.timestamp` must be before the tournament has started.
     *
     * Emits a {LogPoolEntered} event.
     */
    function enterPool(
        uint256 _poolId,
        uint256 _tokenId,
        DataTypes.Bracket calldata _bracket,
        string calldata _tokenUri,
        bool _isEditableBracket,
        address _accessTokenColdWalletAddress
    ) external {
        onlyWithTokenUri(_tokenUri);

        DataTypes.Pool storage pool = dstorage().pools[_poolId];
        if (pool.id == 0) {
            revert Errors.TournamentsFacet__PoolDoesntExist(
                _poolId,
                LibNFBCoreStorage._msgSender()
            );
        }

        // if already existing tokenId
        if (_tokenId != 0) {
            // if the existing tokenId is in the current pool already
            if (dstorage().poolTokenIds[_poolId][_tokenId])
                revert Errors.TournamentsFacet__TokenAlreadyInPool(
                    _poolId,
                    _tokenId,
                    LibNFBCoreStorage._msgSender()
                );

            // if for the same tokenId is passed a different than stored bracket
            if (
                NFBBracket(dstorage().nfbBracketAddress).tokenIdTokenHash(
                    _tokenId
                ) != keccak256(abi.encode(_bracket))
            ) {
                revert Errors.TournamentsFacet__BracketDifferentFromExisting(
                    _poolId,
                    _tokenId,
                    LibNFBCoreStorage._msgSender()
                );
            }

            _isEditableBracket = NFBBracket(dstorage().nfbBracketAddress)
                .isEditableBracket(_tokenId);
        }

        // if entering non editable pool with editable bracket
        if (!pool.allowEditableBrackets && _isEditableBracket) {
            revert Errors.TournamentsFacet__PoolDoesntAllowEditableBrackets(
                _poolId,
                LibNFBCoreStorage._msgSender()
            );
        }

        uint256 currentSeasonId = LibNFBOracleStorage
            .dstorage()
            .tournamentToTournamentSeasonId[pool.tournamentId];

        if (pool.seasonId != currentSeasonId) {
            revert Errors.TournamentsFacet__CantEnterPoolFromAnotherSeason(
                _poolId,
                pool.seasonId,
                currentSeasonId,
                LibNFBCoreStorage._msgSender()
            );
        }

        // if pool is not for unlimited entries
        if (pool.maxEntries != 0 && pool.entries >= pool.maxEntries) {
            revert Errors.TournamentsFacet__PoolAlreadyFull(
                _poolId,
                LibNFBCoreStorage._msgSender()
            );
        }

        onlyWithCorrectLength(pool.tournamentId, _bracket);

        // if token gated
        if (pool.accessTokenAddress != address(0)) {
            // if delegated in delegate.cash wallet is used
            address walletToCheckForAccessToken = LibNFBCoreStorage
                ._msgSender();
            if (_accessTokenColdWalletAddress != address(0)) {
                bool isValidDelegate = IDelegationRegistry(
                    dstorage().delegationRegistryAddress
                ).checkDelegateForContract(
                        LibNFBCoreStorage._msgSender(),
                        _accessTokenColdWalletAddress,
                        pool.accessTokenAddress
                    ); // returns true if the msg.sender is a delegate of the _accessTokenColdWalletAddress for the pool.accessTokenAddress contract

                if (!isValidDelegate) {
                    revert Errors.TournamentsFacet__InvalidDelegateVaultPairing(
                            _poolId,
                            _accessTokenColdWalletAddress,
                            LibNFBCoreStorage._msgSender()
                        );
                }

                walletToCheckForAccessToken = _accessTokenColdWalletAddress;

                emit DelegateSuccessful(
                    _poolId,
                    walletToCheckForAccessToken,
                    LibNFBCoreStorage._msgSender()
                );
            }

            // TODO: Should check here if the token is ERC20 or ERC721 and then make the below check for balance
            uint256 accountBalance = IERC20(pool.accessTokenAddress).balanceOf(
                walletToCheckForAccessToken
            );
            if (accountBalance < pool.accessTokenMinAmount) {
                revert Errors.TournamentsFacet__NotEnoughAmountTokenGatedAccess(
                        _poolId,
                        accountBalance,
                        LibNFBCoreStorage._msgSender()
                    );
            }
        }

        // if tournament already started
        if (
            block.timestamp >=
            LibNFBOracleStorage.dstorage().tournamentToRoundsBounds[
                pool.tournamentId
            ][1][0]
        ) {
            revert Errors.TournamentsFacet__TournamentAlreadyStarted(
                pool.tournamentId,
                LibNFBCoreStorage._msgSender()
            );
        }

        // if pool is paid
        if (
            pool.prizeModelType ==
            DataTypes.PrizeModelType.PercentageOfEntryFees &&
            pool.entryFee > 0
        ) {
            IERC20(pool.poolCurrencyAddress).safeTransferFrom(
                LibNFBCoreStorage._msgSender(),
                pool.poolFundAddress, // the entry fees go to their pool's fund contract
                pool.entryFee
            );
        }

        // if pool is stake to play
        if (
            pool.prizeModelType == DataTypes.PrizeModelType.StakeToPlay &&
            pool.stakeToPlayAmount > 0
        ) {
            IERC20(pool.poolCurrencyAddress).safeTransferFrom( // staking tokens uses the same ERC20 as the entry fee
                LibNFBCoreStorage._msgSender(),
                address(this), // the stakes go directly to the diamond
                pool.stakeToPlayAmount
            );

            LibNFBRewardPoolStorage.updateStakePool(
                _poolId,
                LibNFBCoreStorage._msgSender(),
                pool.stakeToPlayAmount
            );
        }

        // if non existing bracket
        if (_tokenId == 0) {
            _tokenId = NFBBracket(dstorage().nfbBracketAddress).mint(
                LibNFBCoreStorage._msgSender(),
                _bracket,
                _tokenUri,
                _isEditableBracket
            );
        }

        pool.entries++;

        emit LogPoolEntered(_poolId, _tokenId, LibNFBCoreStorage._msgSender());
    }

    function enforceSportsLeagueActive(uint256 sportsLeagueId) private view {
        if (!dstorage().sportsLeagues[sportsLeagueId].isActive)
            revert Errors.TournamentsFacet__SportsLeagueNotActive(
                sportsLeagueId
            );
    }

    function enforceTournamentFormatActive(uint256 tournamentFormatId)
        private
        view
    {
        if (!dstorage().tournamentFormats[tournamentFormatId].isActive)
            revert Errors.TournamentsFacet__TournamentFormatNotActive(
                tournamentFormatId
            );
    }

    function enforceTournamentActive(uint256 tournamentId) private view {
        if (!dstorage().tournaments[tournamentId].isActive)
            revert Errors.TournamentsFacet__TournamentNotActive(tournamentId);
    }

    /**
     * @dev Checks if `teamID` is included in the last round emitted winners from `NFBOracle`.
     * @param teamID uint16 representing the id which is checked in the last round emitted winners from `NFBOracle`.
     * @param prevRoundStart uint8 representing the index where the last round starts.
     * @param prevRoundEnd uint8 representing the index where the last round ends.
     */
    function checkIdInLastRoundResults(
        uint256 tournamentId,
        uint256 teamID,
        uint8 prevRoundStart,
        uint8 prevRoundEnd
    ) private view returns (bool) {
        for (uint256 i = prevRoundStart; i <= prevRoundEnd; i++) {
            if (
                LibNFBOracleStorage
                    .dstorage()
                    .tournamentToBracketResults[tournamentId]
                    .teamsIds[i] == teamID
            ) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Updates an NFT bracket for already generated NFT.
     * @param args containing:
     *  - tokenId id which is going to be updated
     *  - tokenUri ipfs hash where the raw data will be stored.
     *  - oldBracket bracketArray as raw data that the user has previously generated
     *  - newBracket as raw data that the user has committed. Will be used to generate hash against the current bracket and overwrite the previously generated
     * Requirements:
     *
     * - `block.timestamp` must be before the tournament has started.
     *
     * Emits a {LogBracketUpdated} event.
     */
    function updateBracket(DataTypes.UpdateBracketArgs memory args)
        external
        nonReentrant
    {
        onlyWithTokenUri(args.tokenUri);

        DataTypes.UpdateBracketMemoryVars memory vars;

        vars.tournamentId = LibNFBTournamentsStorage.getTournamentIdByPoolId(
            args._poolId
        );

        onlyWithCorrectLength(vars.tournamentId, args.oldBracket);
        onlyWithCorrectLength(vars.tournamentId, args.newBracket);

        vars.round = LibNFBOracleStorage.dstorage().tournamentToRound[
            vars.tournamentId
        ];

        if (LibNFBCoreStorage.dstorage().nftUpdatePrice > 0) {
            IERC20(LibNFBCoreStorage.dstorage().dgenTokenAddress)
                .safeTransferFrom(
                    LibNFBCoreStorage._msgSender(),
                    LibNFBCoreStorage.dstorage().daoWalletAddress,
                    LibNFBCoreStorage.dstorage().nftUpdatePrice
                );
        }

        require(
            block.timestamp <
                LibNFBOracleStorage.dstorage().tournamentToRoundsBounds[
                    vars.tournamentId
                ][vars.round][0],
            "NFBR: Updates locked"
        );

        NFBBracket bracketContract = NFBBracket(dstorage().nfbBracketAddress);

        require(
            bracketContract.isEditableToken(args.tokenId),
            "NFBR: Bracket not editable!"
        );

        require(
            bracketContract.tokenIdTokenHash(args.tokenId) ==
                keccak256(abi.encode(args.oldBracket)),
            "NFBR: Invalid bracket"
        );

        vars.oldBracketTeamsIds = args.oldBracket.teamsIds;
        vars.newBracketTeamsIds = args.newBracket.teamsIds;
        vars.updatedBracketTeamsIds = new uint256[](
            args.newBracket.teamsIds.length
        );

        vars.oracleBracketTruthResults = LibNFBOracleStorage
            .dstorage()
            .tournamentToBracketResults[vars.tournamentId]
            .teamsIds;

        vars.tournamentRoundIndexes = LibNFBOracleStorage
            .dstorage()
            .tournamentToRoundIndexes[vars.tournamentId];

        vars.currRound = vars.round; // Current round in the bracket
        vars.startUpdateFromIndex = vars.tournamentRoundIndexes[
            vars.currRound - 1
        ]; // Index from where the elements in the bracket will be able to be changed
        {
            uint8 i = 0;

            vars.winnersPerRound = LibNFBOracleStorage
                .dstorage()
                .tournamentToWinnersPerRound[vars.tournamentId];

            vars.tournamentStart = LibNFBOracleStorage
                .dstorage()
                .tournamentToRoundsBounds[vars.tournamentId][1][0];

            vars.newBracketLen = vars.newBracketTeamsIds.length;

            for (i; i < vars.newBracketLen; i++) {
                // If the bracket is tried to be updated before the start of the tournament, no additional checks for passed matches are needed
                if (block.timestamp < vars.tournamentStart) {
                    vars.updatedBracketTeamsIds = vars.newBracketTeamsIds;
                    break;
                }
                if (i < vars.startUpdateFromIndex) {
                    vars.updatedBracketTeamsIds[i] = vars.oldBracketTeamsIds[i];
                    continue;
                }
                uint8 to = vars.winnersPerRound[vars.currRound - 1] - 1;
                for (uint8 j = 0; j <= to; j++) {
                    uint8 prevRoundMatchIdx1 = (i -
                        vars.winnersPerRound[vars.currRound - 2]) + (j * 2);
                    uint8 prevRoundMatchIdx2 = (i -
                        vars.winnersPerRound[vars.currRound - 2]) + (j * 2 + 1);
                    {
                        if (vars.round == vars.currRound) {
                            if (
                                vars.newBracketTeamsIds[i + j] !=
                                vars.oldBracketTeamsIds[i + j]
                            ) {
                                // Validate if `teamId` exists in the previous round in `oldBracket` and in the results from `NFBOracle`
                                require(
                                    ((vars.newBracketTeamsIds[i + j] ==
                                        vars.oracleBracketTruthResults[
                                            prevRoundMatchIdx1
                                        ] &&
                                        vars.newBracketTeamsIds[i + j] ==
                                        vars.oldBracketTeamsIds[
                                            prevRoundMatchIdx1
                                        ]) &&
                                        (vars.newBracketTeamsIds[
                                            prevRoundMatchIdx2
                                        ] ==
                                            vars.oracleBracketTruthResults[
                                                prevRoundMatchIdx2
                                            ] &&
                                            vars.newBracketTeamsIds[
                                                prevRoundMatchIdx2
                                            ] ==
                                            vars.oldBracketTeamsIds[
                                                prevRoundMatchIdx2
                                            ])) ||
                                        ((vars.newBracketTeamsIds[i + j] ==
                                            vars.oracleBracketTruthResults[
                                                prevRoundMatchIdx2
                                            ] &&
                                            vars.newBracketTeamsIds[i + j] ==
                                            vars.oldBracketTeamsIds[
                                                prevRoundMatchIdx2
                                            ]) &&
                                            (vars.newBracketTeamsIds[
                                                prevRoundMatchIdx1
                                            ] ==
                                                vars.oracleBracketTruthResults[
                                                        prevRoundMatchIdx1
                                                    ] &&
                                                vars.newBracketTeamsIds[
                                                    prevRoundMatchIdx1
                                                ] ==
                                                vars.oldBracketTeamsIds[
                                                    prevRoundMatchIdx1
                                                ])),
                                    "NFBR: Invalid update"
                                );
                            } else {
                                vars.updatedBracketTeamsIds[i + j] = vars
                                    .oldBracketTeamsIds[i + j];
                            }
                        }
                    }
                    if (vars.currRound > vars.round) {
                        bool checkIdInLastRoundNewBracket = vars
                            .newBracketTeamsIds[i + j] ==
                            vars.newBracketTeamsIds[prevRoundMatchIdx1] ||
                            vars.newBracketTeamsIds[i + j] ==
                            vars.newBracketTeamsIds[prevRoundMatchIdx2];
                        // Validate if `teamId` exists in the previous round in `newBracket` and if `teamId` exists in the previous round in bracket results
                        require(
                            ((vars.newBracketTeamsIds[i + j] ==
                                vars.oldBracketTeamsIds[i + j]) &&
                                checkIdInLastRoundNewBracket) ||
                                ((checkIdInLastRoundNewBracket &&
                                    checkIdInLastRoundResults(
                                        vars.tournamentId,
                                        vars.newBracketTeamsIds[i + j],
                                        vars.startUpdateFromIndex -
                                            vars.winnersPerRound[
                                                vars.round - 2
                                            ],
                                        vars.startUpdateFromIndex - 1
                                    )) &&
                                    checkIdInLastRoundResults(
                                        vars.tournamentId,
                                        vars.oldBracketTeamsIds[i + j],
                                        vars.startUpdateFromIndex -
                                            vars.winnersPerRound[
                                                vars.round - 2
                                            ],
                                        vars.startUpdateFromIndex - 1
                                    )),
                            "NFBR: Invalid update"
                        );
                    }
                    vars.updatedBracketTeamsIds[i + j] = vars
                        .newBracketTeamsIds[i + j];
                }
                vars.currRound++;
                i += to;
            }
        }

        bracketContract.update(
            LibNFBCoreStorage._msgSender(),
            vars.updatedBracketTeamsIds,
            args
        );
        emit LogBracketUpdated(
            args.newBracket,
            LibNFBCoreStorage._msgSender(),
            args._poolId,
            args.tokenId,
            vars.startUpdateFromIndex
        );
    }
}

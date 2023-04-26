// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/INFBCoreFacet.sol";
import "./libraries/types/DataTypes.sol";

contract NFBBracket is ERC721, Ownable, AccessControl {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    mapping(uint256 => string) public tokenIdToTokenURI; // IPFS hash where we could retrieve the raw data for a given nfbBracket.
    mapping(uint256 => bytes32) public tokenIdTokenHash;
    mapping(uint256 => uint16) public tokenIdToNumberOfUpdates;
    mapping(uint256 => bool) public isEditableToken;
    mapping(uint256 => DataTypes.FinalsScores)
        public tokenIdToFinalsScoresPredictions;

    string public baseURI;

    bytes32 constant HANDLER_ROLE = keccak256("HANDLER_ROLE");

    event LogBaseURISet(address triggeredBy, string newBase);
    event LogBracketMinted(
        DataTypes.Bracket bracket,
        address triggeredBy,
        uint256 tokenId
    );

    constructor() ERC721("NFBBracket", "NFBB") {}

    /**
     * @notice Setting the URL prefix for tokens metadata
     * @param _newBase   New prefix to be used
     */
    function setMetadataBase(string memory _newBase) external onlyOwner {
        baseURI = _newBase;
        emit LogBaseURISet(msg.sender, _newBase);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @notice Allows only certain address to be able to call the token functions
     * @param handlerContractAddress The contract with permissions to mint and update NTFs
     */
    function setupHandlerAddress(address handlerContractAddress)
        external
        onlyOwner
    {
        _setupRole(HANDLER_ROLE, handlerContractAddress);
    }

    /**
     * @dev Mints an NFT and stores its `tokenUri` where the raw data lives, as well as the hash representation of it.
     * @param to nft receiver address.
     * @param bracket struct containing an array of the winners predicted by the user, in correct order and the scores of the teams that will meet at the finals.
     * @param tokenUri ipfs hash where the raw data will be stored.
     * Requirements:
     *
     * - can be called from the Diamond contract only
     */
    function mint(
        address to,
        DataTypes.Bracket memory bracket,
        string memory tokenUri,
        bool _isEditableBracket
    ) external onlyRole(HANDLER_ROLE) returns (uint256 newTokenId) {
        _tokenIds.increment();

        newTokenId = _tokenIds.current();
        tokenIdToTokenURI[newTokenId] = tokenUri;
        isEditableToken[newTokenId] = _isEditableBracket;

        DataTypes.FinalsScores memory finalsScores = DataTypes.FinalsScores(
            bracket.finalsTeamOneScore,
            bracket.finalsTeamTwoScore
        );

        tokenIdToFinalsScoresPredictions[newTokenId] = finalsScores;

        bytes32 bracketHash = keccak256(abi.encode(bracket));

        tokenIdTokenHash[newTokenId] = bracketHash;

        _safeMint(to, newTokenId);
        emit LogBracketMinted(bracket, to, newTokenId);
    }

    /**
     * @dev Updates an NFT and overrides its `tokenUri` as well as the `tokenIdTokenHash`
     * @param from owner of the NFT
     * @param updatedBracketTeamsIds array of all the  newpredictions as raw data that the user has now updated
     * @param updateBracketArgs arguments, containing:
     * - tokenId: the token id that is being updated
     * - tokenUri: uri of the token
     * - newBracket: struct of the new bracket
     * Requirements:
     * - only the owner of the NFT can initiate an update
     * - can be called from the Diamond contract only
     */
    function update(
        address from,
        uint256[] memory updatedBracketTeamsIds,
        DataTypes.UpdateBracketArgs memory updateBracketArgs
    ) external onlyRole(HANDLER_ROLE) {
        require(
            _isApprovedOrOwner(from, updateBracketArgs.tokenId),
            "NFBBracket: only approved or owner can update"
        );

        DataTypes.FinalsScores memory finalsScores = DataTypes.FinalsScores(
            updateBracketArgs.newBracket.finalsTeamOneScore,
            updateBracketArgs.newBracket.finalsTeamTwoScore
        );

        tokenIdToFinalsScoresPredictions[
            updateBracketArgs.tokenId
        ] = finalsScores;

        DataTypes.Bracket memory updatedBracket = DataTypes.Bracket(
            updatedBracketTeamsIds,
            updateBracketArgs.newBracket.finalsTeamOneScore,
            updateBracketArgs.newBracket.finalsTeamTwoScore
        );

        tokenIdToTokenURI[updateBracketArgs.tokenId] = updateBracketArgs
            .tokenUri;
        tokenIdTokenHash[updateBracketArgs.tokenId] = keccak256(
            abi.encode(updatedBracket)
        );
        tokenIdToNumberOfUpdates[updateBracketArgs.tokenId]++;
    }

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`.
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     *
     * @return tokenUri where the metadata is stored.
     */
    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(_exists(tokenId), "NFBBracket: nonexistent token");

        string memory _base = _baseURI();
        return
            bytes(_base).length > 0
                ? string(abi.encodePacked(_base, tokenIdToTokenURI[tokenId]))
                : "";
    }

    function isEditableBracket(uint256 _tokenId) external view returns (bool) {
        return isEditableToken[_tokenId];
    }
}

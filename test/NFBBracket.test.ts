import hre, { ethers } from "hardhat";
import { expect } from "chai";
import { ERC20Mock, Diamond, NFBBracket, IDiamond } from "../typechain";
import { Deployer } from "../utils/deployer";
import { Signer, ContractFactory, Contract } from "ethers";
import {
  nftUpdatePrice,
  zeroAddress,
  bracketStruct,
  mockIpfsUri,
  testAddress,
  testTokenId,
  ONE_HOUR,
  tournamentStage,
  bracketLength,
  roundIndexes,
  tournamentsTestConstants,
} from "../test/helpers/constants";
import Users from "../test/helpers/users";
import { getTournamentParams, getBracketHash } from "../test/helpers/helpers";
import { init } from "../test/helpers/initContracts";
import { token } from "../typechain/@openzeppelin/contracts";

describe("NFBBracket tests", function () {
  let nfbDiamond: IDiamond;
  let users: Users;
  let snapshotId: any;

  let erc20Mock: ERC20Mock;
  let nfbBracket: NFBBracket;
  const mockBase: string = "https://mockuri.test/";
  let handlerRole: string;
  let addPoolArgs: any;

  before(async function () {
    const signers = await ethers.getSigners();
    users = new Users(signers);

    [nfbDiamond, nfbBracket, erc20Mock] = await init(users);

    handlerRole = await nfbBracket.HANDLER_ROLE();

    addPoolArgs = tournamentsTestConstants.args.addPoolArgs;
    addPoolArgs.poolCurrencyAddress = erc20Mock.address;
    addPoolArgs.accessTokenAddress = erc20Mock.address;
  });

  beforeEach(async function () {
    snapshotId = await ethers.provider.send("evm_snapshot", []);

    const {
      roundStart,
      roundEnd,
      tournamentStage,
      bracketLength,
      bracketMaximumPoints,
    } = await getTournamentParams();

    await nfbDiamond.setRoundBounds(
      tournamentsTestConstants.args.TournamentFormatId,
      1,
      roundStart,
      roundEnd
    );

    await nfbBracket.setMetadataBase(mockBase);

    await erc20Mock
      .connect(users.user1.signer)
      .approve(nfbDiamond.address, ethers.BigNumber.from(price));
    await nfbDiamond.addTournamentFormat(
      tournamentsTestConstants.args.TournamentFormatName,
      tournamentsTestConstants.args.TournamentType
    );
    await nfbDiamond.addSportsLeague(
      tournamentsTestConstants.args.SportsLeagueName,
      tournamentsTestConstants.args.Sport
    );
    await nfbDiamond.addTournament(
      tournamentsTestConstants.args.SportsLeagueIdFootball,
      tournamentsTestConstants.args.TournamentFormatId,
      tournamentsTestConstants.args.TournamentName,
      tournamentsTestConstants.args.openFrom,
      tournamentsTestConstants.args.openTo,
      tournamentsTestConstants.args.TournamentSeason
    );
    await nfbDiamond.setBracketLength(
      tournamentsTestConstants.args.TournamentFormatId,
      bracketLength
    );
    await nfbDiamond.setMaximumPoints(
      tournamentsTestConstants.args.TournamentFormatId,
      bracketMaximumPoints
    );
    await nfbDiamond.addPool(addPoolArgs);
    await nfbDiamond
      .connect(users.user1.signer)
      .enterPool(
        ethers.BigNumber.from(tournamentsTestConstants.args.PoolId),
        0,
        bracketStruct,
        mockIpfsUri,
        false,
        zeroAddress
      );
  });

  afterEach(async function () {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  it("should deploy Diamond contract", async function () {
    expect(nfbDiamond).to.not.equal(zeroAddress);
  });

  context("for setting Base URI", () => {
    it("should emit LogBaseURISet event", async function () {
      await expect(nfbBracket.setMetadataBase(mockBase))
        .to.be.emit(nfbBracket, "LogBaseURISet")
        .withArgs(users.deployer.address, mockBase);
    });

    it("must fail to set setMetadataBase if not called from owner", async function () {
      await expect(
        nfbBracket.connect(users.user1.signer).setMetadataBase(mockBase)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should updated baseURI properly", async function () {
      await nfbBracket.setMetadataBase(mockBase);
      const baseUri = await nfbBracket.baseURI();
      expect(baseUri, "URI have not been updated properly").to.equal(mockBase);
    });
  });

  context("for tokenURI", () => {
    it("should get the correct tokenIdToTokenURI", async () => {
      const tokenUri = await nfbBracket.tokenIdToTokenURI(
        ethers.BigNumber.from(1)
      );
      console.log("tokenuri: ", tokenUri);
      expect(tokenUri, "not set properly").to.equal(mockIpfsUri);
    });

    it("should get the correct tokenURI", async () => {
      const expectedTokenURI = mockBase + mockIpfsUri;
      const tokenUri = await nfbBracket.tokenURI(1);
      expect(expectedTokenURI, "not set properly").to.equal(tokenUri);
    });

    it("must fail if called with non existing token", async () => {
      await expect(nfbBracket.tokenURI(2)).to.be.revertedWith(
        "NFBBracket: nonexistent token"
      );
    });
  });

  context("for Mint", () => {
    it("should mint bracket", async function () {
      await erc20Mock
        .connect(users.user1.signer)
        .approve(nfbDiamond.address, price);

      await nfbDiamond
        .connect(users.user1.signer)
        .enterPool(
          tournamentsTestConstants.args.PoolId,
          0,
          bracketStruct,
          mockIpfsUri,
          false,
          zeroAddress
        );

      const expectedHash = getBracketHash(bracketStruct);

      const tokenUri = await nfbBracket.tokenIdToTokenURI(1);
      const tokenHash = await nfbBracket.tokenIdTokenHash(1);
      const tokenUpdates = await nfbBracket.tokenIdToNumberOfUpdates(1);

      expect(tokenUri).to.equal(mockIpfsUri);
      expect(tokenHash).to.equal(expectedHash);
      expect(tokenUpdates).to.equal(0);
    });

    it("must fail to mint bracket if caller doesn't have HANDLER_ROLE (the Diamond)", async function () {
      await expect(
        nfbBracket
          .connect(users.user1.signer)
          .mint(users.user1.address, bracketStruct, mockIpfsUri, false)
      ).to.be.reverted;
    });
  });

  // TODO: fix update bracket tests after implementing update
  // context("for Update", () => {
  //   beforeEach(async function () {
  //     await erc20Mock
  //       .connect(users.user1.signer)
  //       .approve(nfbDiamond.address, price);

  //     await nfbDiamond
  //       .connect(users.user1.signer)
  //       .enterPool(
  //         tournamentsTestConstants.args.PoolId,
  //         0,
  //         bracketArray,
  //         mockIpfsUri,
  //         false
  //       );
  //   });

  //   it("should update bracket before the start of the tournament", async function () {
  //     const tokenUriBefore = await nfbBracket.tokenIdToTokenURI(1);
  //     const tokenHashBefore = await nfbBracket.tokenIdTokenHash(1);
  //     const tokenUpdatesBefore = await nfbBracket.tokenIdToNumberOfUpdates(1);

  //     const newIpfsUri = "newIpfsUri1234";
  //     const clonedBracket = bracketArray.slice(0); // Create new instance of the test bracket array
  //     clonedBracket.splice(50, 1, 99); // Change one of the elements
  //     const expectedHashAfterUpdate = getBracketHash(clonedBracket);

  //     await erc20Mock
  //       .connect(users.user1.signer)
  //       .approve(nfbDiamond.address, nftUpdatePrice);

  //     await nfbDiamond
  //       .connect(users.user1.signer)
  //       .updateBracket(
  //         tournamentsTestConstants.TournamentFormatId,
  //         testTokenId,
  //         newIpfsUri,
  //         bracketArray,
  //         clonedBracket
  //       );

  //     const tokenUriAfter = await nfbBracket.tokenIdToTokenURI(1);
  //     const tokenHashAfter = await nfbBracket.tokenIdTokenHash(1);
  //     const tokenUpdatesAfter = await nfbBracket.tokenIdToNumberOfUpdates(1);

  //     expect(tokenUriBefore).to.not.equal(newIpfsUri);
  //     expect(tokenUriAfter).to.equal(newIpfsUri);
  //     expect(tokenHashBefore).not.to.equal(tokenHashAfter);
  //     expect(tokenHashAfter).to.equal(expectedHashAfterUpdate);
  //     expect(tokenUpdatesAfter).to.equal(tokenUpdatesBefore + 1);
  //   });

  //   it("should update bracket before the final match", async function () {
  //     const tokenHashBefore = await nfbBracket.tokenIdTokenHash(1);

  //     const clonedBracket = bracketArray.slice(0); // Create new instance of the test bracket array
  //     clonedBracket.splice(62, 1, 99); // Change one of the elements

  //     const expectedHashAfterUpdate = getBracketHash(clonedBracket);

  //     await erc20Mock
  //       .connect(users.user1.signer)
  //       .approve(nfbDiamond.address, nftUpdatePrice);

  //     // Update rounds 4 times in order to be in the 5th
  //     // meaning that all winners of the tournament are recorded
  //     // except the championship winner
  //     for (let i = 0; i < 4; i++) {
  //       await nfbDiamond.updateRound(tournamentsTestConstants.TournamentFormatId);
  //     }

  //     const { roundStart, roundEnd } = await getTournamentParams();

  //     await nfbDiamond.setRoundBounds(
  //       tournamentsTestConstants.TournamentFormatId,
  //       5,
  //       roundStart + ONE_HOUR * 4,
  //       roundEnd + ONE_HOUR * 4
  //     );

  //     await nfbDiamond
  //       .connect(users.user1.signer)
  //       .updateBracket(
  //         tournamentsTestConstants.TournamentFormatId,
  //         testTokenId,
  //         mockIpfsUri,
  //         bracketArray,
  //         clonedBracket
  //       );

  //     const tokenHashAfter = await nfbBracket.tokenIdTokenHash(1);

  //     expect(tokenHashBefore).not.to.equal(tokenHashAfter);
  //     expect(expectedHashAfterUpdate).to.equal(tokenHashAfter);
  //   });

  //   it("must fail to update bracket if caller doesn't have HANDLER_ROLE (the Diamond)", async function () {
  //     await expect(
  //       nfbBracket
  //         .connect(users.user1.signer)
  //         .update(users.user1.address, testTokenId, bracketArray, mockIpfsUri)
  //     ).to.be.reverted;
  //   });

  //   it("must fail to update bracket if user is not approved or owner", async function () {
  //     await erc20Mock
  //       .connect(users.user1.signer)
  //       .transfer(users.deployer.address, nftUpdatePrice); // Send ERC20 to deployer, who will try to update "user's" bracket

  //     const clonedBracket = bracketArray.slice(0); // Create new instance of the test bracket array
  //     clonedBracket.splice(50, 1, 99); // Change one of the elements

  //     await erc20Mock
  //       .connect(users.deployer.signer)
  //       .approve(nfbDiamond.address, nftUpdatePrice);

  //     await expect(
  //       nfbDiamond
  //         .connect(users.deployer.signer) // Deployer is not owner or approved.
  //         .updateBracket(
  //           tournamentsTestConstants.TournamentFormatId,
  //           testTokenId,
  //           mockIpfsUri,
  //           bracketArray,
  //           clonedBracket
  //         )
  //     ).to.be.revertedWith("NFBBracket: only approved or owner can update");
  //   });
  // });
});

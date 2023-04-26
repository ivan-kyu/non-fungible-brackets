import hre, { ethers } from "hardhat";
import { expect } from "chai";
import { ERC20Mock, Diamond, NFBBracket, IDiamond } from "../typechain";
import { Deployer } from "../utils/deployer";
import { Signer, ContractFactory, Contract } from "ethers";
import {
  price,
  updatePrice,
  zeroAddress,
  bracketArray,
  mockIpfsUri,
  testAddress,
  testTokenId,
  ONE_HOUR,
  tournamentStage,
  bracketLength,
  roundIndexes,
  roundWinners,
  maxPoints,
  tournamentsTestConstants,
} from "./helpers/constants";
import Users from "./helpers/users";
import {
  getTournamentParams,
  getBracketHash,
  generateBracket,
} from "./helpers/helpers";
import { init } from "./helpers/initContracts";

describe("NFBOracleFacet tests", function () {
  let nfbDiamond: IDiamond;
  let users: Users;
  let snapshotId: any;
  let userAddress: string;

  let erc20Mock: ERC20Mock;
  let nfbBracket: NFBBracket;
  const mockBase: string = "https://mockuri.test/";
  let handlerRole: string;
  const updaterRole: string =
    "0x73e573f9566d61418a34d5de3ff49360f9c51fec37f7486551670290f6285dab"; // keccak256("UPDATER_ROLE");

  before(async function () {
    const signers = await ethers.getSigners();
    users = new Users(signers);

    [nfbDiamond, nfbBracket, erc20Mock] = await init(users);

    handlerRole = await nfbBracket.HANDLER_ROLE();

    userAddress = users.user1.address;
  });

  beforeEach(async function () {
    const { roundStart, roundEnd, tournamentStage, bracketLength } =
      await getTournamentParams();

    await nfbDiamond.setRoundBounds(
      tournamentsTestConstants.args.TournamentFormatId,
      1,
      roundStart,
      roundEnd
    );

    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async function () {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  context("for setRoundBounds", () => {
    it("should set round bounds in each round", async function () {
      // Simulate setting the bounds for each round
      let extraTimeStart = 0;
      let extraTimeEnd = 0;

      for (let i = 1; i <= 5; i++) {
        const blockNumber = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNumber);

        extraTimeStart += 2 * ONE_HOUR + extraTimeEnd;
        extraTimeEnd += 3 * ONE_HOUR + extraTimeStart;

        const start = block.timestamp + extraTimeStart;
        const end = block.timestamp + extraTimeEnd;

        await expect(
          nfbDiamond.setRoundBounds(
            tournamentsTestConstants.args.TournamentFormatId,
            i + 1,
            start,
            end
          )
        )
          .to.emit(nfbDiamond, "LogSetRoundBounds")
          .withArgs(i + 1, start, end);

        const resultRoundStart = await nfbDiamond.getRoundsBounds(
          tournamentsTestConstants.args.TournamentFormatId,
          i + 1,
          0
        );
        const resultRoundEnd = await nfbDiamond.getRoundsBounds(
          tournamentsTestConstants.args.TournamentFormatId,
          i + 1,
          1
        );

        expect(resultRoundStart).to.be.equal(start);
        expect(resultRoundEnd).to.be.equal(end);

        await nfbDiamond.updateRound(
          tournamentsTestConstants.args.TournamentFormatId
        );
      }
    });

    it("must fail to set round bounds if round isn't in the range 1 - 6", async function () {
      const { roundStart, roundEnd } = await getTournamentParams();

      await expect(
        nfbDiamond.setRoundBounds(
          tournamentsTestConstants.args.TournamentFormatId,
          1,
          roundEnd,
          roundStart
        )
      ).to.be.revertedWith("NFBO: Invalid end round");
    });

    it("must fail to set round bounds if start timestamp is lower than the current", async function () {
      const { roundEnd } = await getTournamentParams();

      await expect(
        nfbDiamond.setRoundBounds(
          tournamentsTestConstants.args.TournamentFormatId,
          1,
          0,
          roundEnd
        )
      ) // Start timestamp is 0
        .to.be.revertedWith("NFBO: Invalid start round");
    });

    it("must fail to set round bounds if end timestamp is lower than the start", async function () {
      const { roundStart, roundEnd } = await getTournamentParams();

      await expect(
        nfbDiamond.setRoundBounds(
          tournamentsTestConstants.args.TournamentFormatId,
          1,
          roundEnd,
          roundStart
        )
      ).to.be.revertedWith("NFBO: Invalid end round");
    });

    it("must fail to set round bounds if start timestamp is lower than the end timestamp from the previous round", async function () {
      const { roundStart, roundEnd } = await getTournamentParams();

      await nfbDiamond.setRoundBounds(
        tournamentsTestConstants.args.TournamentFormatId,
        // Set 1st round params
        1,
        roundStart + ONE_HOUR,
        roundEnd + ONE_HOUR * 2
      );

      await expect(
        // Set 2nd round params with lower start timestamp
        nfbDiamond.setRoundBounds(
          tournamentsTestConstants.args.TournamentFormatId,
          2,
          roundStart,
          roundEnd
        )
      ).to.be.revertedWith("NFBO: Invalid round params");
    });

    it("must fail to set round bounds if caller doesn't have updater role", async function () {
      const { roundStart, roundEnd } = await getTournamentParams();

      await expect(
        nfbDiamond
          .connect(users.user1.signer)
          .setRoundBounds(
            tournamentsTestConstants.args.TournamentFormatId,
            1,
            roundStart,
            roundEnd
          )
      ).to.be.revertedWith(
        `AccessControl: account ${users.user1.address.toLowerCase()} is missing role ${updaterRole}`
      );
    });
  });

  context("for access control", () => {
    it("should grant updater role", async () => {
      let isUpdater = await nfbDiamond.hasRole(updaterRole, userAddress);

      expect(isUpdater).to.equal(false);

      await nfbDiamond.grantRole(updaterRole, userAddress);

      isUpdater = await nfbDiamond.hasRole(updaterRole, userAddress);

      expect(isUpdater).to.equal(true);
    });

    it("should revoke role if necessary", async () => {
      await nfbDiamond.grantRole(updaterRole, userAddress);

      let isUpdater = await nfbDiamond.hasRole(updaterRole, userAddress);
      expect(isUpdater).to.equal(true);

      await nfbDiamond.revokeRole(updaterRole, userAddress);

      isUpdater = await nfbDiamond.hasRole(updaterRole, userAddress);
      expect(isUpdater).to.equal(false);
    });

    it("must fail if non admin tries to setup a role", async () => {
      const adminRole = await nfbDiamond.getDefaultAdmin();

      await expect(
        nfbDiamond
          .connect(users.user1.signer)
          .grantRole(updaterRole, userAddress)
      ).to.be.revertedWith(
        `AccessControl: account ${userAddress.toLowerCase()} is missing role ${adminRole}`
      );
    });

    it("should successfully update round with updater role", async () => {
      await nfbDiamond.grantRole(updaterRole, userAddress);

      await expect(
        nfbDiamond
          .connect(users.user1.signer)
          .updateRound(tournamentsTestConstants.args.TournamentFormatId)
      ).to.emit(nfbDiamond, "LogRoundUpdated");
    });

    it("should successfully update bracketResults with updater role", async () => {
      await nfbDiamond.grantRole(updaterRole, userAddress);

      await expect(
        nfbDiamond
          .connect(users.user1.signer)
          .updateBracketResults(
            tournamentsTestConstants.args.TournamentFormatId,
            bracketArray
          )
      ).to.emit(nfbDiamond, "LogBracketResultsUpdated");
    });
  });

  context("for updateBracketResults", () => {
    it("should update bracket", async function () {
      await expect(
        nfbDiamond.updateBracketResults(
          tournamentsTestConstants.args.TournamentFormatId,
          bracketArray
        )
      )
        .to.emit(nfbDiamond, "LogBracketResultsUpdated")
        .withArgs(users.deployer.address, bracketArray);

      for (let i = 0; i < bracketArray.length; i++) {
        const bracketResult = await nfbDiamond.getBracketResults(
          tournamentsTestConstants.args.TournamentFormatId,
          i
        );
        expect(bracketResult).to.equal(bracketArray[i]);
      }
    });

    it("must fail to update bracket if lengths don't match", async function () {
      const fakeFirstRoundWinners = bracketArray.slice(0, bracketLength - 1);

      await expect(
        nfbDiamond.updateBracketResults(
          tournamentsTestConstants.args.TournamentFormatId,
          fakeFirstRoundWinners
        )
      ).to.be.revertedWith("NFBO: lengths don't match");
    });

    it("must fail to update bracket results if nfbDiamond is paused", async function () {
      const firstRoundWinners = bracketArray.slice(0, 32);

      await nfbDiamond.pause();

      await expect(
        nfbDiamond.updateBracketResults(
          tournamentsTestConstants.args.TournamentFormatId,
          firstRoundWinners
        )
      ).to.be.revertedWith("NFB paused");
    });

    it("must fail to update bracket if caller does not have updater role", async function () {
      const firstRoundWinners = bracketArray.slice(0, 32);

      await expect(
        nfbDiamond
          .connect(users.user1.signer)
          .updateBracketResults(
            tournamentsTestConstants.args.TournamentFormatId,
            firstRoundWinners
          )
      ).to.be.reverted;
    });
  });

  context("for calculating bracket points", () => {
    it("should get max points for user", async function () {
      const generatedBracket = generateBracket(bracketArray);

      await nfbDiamond.updateBracketResults(
        tournamentsTestConstants.args.TournamentFormatId,
        generatedBracket
      );

      for (let i = 0; i < roundWinners.length - 1; i++) {
        await nfbDiamond.updateRound(
          tournamentsTestConstants.args.TournamentFormatId
        );
      }

      const totalScore = (
        await nfbDiamond.calcBracketPoints(
          tournamentsTestConstants.args.TournamentFormatId,
          generatedBracket
        )
      )[0];
      const roundScore = (
        await nfbDiamond.calcBracketPoints(
          tournamentsTestConstants.args.TournamentFormatId,
          generatedBracket
        )
      )[1];

      expect(totalScore).to.be.equal(maxPoints);
      expect(roundScore).to.be.equal(maxPoints / 6);
    });

    it("should get less than max total points for user", async function () {
      const generatedBracket = generateBracket(bracketArray);

      await nfbDiamond.updateBracketResults(
        tournamentsTestConstants.args.TournamentFormatId,
        generatedBracket
      );

      for (let i = 0; i < roundWinners.length - 1; i++) {
        await nfbDiamond.updateRound(
          tournamentsTestConstants.args.TournamentFormatId
        );
      }

      generatedBracket.splice(62, 1, 99); // Add inexistent winner ID in order user to lose 32 points in the final round

      const score = (
        await nfbDiamond.calcBracketPoints(
          tournamentsTestConstants.args.TournamentFormatId,
          generatedBracket
        )
      )[0];
      expect(score).to.be.equal(160); // Expect user to have only lost the final match, which contributes to the loss of 32 points
    });

    it("should get less than max round points for user", async function () {
      const generatedBracket = generateBracket(bracketArray);

      await nfbDiamond.updateBracketResults(
        tournamentsTestConstants.args.TournamentFormatId,
        generatedBracket
      );

      generatedBracket.splice(32, 1, 99); // Add inexistent winner ID in order user to lose 2 points in the second round

      await nfbDiamond.updateRound(
        tournamentsTestConstants.args.TournamentFormatId
      );

      const roundScore = (
        await nfbDiamond.calcBracketPoints(
          tournamentsTestConstants.args.TournamentFormatId,
          generatedBracket
        )
      )[1];

      expect(roundScore).to.be.equal(30); // Expect user to have only lost match in the second round, which contributes to the loss of 2 points
    });

    it("must fail to calculate bracket points if bracket length doesn't match with `bracketLength`", async function () {
      await nfbDiamond.updateBracketResults(
        tournamentsTestConstants.args.TournamentFormatId,
        bracketArray
      );

      const fakeWinners = bracketArray.slice(0, 20); // Calculate first round winners with wrong length of bracket

      await expect(
        nfbDiamond.calcBracketPoints(
          tournamentsTestConstants.args.TournamentFormatId,
          fakeWinners
        )
      ).to.be.revertedWith("NFBO: lengths don't match");
    });
  });

  context("for updating round", () => {
    it("should update round", async function () {
      const secondRound = 2;
      const roundIndexBefore = await nfbDiamond.getRoundIndex(
        tournamentsTestConstants.args.TournamentFormatId
      );
      const roundBefore = await nfbDiamond.getRound(
        tournamentsTestConstants.args.TournamentFormatId
      );

      await expect(
        nfbDiamond.updateRound(tournamentsTestConstants.args.TournamentFormatId)
      )
        .to.emit(nfbDiamond, "LogRoundUpdated")
        .withArgs(users.deployer.address, secondRound, secondRound);

      const roundIndexAfter = await nfbDiamond.getRoundIndex(
        tournamentsTestConstants.args.TournamentFormatId
      );
      const roundAfter = await nfbDiamond.getRound(
        tournamentsTestConstants.args.TournamentFormatId
      );

      expect(roundIndexBefore).to.be.equal(1);
      expect(roundIndexAfter).to.be.equal(2);
      expect(roundBefore).to.be.equal(1);
      expect(roundAfter).to.be.equal(2);
    });

    it("must fail to update round if caller does not have updater role", async function () {
      const userAddress = await users.user1.address;
      await expect(
        nfbDiamond
          .connect(users.user1.signer)
          .updateRound(tournamentsTestConstants.args.TournamentFormatId)
      ).to.be.revertedWith(
        `AccessControl: account ${userAddress.toLowerCase()} is missing role ${updaterRole}`
      );
    });

    it("must fail to update round if nfbDiamond is paused", async function () {
      await nfbDiamond.pause();

      await expect(
        nfbDiamond.updateRound(tournamentsTestConstants.args.TournamentFormatId)
      ).to.be.revertedWith("NFB paused");
    });

    it("must fail to update if already in last round", async function () {
      for (let i = 0; i < 5; i++) {
        await nfbDiamond.updateRound(
          tournamentsTestConstants.args.TournamentFormatId
        );
      }

      await expect(
        nfbDiamond.updateRound(tournamentsTestConstants.args.TournamentFormatId)
      ).to.revertedWith("NFBO: already in last round");
    });
  });

  context("for reverting round", () => {
    it("should revert round", async function () {
      await nfbDiamond.updateRound(
        tournamentsTestConstants.args.TournamentFormatId
      );

      const firstRound = 1;
      const roundIndexBefore = await nfbDiamond.getRoundIndex(
        tournamentsTestConstants.args.TournamentFormatId
      );
      const roundBefore = await nfbDiamond.getRound(
        tournamentsTestConstants.args.TournamentFormatId
      );

      await nfbDiamond.pause();

      await expect(
        nfbDiamond.revertRoundInEmergency(
          tournamentsTestConstants.args.TournamentFormatId
        )
      )
        .to.emit(nfbDiamond, "LogRoundReverted")
        .withArgs(users.deployer.address, firstRound, firstRound);

      const roundIndexAfter = await nfbDiamond.getRoundIndex(
        tournamentsTestConstants.args.TournamentFormatId
      );
      const roundAfter = await nfbDiamond.getRound(
        tournamentsTestConstants.args.TournamentFormatId
      );

      expect(roundIndexBefore).to.be.equal(2);
      expect(roundIndexAfter).to.be.equal(1);
      expect(roundBefore).to.be.equal(2);
      expect(roundAfter).to.be.equal(1);
    });

    it("must fail to revert round if caller does not have updater role", async function () {
      const userAddress = await users.user1.address;

      await nfbDiamond.pause();

      await expect(
        nfbDiamond
          .connect(users.user1.signer)
          .revertRoundInEmergency(
            tournamentsTestConstants.args.TournamentFormatId
          )
      ).to.be.revertedWith(
        `AccessControl: account ${userAddress.toLowerCase()} is missing role ${updaterRole}`
      );
    });

    it("must fail to revert if contract not paused", async function () {
      await expect(
        nfbDiamond.revertRoundInEmergency(
          tournamentsTestConstants.args.TournamentFormatId
        )
      ).to.revertedWith("NFB unpaused");
    });

    it("must fail to revert if still in first round", async function () {
      await nfbDiamond.pause();

      await expect(
        nfbDiamond.revertRoundInEmergency(
          tournamentsTestConstants.args.TournamentFormatId
        )
      ).to.revertedWith("NFBO: still in first round");
    });
  });

  context("for calculating points which will be lost", () => {
    it("should get 0 in first round", async function () {
      const bracket = bracketArray.slice();
      const potential = await nfbDiamond.calcPointsWillBeLost(
        tournamentsTestConstants.args.TournamentFormatId,
        bracket
      );

      expect(potential).to.equal(0);
    });

    it("should get 0 in last round", async function () {
      const bracket = bracketArray.slice();

      for (let i = 0; i < 5; i++) {
        await nfbDiamond.updateRound(
          tournamentsTestConstants.args.TournamentFormatId
        );
      } // Invoke `updateRound` 5 times in order to be in 6th round, before the results are updated.

      const potential = await nfbDiamond.calcPointsWillBeLost(
        tournamentsTestConstants.args.TournamentFormatId,
        bracket
      );

      expect(potential).to.equal(0);
    });
  });

  context("for getting bracket potential", () => {
    it("should get bracket potential before first round", async function () {
      const bracket = bracketArray.slice();
      const potential = await nfbDiamond.getBracketPotential(
        tournamentsTestConstants.args.TournamentFormatId,
        bracket
      );

      expect(potential).to.equal(maxPoints);
    });

    it("should get bracket potential after first round", async function () {
      // It is expected in the bracket that id 10 wins against 13, user loses 63 points (from 1nd to 6th round).

      // 1st round - 1 points lost
      // 2nd round - 2 points lost
      // 3rd round - 4 points lost
      // 4th round - 8 points lost
      // 5th round - 16 points lost
      // 6th round - 32 points lost

      const totalLostPoints = 63;

      const expectedPotential = maxPoints - totalLostPoints;

      const winningBracket = [
        //                                                            1st round
        15, 6, 1, 31, 2, 55, 59, 33, 14, 48, 16, 23, 17, 18, 3, 42, 25, 26, 36,

        63, 45, 53, 40, 52, 13, 27, 32, 46, 7, 51, 44, 12,
        //                   !                                        2nd round
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0,

        0, 0,

        0,
      ];

      const bracket = [
        //                                                          1st round
        15, 6, 1, 31, 2, 55, 59, 33, 14, 48, 16, 23, 17, 18, 3, 42, 25, 26, 36,
        63,
        //               !
        45, 53, 40, 52, 10, 27, 32, 46, 7, 51, 44, 12,
        //              !                                           2nd round
        44, 51, 26, 15, 10, 2, 40, 12, 27, 1, 18, 14, 42, 32, 48, 23,
        //                     !                                    3rd round
        18, 51, 40, 12, 48, 1, 10, 2,
        //!                                                         4th round
        10, 18, 12, 51,
        //   !                                                      5th round
        12, 10,
        //!                                                         6th round
        10,
      ];

      await nfbDiamond.updateBracketResults(
        tournamentsTestConstants.args.TournamentFormatId,
        winningBracket
      );

      await nfbDiamond.updateRound(
        tournamentsTestConstants.args.TournamentFormatId
      ); // Invoke `updateRound` in order to be in 2nd round, before the results are updated.

      const pointsWillBeLost = await nfbDiamond.calcPointsWillBeLost(
        tournamentsTestConstants.args.TournamentFormatId,
        bracket
      );

      expect(pointsWillBeLost).to.equal(62); // Points which will be lost from next rounds after the 1st.

      const potential = await nfbDiamond.getBracketPotential(
        tournamentsTestConstants.args.TournamentFormatId,
        bracket
      );

      expect(potential).to.equal(expectedPotential);
    });

    it("should get bracket potential after second round", async function () {
      // It is expected in the bracket that id 59 wins against 12, user loses 30 points (from 2nd to 5th round).

      // 1st round - 0 points lost
      // 2nd round - 2 points lost
      // 3rd round - 4 points lost
      // 4th round - 8 points lost
      // 5th round - 16 points lost
      // 6th round - 0 points lost

      const totalLostPoints = 30;

      const expectedPotential = maxPoints - totalLostPoints;

      const winningBracket = [
        //                    !                                       1st round
        15, 6, 1, 31, 2, 55, 59, 33, 14, 48, 16, 23, 17, 18, 3, 42, 25, 26, 36,
        //                                              !
        63, 45, 53, 40, 52, 10, 27, 32, 46, 7, 51, 44, 12,
        //                          !                                 2nd round
        44, 51, 26, 15, 10, 2, 40, 12, 27, 1, 18, 14, 42, 32, 48, 23,

        0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0,

        0, 0,

        0,
      ];

      const bracket = [
        //                    !                                       1st round
        15, 6, 1, 31, 2, 55, 59, 33, 14, 48, 16, 23, 17, 18, 3, 42, 25, 26, 36,
        //                                              !
        63, 45, 53, 40, 52, 10, 27, 32, 46, 7, 51, 44, 12,
        //                          !                                 2nd round
        44, 51, 26, 15, 10, 2, 40, 59, 27, 1, 18, 14, 42, 32, 48, 23,
        //           !                                                3rd round
        18, 51, 40, 59, 48, 1, 10, 2,
        //       !                                                    4th round
        10, 18, 59, 51,
        //!                                                           5th round
        59, 10,

        10,
      ];

      await nfbDiamond.updateBracketResults(
        tournamentsTestConstants.args.TournamentFormatId,
        winningBracket
      );

      for (let i = 0; i < 2; i++) {
        await nfbDiamond.updateRound(
          tournamentsTestConstants.args.TournamentFormatId
        );
      } // Invoke `updateRound` 2 times in order to be in 3rd round, before the results are updated.

      const pointsWillBeLost = await nfbDiamond.calcPointsWillBeLost(
        tournamentsTestConstants.args.TournamentFormatId,
        bracket
      );

      expect(pointsWillBeLost).to.equal(28); // Points which will be lost from 3rd to 5th round inclusive.

      const potential = await nfbDiamond.getBracketPotential(
        tournamentsTestConstants.args.TournamentFormatId,
        bracket
      );

      expect(potential).to.equal(expectedPotential);
    });

    it("should get bracket potential in second round with already emitted winners for the second round", async function () {
      // It is expected in the bracket that id 10 wins against 13, user loses 63 points (from 1nd to 6th round).

      // 1st round - 1 points lost
      // 2nd round - 2 points lost
      // 3rd round - 4 points lost
      // 4th round - 8 points lost
      // 5th round - 16 points lost
      // 6th round - 32 points lost

      const totalLostPoints = 63;

      const expectedPotential = maxPoints - totalLostPoints;

      const winningBracket = [
        //                                                            1st round
        15, 6, 1, 31, 2, 55, 59, 33, 14, 48, 16, 23, 17, 18, 3, 42, 25, 26, 36,

        63, 45, 53, 40, 52, 13, 27, 32, 46, 7, 51, 44, 12,
        //                   !                                        2nd round
        44, 51, 26, 15, 10, 2, 40, 12, 27, 1, 18, 14, 42, 32, 48, 23,

        0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0,

        0, 0,

        0,
      ];

      const bracket = [
        //                                                          1st round
        15, 6, 1, 31, 2, 55, 59, 33, 14, 48, 16, 23, 17, 18, 3, 42, 25, 26, 36,
        63,
        //               !
        45, 53, 40, 52, 10, 27, 32, 46, 7, 51, 44, 12,
        //              !                                           2nd round
        44, 51, 26, 15, 10, 2, 40, 12, 27, 1, 18, 14, 42, 32, 48, 23,
        //                     !                                    3rd round
        18, 51, 40, 12, 48, 1, 10, 2,
        //!                                                         4th round
        10, 18, 12, 51,
        //   !                                                      5th round
        12, 10,
        //!                                                         6th round
        10,
      ];

      await nfbDiamond.updateBracketResults(
        tournamentsTestConstants.args.TournamentFormatId,
        winningBracket
      );

      await nfbDiamond.updateRound(
        tournamentsTestConstants.args.TournamentFormatId
      ); // Invoke `updateRound` in order to be in 2nd round, before the results are updated.

      const pointsWillBeLost = await nfbDiamond.calcPointsWillBeLost(
        tournamentsTestConstants.args.TournamentFormatId,
        bracket
      );

      expect(pointsWillBeLost).to.equal(62); // Points which will be lost from next rounds after the 1st.

      const potential = await nfbDiamond.getBracketPotential(
        tournamentsTestConstants.args.TournamentFormatId,
        bracket
      );

      expect(potential).to.equal(expectedPotential);
    });

    it("should get bracket potential after third round and calc more lost points in previous", async function () {
      // User's bracket loses 7 points from the first 3 rounds as it is written in the bracket that id 48 will continue to the 3rd round, but it loses in the 1st, 21 is at its place.

      // It is expected in the `bracket` that id 59 wins against 12, user loses 30 points (from 2nd to 5th round).

      // 1st round - 1 points lost
      // 2nd round - 4 points lost
      // 3rd round - 8 points lost
      // 4th round - 8 points lost
      // 5th round - 16 points lost
      // 6th round - 0 points lost

      const totalLostPoints = 37;

      const expectedPotential = maxPoints - totalLostPoints;

      const winningBracket = [
        //                    !           !                           1st round
        15, 6, 1, 31, 2, 55, 59, 33, 14, 21, 16, 23, 17, 18, 3, 42, 25, 26, 36,
        63, 45, 53, 40, 52, 10, 27, 32, 46, 7, 51, 44, 12,
        //                          !                                 2nd round
        44, 51, 26, 15, 10, 2, 40, 12, 27, 1, 18, 14, 42, 32, 21, 23,
        //           !                                                3rd round
        18, 51, 40, 12, 21, 1, 10, 2,

        0, 0, 0, 0,

        0, 0,

        0,
      ];

      const bracket = [
        //                    !           !                           1st round
        15, 6, 1, 31, 2, 55, 59, 33, 14, 48, 16, 23, 17, 18, 3, 42, 25, 26, 36,
        63, 45, 53, 40, 52, 10, 27, 32, 46, 7, 51, 44, 12,
        //                          !                          !      2nd round
        44, 51, 26, 15, 10, 2, 40, 59, 27, 1, 18, 14, 42, 32, 48, 23,
        //           !                                                3rd round
        18, 51, 40, 59, 48, 1, 10, 2,
        //       !                                                    4th round
        10, 18, 59, 51,
        //!                                                           5th round
        59, 10,

        10,
      ];

      await nfbDiamond.updateBracketResults(
        tournamentsTestConstants.args.TournamentFormatId,
        winningBracket
      );

      for (let i = 0; i < 3; i++) {
        await nfbDiamond.updateRound(
          tournamentsTestConstants.args.TournamentFormatId
        );
      } // Invoke `updateRound` 3 times in order to be in 4th round, before the results are updated.

      const pointsWillBeLost = await nfbDiamond.calcPointsWillBeLost(
        tournamentsTestConstants.args.TournamentFormatId,
        bracket
      );

      expect(pointsWillBeLost).to.equal(24); // Points which will be lost in 4th and 5th round due to the fact that 12 is the winner in the match, but 59 is chosen.
      // Hence the bracket loses 8 points from 4th round and 16 from 5th.

      const potential = await nfbDiamond.getBracketPotential(
        tournamentsTestConstants.args.TournamentFormatId,
        bracket
      );

      expect(potential).to.equal(expectedPotential);
    });

    it("should get bracket potential after the 6th round", async function () {
      const winningBracket = bracketArray.slice();
      const winningBracketModified = bracketArray.slice();
      winningBracketModified.splice(62, 1, 99);

      await nfbDiamond.updateBracketResults(
        tournamentsTestConstants.args.TournamentFormatId,
        winningBracket
      ); // User's has lost the final match, so 32 points have to be subtracted.

      for (let i = 0; i < 5; i++) {
        await nfbDiamond.updateRound(
          tournamentsTestConstants.args.TournamentFormatId
        );
      } // Invoke `updateRound` 5 times in order to be in 6th round, before the results are updated.

      const potential = await nfbDiamond.getBracketPotential(
        tournamentsTestConstants.args.TournamentFormatId,
        winningBracketModified
      );

      const pointsWillBeLost = await nfbDiamond.calcPointsWillBeLost(
        tournamentsTestConstants.args.TournamentFormatId,
        winningBracketModified
      );

      expect(pointsWillBeLost).to.equal(0);

      expect(potential).to.equal(maxPoints - 32);
    });

    it("must fail if bracket length doesn't match with the `bracketLength`", async function () {
      const bracket = bracketArray.slice().splice(0, 1);
      await expect(
        nfbDiamond.getBracketPotential(
          tournamentsTestConstants.args.TournamentFormatId,
          bracket
        )
      ).to.be.revertedWith("NFBO: lengths don't match");
    });
  });
});

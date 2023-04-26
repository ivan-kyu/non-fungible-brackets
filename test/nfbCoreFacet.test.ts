import { ethers } from "hardhat";
import { expect } from "chai";
import {
  ERC20Mock,
  NFBBracket,
  IDiamond,
  NFBTournamentsFacet,
  MinimalForwarder,
} from "../typechain";
import { ContractTransaction, ContractReceipt, Signer } from "ethers";
import {
  nftUpdatePrice,
  zeroAddress,
  bracketStruct,
  mockIpfsUri,
  ONE_HOUR,
  roundIndexes,
  roundWinners,
  tournamentsTestConstants,
  TOP5_TIERED_REWARD_PERCENTAGES,
  TOP5_TIERED_REWARD_RANGES,
  tournamentStage,
  WinningTokenBrackets,
} from "./helpers/constants";
import Users from "./helpers/users";
import {
  getTournamentParams,
  setRoundsBoundsAndAdvance,
  getInAdvance,
  emitBracketScoresOnBatches,
  addPool,
  enterPool,
  updateBracket,
} from "./helpers/helpers";
import { init } from "./helpers/initContracts";
import { DataTypes } from "../typechain/contracts/IDiamond";

describe("NFBCore tests", function () {
  let nfbDiamond: IDiamond;
  let tournamentsFacet: NFBTournamentsFacet;
  let users: Users;
  let relayer: Signer;
  let forwarder: MinimalForwarder;
  let snapshotId: any;
  let daoWalletAddress: string;
  let addPoolArgs: {};

  let erc20Mock: ERC20Mock;
  let nfbBracket: NFBBracket;
  let handlerRole: string;
  let rewardDistributionMaxWinnersCount: number;
  const GAS_LIMIT = "21000000";

  before(async () => {
    const signers = await ethers.getSigners();
    users = new Users(signers);

    [nfbDiamond, nfbBracket, erc20Mock, tournamentsFacet, forwarder] =
      await init(users);

    handlerRole = ethers.utils.solidityKeccak256(["string"], ["HANDLER_ROLE"]);

    await nfbDiamond.grantRole(handlerRole, nfbDiamond.address);

    daoWalletAddress = users.user2.address;
    const { roundStart, roundEnd, bracketLength, bracketMaximumPoints } =
      await getTournamentParams();

    await erc20Mock
      .connect(users.user1.signer)
      .transfer(
        users.user3.address,
        ethers.BigNumber.from(nftUpdatePrice).mul(50)
      );

    const user3MockBalance = await erc20Mock.balanceOf(users.user3.address);

    expect(user3MockBalance).eq(ethers.BigNumber.from(nftUpdatePrice).mul(50));

    await erc20Mock
      .connect(users.user3.signer)
      .approve(
        nfbDiamond.address,
        ethers.BigNumber.from(nftUpdatePrice).mul(50)
      );

    const diamondAllowance = await erc20Mock.allowance(
      users.user3.address,
      nfbDiamond.address
    );

    expect(diamondAllowance).eq(ethers.BigNumber.from(nftUpdatePrice).mul(50));

    await nfbDiamond.addTournamentFormat(
      tournamentsTestConstants.args.TournamentFormatName,
      tournamentsTestConstants.args.TournamentType
    );
    await expect(
      nfbDiamond.addSportsLeague(
        tournamentsTestConstants.args.SportsLeagueName,
        tournamentsTestConstants.args.Sport
      )
    )
      .to.emit(nfbDiamond, "LogAddSportsLeague")
      .withArgs(
        1,
        tournamentsTestConstants.args.SportsLeagueName,
        tournamentsTestConstants.args.Sport,
        users.deployer.address
      );

    await expect(
      nfbDiamond.addTournament(
        tournamentsTestConstants.args.SportsLeagueIdFootball,
        tournamentsTestConstants.args.TournamentFormatId,
        tournamentsTestConstants.args.TournamentName,
        tournamentsTestConstants.args.openFrom,
        tournamentsTestConstants.args.openTo,
        tournamentsTestConstants.args.TournamentSeason
      )
    )
      .to.emit(nfbDiamond, "LogAddTournament")
      .withArgs(
        tournamentsTestConstants.args.TournamentId,
        tournamentsTestConstants.args.SportsLeagueIdFootball,
        tournamentsTestConstants.args.TournamentName,
        tournamentsTestConstants.args.TournamentFormatId,
        tournamentsTestConstants.args.TournamentSeason,
        tournamentsTestConstants.args.openFrom,
        tournamentsTestConstants.args.openTo,
        users.deployer.address
      );

    await nfbDiamond.setRounds(
      tournamentsTestConstants.args.TournamentId,
      tournamentsTestConstants.args.TournamentRoundsCount,
      tournamentsTestConstants.args.winnersPerRound
    );

    await expect(
      nfbDiamond.setRoundBounds(
        tournamentsTestConstants.args.TournamentId,
        1,
        roundStart,
        roundEnd
      )
    ).to.emit(nfbDiamond, "LogSetRoundBounds");

    await nfbDiamond.setBracketLength(
      tournamentsTestConstants.args.TournamentId,
      bracketLength
    );

    await nfbDiamond.setMaximumPoints(
      tournamentsTestConstants.args.TournamentId,
      bracketMaximumPoints
    );

    await nfbDiamond.addRewardDistribution(
      "Top5",
      TOP5_TIERED_REWARD_PERCENTAGES,
      TOP5_TIERED_REWARD_RANGES,
      false
    );

    rewardDistributionMaxWinnersCount = 5;

    await nfbDiamond.setRoundIndexes(
      tournamentsTestConstants.args.TournamentId,
      roundIndexes
    );

    await nfbDiamond.setTournamentStage(
      tournamentsTestConstants.args.TournamentId,
      tournamentStage
    );

    addPoolArgs = tournamentsTestConstants.args.addPoolArgs;

    relayer = users.user4.signer;
    forwarder = forwarder.connect(relayer);

    await nfbBracket.setupHandlerAddress(nfbDiamond.address);

    const user3Address = await users.user3.signer.getAddress();

    await expect(
      addPool(
        users.user3.signer,
        user3Address,
        forwarder,
        nfbDiamond,
        tournamentsTestConstants.args.TournamentId,
        erc20Mock.address,
        true,
        500
      )
    ).to.be.emit(nfbDiamond, "LogAddPool");
  });

  beforeEach(async () => {
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  it("should deploy NFBCoreFacet contract", async function () {
    expect(nfbDiamond.address).to.not.equal(zeroAddress);
  });

  it("should revert if non-owner is changing forwarder", async function () {
    await expect(
      nfbDiamond
        .connect(users.user2.signer)
        .setTrustedForwarder(users.user3.address)
    ).to.be.revertedWith("Must be contract owner");
  });

  it("should be able to change Forwarder address", async function () {
    await expect(nfbDiamond.setTrustedForwarder(users.user3.address))
      .to.be.emit(
        nfbDiamond,
        tournamentsTestConstants.events.TrustedForwarderSet
      )
      .withArgs(forwarder.address, users.user3.address);
  });

  context("for emitBracketScores", () => {
    it("should emit LogBracketScoreUpdated", async () => {
      const tokenIds = [1];
      const brackets = [WinningTokenBrackets[0]];
      const expTotalPointsAfterEachRound = [32, 64, 96, 128, 160, 192];

      await nfbDiamond.updateBracketResults(
        tournamentsTestConstants.args.TournamentId,
        bracketStruct
      );

      const user1address = await users.user1.signer.getAddress();

      await expect(
        enterPool(
          users.user1.signer,
          user1address,
          forwarder,
          nfbDiamond,
          erc20Mock,
          tournamentsTestConstants.args.PoolId,
          WinningTokenBrackets[0],
          0,
          false
        )
      ).to.emit(nfbDiamond, "LogPoolEntered");

      for (let i = 0; i < 5; i++) {
        const updateScoresTx: ContractTransaction =
          await nfbDiamond.emitBracketScores(
            tournamentsTestConstants.args.TournamentId,
            tokenIds,
            brackets
          );
        const updateScoresReceipt: ContractReceipt =
          await updateScoresTx.wait();

        let isLogBracketScoreUpdated = false;

        for (const event of updateScoresReceipt.events as Array<any>) {
          if (event.event === "LogBracketScoreUpdated") {
            isLogBracketScoreUpdated = true;
            const tokenId = Number(event?.args[0].toString());
            const roundScore = event?.args[1];
            const score = event?.args[2];
            const round = event?.args[3];
            const owner = event?.args[4];
            expect(tokenId).to.equal(1);
            expect(roundScore).to.equal(roundWinners[0]); // Number of points generated in the round
            expect(score).to.equal(expTotalPointsAfterEachRound[i]); // roundWinners[n] * roundIndex = Number of points
            expect(round).to.equal(i + 1);
            expect(owner).to.equal(users.user1.address);
          }

          expect(isLogBracketScoreUpdated).to.be.equal(true);

          await nfbDiamond.updateRound(
            tournamentsTestConstants.args.TournamentId
          );
        }
      }
    });

    it("should record all updated NFTs in getNftUpdatedInRound", async () => {
      const bracketsToMint = 60; // max number of tokens which can be updated per tx
      const tokenIds: number[] = [];
      const brackets: DataTypes.BracketStruct[] = [];

      // update the source of truth bracket in the oracle for the all 63 matches, i.e. these are the real winners
      await nfbDiamond.updateBracketResults(
        tournamentsTestConstants.args.TournamentId,
        bracketStruct
      );

      const user1address = await users.user1.signer.getAddress();

      // then join the pool minting some brackets
      for (let i = 0; i < bracketsToMint; i++) {
        await enterPool(
          users.user1.signer,
          user1address,
          forwarder,
          nfbDiamond,
          erc20Mock,
          tournamentsTestConstants.args.PoolId,
          WinningTokenBrackets[0],
          0,
          false
        );
        tokenIds.push(i + 1);
        brackets.push(WinningTokenBrackets[0]);
      }

      // For each round (out of 6 rounds):
      // 1. Emit the scores of the brackets
      // 2. for all the brackets, check whether their score has been updated for the corresponding round
      for (let i = 0; i < 5; i++) {
        await nfbDiamond.emitBracketScores(
          tournamentsTestConstants.args.TournamentId,
          tokenIds,
          brackets
        );
        // check if each bracket is updated
        for (let k = 0; k < bracketsToMint; k++) {
          const currentRound = await nfbDiamond.getRound(
            tournamentsTestConstants.args.TournamentId
          );
          const isBracketUpdated = await nfbDiamond.getNftUpdatedInRound(
            currentRound,
            k + 1
          );
          expect(isBracketUpdated).to.be.equal(true);
        }
        await nfbDiamond.updateRound(
          tournamentsTestConstants.args.TournamentId
        );
      }
    });
  });

  context("for getTop", () => {
    it("should get top brackets with length of `winnersCount`", async () => {
      const bracketsPerTx = 5;
      await nfbDiamond.updateBracketResults(
        tournamentsTestConstants.args.TournamentId,
        bracketStruct
      );

      let counter = 0;
      const batches = 4;

      const bracketsArr: DataTypes.BracketStruct[] = [];
      const tokenIds: number[] = [];

      const bracketsToMint = batches * bracketsPerTx;

      for (let n = 0; n < bracketsToMint; n++) {
        await nfbDiamond
          .connect(users.user1.signer)
          .enterPool(
            tournamentsTestConstants.args.PoolId,
            0,
            WinningTokenBrackets[1],
            mockIpfsUri,
            false,
            zeroAddress
          );

        bracketsArr.push(WinningTokenBrackets[1]);
        tokenIds.push(counter + 1);
        counter++;
      }

      // Update rounds in order to get in last round
      for (let i = 0; i < 5; i++) {
        await nfbDiamond.updateRound(
          tournamentsTestConstants.args.TournamentId
        );
      }

      const { roundStart, roundEnd } = await getTournamentParams();

      await nfbDiamond.setRoundBounds(
        tournamentsTestConstants.args.TournamentId,
        6,
        roundStart + ONE_HOUR,
        roundEnd + ONE_HOUR
      );

      await getInAdvance();

      await nfbDiamond.emitBracketScores(
        tournamentsTestConstants.args.TournamentId,
        tokenIds,
        bracketsArr
      );

      let batchCounter = 0;

      for (let k = 0; k < batches; k++) {
        const tokenIdsBatch = tokenIds.slice(
          batchCounter,
          batchCounter + bracketsPerTx
        );
        await nfbDiamond.updateBracketScores(
          tournamentsTestConstants.args.PoolId,
          150,
          tokenIdsBatch
        );
        batchCounter += bracketsPerTx;
      }

      const winners = await nfbDiamond.getTop(
        tournamentsTestConstants.args.PoolId
      );

      expect(winners.length).to.be.equal(rewardDistributionMaxWinnersCount);
    });
  });

  context("for updateBracketScores", () => {
    it("should emit LogBracketScoresUpdated", async () => {
      const tokenIds = [1];
      const brackets = [WinningTokenBrackets[0]];

      await nfbDiamond.updateBracketResults(
        tournamentsTestConstants.args.TournamentId,
        WinningTokenBrackets[0]
      );

      await nfbDiamond
        .connect(users.user1.signer)
        .enterPool(
          tournamentsTestConstants.args.PoolId,
          0,
          WinningTokenBrackets[0],
          mockIpfsUri,
          false,
          zeroAddress
        );

      await setRoundsBoundsAndAdvance(
        nfbDiamond,
        tournamentsTestConstants.args.TournamentId
      );

      await nfbDiamond.emitBracketScores(
        tournamentsTestConstants.args.TournamentId,
        tokenIds,
        brackets
      );

      const updateScoresTx: ContractTransaction =
        await nfbDiamond.updateBracketScores(
          tournamentsTestConstants.args.TournamentId,
          150,
          tokenIds
        );
      const updateScoresReceipt: ContractReceipt = await updateScoresTx.wait();

      let isLogBracketScoresUpdated = false;

      for (const event of updateScoresReceipt.events as Array<any>) {
        if (event.event === "LogBracketScoresUpdated") {
          isLogBracketScoresUpdated = true;
          const bracketsUpdater = event?.args[0];
          expect(bracketsUpdater).to.equal(
            await users.deployer.signer.getAddress()
          );
        }
      }

      expect(isLogBracketScoresUpdated).to.be.equal(true);
    });

    it("should update bracket scores with shuffled IDs in correct order", async function () {
      const user3Signer = users.user3.signer;
      const user3Address = await user3Signer.getAddress();
      const winningBracketIds = [
        //* first round
        102, 209, 252, 113, 30, 107, 103, 6, 334, 105, 61, 180, 246, 106, 245,
        91, 108, 96, 58, 141, 111, 276, 271, 320, 95, 269, 250, 29, 253, 296,
        92, 275,
        //* second
        209, 252, 30, 6, 334, 61, 246, 245, 108, 58, 276, 320, 95, 29, 253, 275,
        //* third
        252, 6, 334, 246, 108, 276, 95, 253,
        //* fourth
        6, 334, 108, 253,
        //* fifth
        334, 108,
        //* sixth
        108,
      ];

      const winningBracketStruct = {
        teamsIds: winningBracketIds,
        finalsTeamOneScore: 100,
        finalsTeamTwoScore: 98,
      };

      const map = new Map();

      await nfbDiamond.updateBracketResults(
        tournamentsTestConstants.args.TournamentId,
        winningBracketStruct
      );

      const bracketsArr: DataTypes.BracketStruct[] = [];
      const tokenIds: number[] = [];

      let counter = 0;

      // Mint Bracket
      for (let i = 0; i < 30; i++) {
        for (let n = 0; n < WinningTokenBrackets.length; n++) {
          await expect(
            enterPool(
              user3Signer,
              user3Address,
              forwarder,
              nfbDiamond,
              erc20Mock,
              tournamentsTestConstants.args.PoolId,
              WinningTokenBrackets[n],
              0,
              true
            )
          ).to.be.emit(nfbDiamond, "LogPoolEntered");
          counter++;
          tokenIds.push(counter);
          bracketsArr.push(WinningTokenBrackets[n]);
          map.set(counter, WinningTokenBrackets[n]);
        }
      }

      const oneUpdate = [1, 4, 5, 6, 7, 8, 9, 10, 20, 40, 50, 70, 23, 12];
      const twoUpdates = [11, 13, 21, 43, 55, 66, 16, 333, 258, 240, 170, 222];
      const threeUpdates = [15, 18, 19, 24, 27, 30, 22, 35, 428];

      // Update Bracket
      for (let i = 1; i <= bracketsArr.length; i++) {
        if (oneUpdate.includes(i)) {
          await updateBracket(
            user3Signer,
            user3Address,
            forwarder,
            nfbDiamond,
            map.get(i),
            map.get(i),
            tournamentsTestConstants.args.PoolId,
            i
          );
        }
        if (twoUpdates.includes(i)) {
          for (let j = 0; j < 2; j++) {
            await updateBracket(
              user3Signer,
              user3Address,
              forwarder,
              nfbDiamond,
              map.get(i),
              map.get(i),
              tournamentsTestConstants.args.PoolId,
              i
            );
          }
        }
        if (threeUpdates.includes(i)) {
          for (let j = 0; j < 3; j++) {
            await updateBracket(
              user3Signer,
              user3Address,
              forwarder,
              nfbDiamond,
              map.get(i),
              map.get(i),
              tournamentsTestConstants.args.PoolId,
              i
            );
          }
        }
      }

      // Advance time after 6th round
      await setRoundsBoundsAndAdvance(
        nfbDiamond,
        tournamentsTestConstants.args.TournamentId
      );

      await emitBracketScoresOnBatches(
        30,
        15,
        tokenIds,
        bracketsArr,
        tournamentsTestConstants.args.TournamentId,
        nfbDiamond
      );

      function shuffle(tokens: number[]) {
        const tempArr = [...tokens];
        const copy = [];
        let n = tempArr.length;
        let i;

        while (n) {
          i = Math.floor(Math.random() * tempArr.length);

          if (i in tempArr) {
            copy.push(tempArr[i]);
            delete tempArr[i];
            n--;
          }
        }
        return copy;
      }

      const SHUFFLED = shuffle(tokenIds);

      for (let k = 0; k < bracketsArr.length; k++) {
        await nfbDiamond.updateBracketScores(
          tournamentsTestConstants.args.TournamentId,
          150,
          [SHUFFLED[k]],
          {
            gasLimit: ethers.BigNumber.from(GAS_LIMIT),
          }
        );
      }

      const winners = await nfbDiamond.getTop(
        tournamentsTestConstants.args.PoolId
      );

      for (let i = 0; i < winners.length; i++) {
        let prevWinnerScore;
        const winnerTokenId = winners[i];
        const prevWinnerTokenId = winners[i - 1];

        const currWinnerScore = +(
          await nfbDiamond.getNftScores(winnerTokenId)
        ).toString();

        if (i > 0) {
          prevWinnerScore = +(await nfbDiamond.getNftScores(prevWinnerTokenId));

          expect(prevWinnerScore).to.be.gte(currWinnerScore);

          if (prevWinnerScore === currWinnerScore) {
            const prevWinnerUpdates = await nfbBracket.tokenIdToNumberOfUpdates(
              prevWinnerTokenId
            );
            const currWinnerUpdates = await nfbBracket.tokenIdToNumberOfUpdates(
              winnerTokenId
            );
            expect(prevWinnerUpdates).to.be.lte(currWinnerUpdates);

            if (prevWinnerUpdates === currWinnerUpdates) {
              const currWinnerTokenId = winnerTokenId;
              expect(prevWinnerTokenId).to.be.lt(currWinnerTokenId);
            }
          }
        }
      }
    });

    it("should updateBracketScores and sort them", async function () {
      const bracketsPerTx = 6;
      const batches = 10;

      await nfbDiamond.updateBracketResults(
        tournamentsTestConstants.args.TournamentId,
        WinningTokenBrackets[0]
      );

      let counter = 0;
      const bracketsToMint = batches * bracketsPerTx;

      const bracketsArr: DataTypes.BracketStruct[] = [];
      const tokenIds: number[] = [];

      for (let k = 0; k < bracketsToMint; k++) {
        await nfbDiamond
          .connect(users.user1.signer)
          .enterPool(
            tournamentsTestConstants.args.PoolId,
            0,
            WinningTokenBrackets[1],
            mockIpfsUri,
            false,
            zeroAddress
          );

        bracketsArr.push(WinningTokenBrackets[1]);
        tokenIds.push(counter + 1);
        counter++;
      }

      await setRoundsBoundsAndAdvance(
        nfbDiamond,
        tournamentsTestConstants.args.TournamentId
      );

      await emitBracketScoresOnBatches(
        10,
        6,
        tokenIds,
        bracketsArr,
        tournamentsTestConstants.args.TournamentId,
        nfbDiamond
      );

      let batchCounter = 0;

      for (let k = 0; k < batches; k++) {
        const tokenIdsBatch = tokenIds.slice(
          batchCounter,
          batchCounter + bracketsPerTx
        );

        await nfbDiamond.updateBracketScores(
          tournamentsTestConstants.args.TournamentId,
          150,
          tokenIdsBatch
        );

        batchCounter += bracketsPerTx;
      }

      const winners = await nfbDiamond.getTop(
        tournamentsTestConstants.args.PoolId
      );

      for (let i = 0; i < winners.length; i++) {
        let prevWinnerScore;
        const currWinnerScore = +(
          await nfbDiamond.getNftScores(winners[i])
        ).toString();

        if (i > 0) {
          prevWinnerScore = +(
            await nfbDiamond.getNftScores(winners[i - 1])
          ).toString();
          expect(prevWinnerScore).to.be.gte(currWinnerScore);
        }
      }
    });

    it("should updateBracketScores properly if there are duplicating passed IDs", async function () {
      const user3Signer = users.user3.signer;
      const user3BalanceBefore = await user3Signer.getBalance();
      const user3Address = await user3Signer.getAddress();

      const bracketsPerTx = 5;

      await nfbDiamond.updateBracketResults(
        tournamentsTestConstants.args.TournamentId,
        WinningTokenBrackets[0]
      );

      let counter = 0;
      const batches = 4;

      const bracketsToMint = batches * bracketsPerTx;

      const bracketsArr: DataTypes.BracketStruct[] = [];
      const tokenIds: number[] = [];

      // mint `bracketsToMint` # of brackets
      for (let k = 0; k < bracketsToMint; k++) {
        await expect(
          enterPool(
            user3Signer,
            user3Address,
            forwarder,
            nfbDiamond,
            erc20Mock,
            tournamentsTestConstants.args.PoolId,
            WinningTokenBrackets[1],
            0,
            true
          )
        )
          .to.be.emit(nfbDiamond, "LogPoolEntered")
          .withArgs(tournamentsTestConstants.args.PoolId, k + 1, user3Address);

        bracketsArr.push(WinningTokenBrackets[1]);
        tokenIds.push(counter + 1);
        counter++;
      }

      // set round bounds for every round and advance until
      // the end of the tournament
      await setRoundsBoundsAndAdvance(
        nfbDiamond,
        tournamentsTestConstants.args.TournamentId
      );

      await nfbDiamond.emitBracketScores(
        tournamentsTestConstants.args.TournamentId,
        tokenIds,
        bracketsArr
      );

      let batchCounter = 0;

      for (let k = 0; k < batches; k++) {
        const tokenIdsBatch = tokenIds.slice(
          batchCounter,
          batchCounter + bracketsPerTx
        );

        await nfbDiamond.updateBracketScores(
          tournamentsTestConstants.args.PoolId,
          150,
          tokenIdsBatch
        );

        batchCounter += bracketsPerTx;
      }

      // Pass second time the same IDs in order to check if tokenIds IDs can't be double updated
      let batchCounter2 = 0;

      for (let k = 0; k < batches; k++) {
        const tokenIdsBatch = tokenIds.slice(
          batchCounter2,
          batchCounter2 + bracketsPerTx
        );
        await nfbDiamond.updateBracketScores(
          tournamentsTestConstants.args.PoolId,
          150,
          tokenIdsBatch
        );

        batchCounter2 += bracketsPerTx;
      }

      const winners = (
        await nfbDiamond.getTop(tournamentsTestConstants.args.PoolId)
      ).map((w) => w.toString());

      expect(winners.length).to.equal(rewardDistributionMaxWinnersCount);

      for (let i = 0; i < winners.length; i++) {
        // Filter how many times is current token ID included in the winners array
        const tokenIdInWinners = winners.filter((w) => winners[i] === w);

        expect(tokenIdInWinners.length).to.equal(1);

        let prevWinnerScore;
        const currWinnerScore = await nfbDiamond.getNftScores(winners[i]);

        if (i > 0) {
          prevWinnerScore = await nfbDiamond.getNftScores(winners[i - 1]);
          expect(prevWinnerScore).to.be.gte(currWinnerScore);
        }
      }
    });

    // This test:
    // Enters the pool with 3 newly minted brackets (tokenIds = 1, 2 and 3) with the same teamsIds predictions
    // Updates tokenId = 3 one time
    // Updates tokenId = 2 two times
    // Updates tokenId = 1 three times
    // Thus,
    it("should update scores and order the winning brackets by bracket points and the number of updates", async function () {
      const user3Signer = users.user3.signer;
      const user3Address = await user3Signer.getAddress();

      const brackets = 3;

      await nfbDiamond.updateBracketResults(
        tournamentsTestConstants.args.TournamentId,
        WinningTokenBrackets[0]
      );

      let counter = 0;
      const bracketsArr: DataTypes.BracketStruct[] = [];
      const tokenIds: number[] = [];

      // 1000 dgens
      const diamondAllowance = await erc20Mock.allowance(
        user3Address,
        nfbDiamond.address
      );

      const user3Balance = await erc20Mock.balanceOf(users.user3.address);

      expect(user3Balance).eq(ethers.BigNumber.from(nftUpdatePrice).mul(50));

      for (let k = 0; k < brackets; k++) {
        await expect(
          enterPool(
            users.user3.signer,
            user3Address,
            forwarder,
            nfbDiamond,
            erc20Mock,
            tournamentsTestConstants.args.PoolId,
            WinningTokenBrackets[0],
            0,
            true
          )
        ).to.emit(nfbDiamond, "LogPoolEntered");

        if (k === 2) {
          // Update bracket in order to put bracket with tokenId of 1 on the 2nd place
          await expect(
            updateBracket(
              user3Signer,
              user3Address,
              forwarder,
              nfbDiamond,
              WinningTokenBrackets[0],
              WinningTokenBrackets[0],
              tournamentsTestConstants.args.PoolId,
              k + 1
            )
          ).to.emit(nfbDiamond, "LogBracketUpdated");
        } else if (k === 1) {
          // Update bracket in order to put bracket with tokenId of 1 on the 2nd place
          for (let i = 0; i < 2; i++) {
            await expect(
              updateBracket(
                user3Signer,
                user3Address,
                forwarder,
                nfbDiamond,
                WinningTokenBrackets[0],
                WinningTokenBrackets[0],
                tournamentsTestConstants.args.PoolId,
                k + 1
              )
            ).to.emit(nfbDiamond, "LogBracketUpdated");
          }
        } else if (k === 0) {
          // Update bracket in order to put bracket with tokenId of 1 on the 2nd place
          for (let i = 0; i < 3; i++) {
            await expect(
              updateBracket(
                user3Signer,
                user3Address,
                forwarder,
                nfbDiamond,
                WinningTokenBrackets[0],
                WinningTokenBrackets[0],
                tournamentsTestConstants.args.PoolId,
                k + 1
              )
            ).to.emit(nfbDiamond, "LogBracketUpdated");
          }
        }

        bracketsArr.push(WinningTokenBrackets[0]);
        tokenIds.push(counter + 1);
        counter++;
      }

      await setRoundsBoundsAndAdvance(
        nfbDiamond,
        tournamentsTestConstants.args.TournamentId
      );

      await nfbDiamond.emitBracketScores(
        tournamentsTestConstants.args.TournamentId,
        tokenIds,
        bracketsArr
      );

      await nfbDiamond.updateBracketScores(
        tournamentsTestConstants.args.PoolId,
        150,
        tokenIds
      );

      const correctOrder = [3, 2, 1];

      const winnersScores = await nfbDiamond.getTop(
        tournamentsTestConstants.args.PoolId
      );

      for (let i = 0; i < 3; i++) {
        expect(+winnersScores[i].toString()).to.equal(correctOrder[i]);
      }
    });

    it("should update scores and order the winning brackets by bracket points and the number of updates and tokenId", async function () {
      const user3Signer = users.user3.signer;
      const user3BalanceBefore = await user3Signer.getBalance();
      const user3Address = await user3Signer.getAddress();

      const brackets = 3;

      await nfbDiamond.updateBracketResults(
        tournamentsTestConstants.args.TournamentFormatId,
        WinningTokenBrackets[0]
      );

      let counter = 0;
      const bracketsArr: DataTypes.BracketStruct[] = [];
      const tokenIds: number[] = [];

      for (let i = 0; i < brackets; i++) {
        await expect(
          enterPool(
            users.user3.signer,
            user3Address,
            forwarder,
            nfbDiamond,
            erc20Mock,
            tournamentsTestConstants.args.PoolId,
            WinningTokenBrackets[0],
            0,
            false
          )
        ).to.emit(nfbDiamond, "LogPoolEntered");

        bracketsArr.push(WinningTokenBrackets[0]);
        tokenIds.push(counter + 1);
        counter++;
      }

      for (let k = brackets - 1; k >= 0; k--) {
        await updateBracket(
          user3Signer,
          user3Address,
          forwarder,
          nfbDiamond,
          WinningTokenBrackets[0],
          WinningTokenBrackets[0],
          tournamentsTestConstants.args.PoolId,
          k + 1
        );
      }

      await setRoundsBoundsAndAdvance(
        nfbDiamond,
        tournamentsTestConstants.args.TournamentId
      );

      await emitBracketScoresOnBatches(
        3,
        1,
        tokenIds,
        bracketsArr,
        tournamentsTestConstants.args.TournamentId,
        nfbDiamond
      );

      await nfbDiamond.updateBracketScores(
        tournamentsTestConstants.args.PoolId,
        150,
        tokenIds
      );

      const correctOrder = [1, 2, 3];

      // Correct order in `winningBrackets` array = [1, 2, 3] with equal number of updates
      // hence tiebreakerLevelThree have to be activate and to order winningBrackets array by tokenId
      const winnersScores = await nfbDiamond.getTop(
        tournamentsTestConstants.args.PoolId
      );

      for (let i = 0; i < 3; i++) {
        expect(+winnersScores[i].toString()).to.equal(correctOrder[i]);
      }
    });

    it("must fail to updateBracketScores if tournament hasn't ended", async () => {
      const tokenIds: number[] = [1];
      await nfbDiamond.updateBracketResults(
        tournamentsTestConstants.args.TournamentId,
        WinningTokenBrackets[0]
      );

      await nfbDiamond
        .connect(users.user1.signer)
        .enterPool(
          tournamentsTestConstants.args.PoolId,
          0,
          WinningTokenBrackets[1],
          mockIpfsUri,
          false,
          zeroAddress
        );

      await expect(
        nfbDiamond.updateBracketScores(
          tournamentsTestConstants.args.PoolId,
          150,
          tokenIds
        )
      ).to.be.revertedWith("NFBR: Tournament hasn't ended");
    });

    it("must fail to updateBracketScores is not called by the owner", async () => {
      const fakeTokenIds: number[] = [0]; // Zero token id instead of 1

      await expect(
        nfbDiamond
          .connect(users.user1.signer)
          .updateBracketScores(
            tournamentsTestConstants.args.TournamentId,
            150,
            fakeTokenIds
          )
      ).to.be.revertedWith("Must be contract owner");
    });
  });

  context("for pause", () => {
    it("should pause NFB Diamond Protocol", async function () {
      await expect(nfbDiamond.pause()).to.emit(nfbDiamond, "Paused");

      const paused = await nfbDiamond.isPaused();
      expect(paused).to.be.equal(true);
    });

    it("must fail if caller is not owner", async function () {
      await expect(
        nfbDiamond.connect(users.user1.signer).pause()
      ).to.be.revertedWith("Must be contract owner");
    });
  });

  context("for unpause", () => {
    it("should unpause NFB Diamond Protocol", async function () {
      await nfbDiamond.pause();

      await expect(nfbDiamond.unpause()).to.emit(nfbDiamond, "Unpaused");

      expect(await nfbDiamond.isPaused()).to.be.equal(false);
    });

    it("must fail if caller is not owner", async function () {
      await expect(
        nfbDiamond.connect(users.user1.signer).unpause()
      ).to.be.revertedWith("Must be contract owner");
    });
  });
});

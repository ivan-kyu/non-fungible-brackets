import hre, { ethers, network } from "hardhat";
import { expect } from "chai";
import { BigNumber, Signer } from "ethers";
import {
  ERC20Mock,
  NFBBracket,
  IDiamond,
  DelegationRegistryMock,
  MinimalForwarder,
  NFBTournamentsFacet,
} from "../typechain";
import {
  bracketLength,
  EMPTY_STRING,
  tournamentsTestConstants,
  TOP5_TIERED_REWARD_PERCENTAGES,
  TOP5_TIERED_REWARD_RANGES,
  TOP10_TIERED_REWARD_PERCENTAGES,
  TOP10_TIERED_REWARD_RANGES,
  roundIndexes,
  tournamentStage,
  oldUserBracket,
  mockIpfsUri,
  zeroAddress,
  nftUpdatePrice,
  WinningBracket,
  ONE_HOUR,
  WinningTokenBrackets,
  newUserBracket,
  MarchMadness2022TopWinnersBrackets,
  oracleBracketTruthAllRounds,
  MarchMadness2022TopWinnersTokenIdScores,
  MarchMadness2022TopWinnersBracketsFinalsScores,
} from "./helpers/constants";
import Users from "./helpers/users";
import {
  getTournamentParams,
  setRoundsBoundsAndAdvance,
  addPool,
  addPoolMeta,
  enterPool,
  enterPoolMeta,
  addPoolWithEntryFee,
  addPoolWith2Entries,
  addPoolWithAccessToken,
  addPoolTokenGated,
  enterPoolTokenGated,
  getInAdvance,
  simulateRounds,
  updateBracket,
  claim,
} from "./helpers/helpers";
import { init } from "./helpers/initContracts";
import { loadFixture } from "ethereum-waffle";
import { signMetaTxRequest } from "../scripts/meta/signer.js";
import exp from "constants";

describe("NFBTournamentsFacet tests", () => {
  let nfbDiamond: IDiamond,
    nfbBracket: NFBBracket,
    erc20Mock: ERC20Mock,
    tournamentsFacet: NFBTournamentsFacet,
    delegationRegistryMock: DelegationRegistryMock,
    forwarder: MinimalForwarder;
  let users: Users;
  let relayer: Signer;
  let daoWalletAddress: string;
  let handlerRole: string;
  let snapshotId: any;
  let addPoolArgs: any;

  const stakeToPlayPrizeModelType = 2;
  const entryFee = 100;
  const nonExistingRewardDistributionId = 15;

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
      .approve(nfbDiamond.address, ethers.BigNumber.from(nftUpdatePrice));

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

    await nfbDiamond.addRewardDistribution(
      "Top10",
      TOP10_TIERED_REWARD_PERCENTAGES,
      TOP10_TIERED_REWARD_RANGES,
      false
    );

    await nfbDiamond.setRoundIndexes(
      tournamentsTestConstants.args.TournamentId,
      roundIndexes
    );

    await nfbDiamond.setTournamentStage(
      tournamentsTestConstants.args.TournamentId,
      tournamentStage
    );

    await nfbDiamond.setSportSeason(
      tournamentsTestConstants.args.TournamentId,
      2023
    );

    await nfbBracket.setupHandlerAddress(nfbDiamond.address);

    addPoolArgs = tournamentsTestConstants.args.addPoolArgs;

    relayer = users.user4.signer;
    forwarder = forwarder.connect(relayer);
  });

  beforeEach(async () => {
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  context("Sports", () => {
    it("Should revert adding league when sport league name is an empty string", async () => {
      await expect(
        nfbDiamond.addSportsLeague(
          EMPTY_STRING,
          tournamentsTestConstants.args.SportsLeagueIdFootball
        )
      ).to.be.revertedWith("Empty input string.");
    });

    it("Should revert adding league when not invoked from owner", async () => {
      await expect(
        nfbDiamond
          .connect(users.user1.signer)
          .addSportsLeague(
            tournamentsTestConstants.args.SportsLeagueName,
            tournamentsTestConstants.args.SportsLeagueIdFootball
          )
      ).to.be.revertedWith("Must be contract owner");
    });

    it("Should add new sports league properly", async () => {
      await expect(
        nfbDiamond.addSportsLeague(
          tournamentsTestConstants.args.SportsLeagueName,
          tournamentsTestConstants.args.SportsLeagueIdFootball
        )
      )
        .to.emit(nfbDiamond, tournamentsTestConstants.events.LogAddSportsLeague)
        .withArgs(
          2,
          tournamentsTestConstants.args.SportsLeagueName,
          tournamentsTestConstants.args.SportsLeagueIdFootball,
          users.deployer.address
        );
    });

    it("Disable Sports League should revert if not called from the owner", async () => {
      await nfbDiamond.addSportsLeague(
        tournamentsTestConstants.args.SportsLeagueName,
        tournamentsTestConstants.args.SportsLeagueIdFootball
      );
      await expect(
        nfbDiamond
          .connect(users.user1.signer)
          .disableSportsLeague(
            tournamentsTestConstants.args.SportsLeagueIdFootball
          )
      ).to.be.revertedWith("Must be contract owner");
    });

    it("Should disable sports league properly", async () => {
      await nfbDiamond.addSportsLeague(
        tournamentsTestConstants.args.SportsLeagueName,
        tournamentsTestConstants.args.SportsLeagueIdFootball
      );
      await expect(
        nfbDiamond.disableSportsLeague(
          tournamentsTestConstants.args.SportsLeagueIdFootball
        )
      )
        .to.emit(
          nfbDiamond,
          tournamentsTestConstants.events.LogDisableSportsLeague
        )
        .withArgs(
          tournamentsTestConstants.args.SportsLeagueIdFootball,
          users.deployer.address
        );
    });
  });

  context("Tournament Formats", () => {
    it("Should revert adding format when format name is an empty string", async () => {
      await expect(
        nfbDiamond.addTournamentFormat(
          EMPTY_STRING,
          tournamentsTestConstants.args.TournamentType
        )
      ).to.be.revertedWith("Empty input string.");
    });

    it("Should revert adding format when not invoked from owner", async () => {
      await expect(
        nfbDiamond
          .connect(users.user1.signer)
          .addTournamentFormat(
            tournamentsTestConstants.args.TournamentFormatName,
            tournamentsTestConstants.args.TournamentType
          )
      ).to.be.revertedWith("Must be contract owner");
    });

    it("Should add new and emit", async () => {
      await expect(
        nfbDiamond.addTournamentFormat(
          tournamentsTestConstants.args.TournamentFormatName,
          tournamentsTestConstants.args.TournamentType
        )
      )
        .to.emit(
          nfbDiamond,
          tournamentsTestConstants.events.LogAddTournamentFormat
        )
        .withArgs(
          tournamentsTestConstants.args.TournamentFormatId + 1,
          tournamentsTestConstants.args.TournamentFormatName,
          tournamentsTestConstants.args.TournamentType,
          users.deployer.address
        );
    });

    it("Disable Tournament Format should revert if not called from the owner", async () => {
      await expect(
        nfbDiamond
          .connect(users.user1.signer)
          .disableTournamentFormat(
            tournamentsTestConstants.args.TournamentFormatId
          )
      ).to.be.revertedWith("Must be contract owner");
    });

    it("Should disable tournament format properly", async () => {
      // await nfbDiamond.addSportsLeague(
      //   tournamentsTestConstants.args.SportsLeagueName,
      //   tournamentsTestConstants.args.SportsLeagueIdFootball
      // );
      // await expect(
      //   nfbDiamond.addTournamentFormat(
      //     tournamentsTestConstants.args.TournamentFormatName,
      //     tournamentsTestConstants.args.TournamentType
      //   )
      // )
      //   .to.emit(
      //     nfbDiamond,
      //     tournamentsTestConstants.events.LogAddTournamentFormat
      //   )
      //   .withArgs(
      //     tournamentsTestConstants.args.TournamentFormatId,
      //     tournamentsTestConstants.args.TournamentFormatName,
      //     users.deployer.address
      //   );
      await expect(
        nfbDiamond.disableTournamentFormat(
          tournamentsTestConstants.args.TournamentFormatId
        )
      )
        .to.emit(
          nfbDiamond,
          tournamentsTestConstants.events.LogDisableTournamentFormat
        )
        .withArgs(
          tournamentsTestConstants.args.TournamentFormatId,
          users.deployer.address
        );
    });
  });

  context("Tournaments", () => {
    it("Should revert if not adding new from deployer", async () => {
      await expect(
        nfbDiamond
          .connect(users.user1.signer)
          .addTournament(
            tournamentsTestConstants.args.SportsLeagueIdFootball,
            tournamentsTestConstants.args.TournamentFormatId,
            tournamentsTestConstants.args.TournamentName,
            tournamentsTestConstants.args.openFrom,
            tournamentsTestConstants.args.openTo,
            tournamentsTestConstants.args.TournamentSeason
          )
      ).to.be.revertedWith("Must be contract owner");
    });
    it("Should revert if league not active", async () => {
      const LeagueIdNotActive = 100;
      await expect(
        nfbDiamond.addTournament(
          LeagueIdNotActive,
          tournamentsTestConstants.args.TournamentFormatId,
          tournamentsTestConstants.args.TournamentName,
          tournamentsTestConstants.args.openFrom,
          tournamentsTestConstants.args.openTo,
          tournamentsTestConstants.args.TournamentSeason
        )
      ).to.be.revertedWithCustomError(
        tournamentsFacet,
        tournamentsTestConstants.errors.SportsLeagueNotActive
      );
    });
    it("Should revert if tournament format not active", async () => {
      const FormatIdNotActive = 100;
      await expect(
        nfbDiamond.addTournament(
          tournamentsTestConstants.args.SportsLeagueIdFootball,
          FormatIdNotActive,
          tournamentsTestConstants.args.TournamentName,
          tournamentsTestConstants.args.openFrom,
          tournamentsTestConstants.args.openTo,
          tournamentsTestConstants.args.TournamentSeason
        )
      ).to.be.revertedWithCustomError(
        tournamentsFacet,
        tournamentsTestConstants.errors.FormatNotActive
      );
    });
    it("Should add new and emit event", async () => {
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
        .to.be.emit(
          nfbDiamond,
          tournamentsTestConstants.events.LogAddTournament
        )
        .withArgs(
          tournamentsTestConstants.args.TournamentId + 1,
          tournamentsTestConstants.args.SportsLeagueIdFootball,
          tournamentsTestConstants.args.TournamentName,
          tournamentsTestConstants.args.TournamentFormatId,
          tournamentsTestConstants.args.TournamentSeason,
          tournamentsTestConstants.args.openFrom,
          tournamentsTestConstants.args.openTo,
          users.deployer.address
        );
    });
  });

  context("Pools", () => {
    it("Add Pool using meta tx should not charge user", async () => {
      const user3Signer = users.user3.signer;
      const user3BalanceBefore = await user3Signer.getBalance();
      const user3Address = await user3Signer.getAddress();

      const relayerBalanceBefore = await relayer.getBalance();

      const poolMaxEntries = 500;

      await expect(
        addPoolMeta(
          user3Signer,
          user3Address,
          forwarder,
          nfbDiamond,
          tournamentsTestConstants.args.TournamentId,
          erc20Mock.address,
          true,
          poolMaxEntries
        )
      ).to.be.emit(nfbDiamond, "LogAddPool");

      const relayerBalanceAfter = await relayer.getBalance();

      const user3BalanceAfter = await user3Signer.getBalance();

      await expect(user3BalanceBefore).eq(user3BalanceAfter);
      await expect(relayerBalanceBefore).greaterThan(relayerBalanceAfter);
    });

    it("Enter Pool using meta tx should not charge user", async () => {
      const user3Signer = users.user3.signer;
      const user3Address = await user3Signer.getAddress();

      const relayerBalanceBefore = await relayer.getBalance();

      const poolMaxEntries = 500;

      await expect(
        addPoolMeta(
          user3Signer,
          user3Address,
          forwarder,
          nfbDiamond,
          tournamentsTestConstants.args.TournamentId,
          erc20Mock.address,
          true,
          poolMaxEntries
        )
      ).to.emit(nfbDiamond, "LogAddPool");

      const bracketBalanceBefore = await nfbBracket.balanceOf(user3Address);

      await erc20Mock
        .connect(users.user1.signer)
        .transfer(user3Address, 5000000000000000);

      const user3ERCBalance = await erc20Mock.balanceOf(user3Address);
      await expect(user3ERCBalance).eq(5000000000000000);

      await expect(
        enterPoolMeta(
          user3Signer,
          user3Address,
          forwarder,
          nfbDiamond,
          erc20Mock,
          tournamentsTestConstants.args.PoolId,
          oldUserBracket,
          0,
          true
        )
      )
        .to.be.emit(nfbDiamond, "LogPoolEntered")
        .withArgs(tournamentsTestConstants.args.PoolId, 1, user3Address);

      const user3EtherBalanceBefore = await user3Signer.getBalance();

      const bracketBalanceAfter = await nfbBracket.balanceOf(user3Address);

      await expect(bracketBalanceBefore).eq(bracketBalanceAfter.toNumber() - 1);

      const relayerBalanceAfter = await relayer.getBalance();

      const user3EtherBalanceAfter = await user3Signer.getBalance();

      await expect(relayerBalanceBefore).greaterThan(relayerBalanceAfter);

      await expect(user3EtherBalanceBefore).eq(user3EtherBalanceAfter);
    });

    it("UpdateBracket using meta tx should not charge user when updating before 1st round", async () => {
      const user3Signer = users.user3.signer;
      const user3Address = await user3Signer.getAddress();

      await erc20Mock
        .connect(users.user1.signer)
        .transfer(user3Address, BigNumber.from(nftUpdatePrice).mul(10));

      await erc20Mock
        .connect(user3Signer)
        .approve(nfbDiamond.address, BigNumber.from(nftUpdatePrice).mul(10));

      const user3ErcBalance = await erc20Mock.balanceOf(user3Address);
      await expect(user3ErcBalance).eq(BigNumber.from(nftUpdatePrice).mul(10));

      const poolMaxEntries = 500;

      await addPoolMeta(
        user3Signer,
        user3Address,
        forwarder,
        nfbDiamond,
        tournamentsTestConstants.args.TournamentId,
        erc20Mock.address,
        true,
        poolMaxEntries
      );

      await expect(
        enterPoolMeta(
          user3Signer,
          user3Address,
          forwarder,
          nfbDiamond,
          erc20Mock,
          tournamentsTestConstants.args.PoolId,
          oldUserBracket,
          0,
          true
        )
      )
        .to.be.emit(nfbDiamond, tournamentsTestConstants.events.LogPoolEntered)
        .withArgs(1, 1, user3Address);

      const user3BalanceBefore = await user3Signer.getBalance();

      await updateBracket(
        user3Signer,
        user3Address,
        forwarder,
        nfbDiamond,
        oldUserBracket,
        newUserBracket,
        tournamentsTestConstants.args.PoolId,
        1
      );

      const filter = nfbDiamond.filters.LogBracketUpdated();

      const events = await nfbDiamond.queryFilter(filter);

      let isLogBracketUpdated = false;

      for (const event of events as Array<any>) {
        if (event.event === "LogBracketUpdated") {
          isLogBracketUpdated = true;
          const newBracket = event?.args[0].teamsIds;
          const numberedEmittedArray = newBracket.map((x) => x.toNumber());
          const sender = event?.args[1];
          const poolId = event?.args[2];
          const tokenId = event?.args[3];
          const startUpdateFromIdx = event?.args[4];
          expect(numberedEmittedArray).to.eql(newUserBracket.teamsIds);
          expect(sender).to.equal(user3Address);
          expect(poolId).to.equal(tournamentsTestConstants.args.PoolId);
          expect(tokenId).to.equal(1);
          expect(startUpdateFromIdx).to.equal(0);
        }

        expect(isLogBracketUpdated).to.be.equal(true);

        const user3BalanceAfter = await user3Signer.getBalance();

        await expect(user3BalanceAfter).eq(user3BalanceBefore);
      }
    });

    it("UpdateBracket using meta tx should not charge user when updating before 2nd round", async () => {
      const user3Signer = users.user3.signer;
      const user3Address = await user3Signer.getAddress();

      await erc20Mock
        .connect(users.user1.signer)
        .transfer(user3Address, BigNumber.from(nftUpdatePrice).mul(3));

      await erc20Mock
        .connect(user3Signer)
        .approve(nfbDiamond.address, BigNumber.from(nftUpdatePrice).mul(3));

      const user3BalanceBefore = await user3Signer.getBalance();

      const poolMaxEntries = 500;

      await addPoolMeta(
        user3Signer,
        user3Address,
        forwarder,
        nfbDiamond,
        tournamentsTestConstants.args.TournamentId,
        erc20Mock.address,
        true,
        poolMaxEntries
      );

      await enterPoolMeta(
        user3Signer,
        user3Address,
        forwarder,
        nfbDiamond,
        erc20Mock,
        tournamentsTestConstants.args.PoolId,
        oldUserBracket,
        0,
        true
      );

      await nfbDiamond.updateBracketResults(
        tournamentsTestConstants.args.TournamentId,
        WinningBracket
      );

      const blockNumber = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNumber);

      await nfbDiamond.setRoundBounds(
        tournamentsTestConstants.args.TournamentId,
        2,
        block.timestamp + 5 * ONE_HOUR,
        block.timestamp + 10 * ONE_HOUR
      );

      await nfbDiamond.updateRound(tournamentsTestConstants.args.TournamentId);

      const IN_FIRST_ROUND = ONE_HOUR;
      await network.provider.send("evm_increaseTime", [IN_FIRST_ROUND]);

      updateBracket(
        user3Signer,
        user3Address,
        forwarder,
        nfbDiamond,
        oldUserBracket,
        newUserBracket,
        tournamentsTestConstants.args.PoolId,
        1
      );

      const filter = nfbDiamond.filters.LogBracketUpdated();

      const events = await nfbDiamond.queryFilter(filter);

      let isLogBracketUpdated = false;

      for (const event of events as Array<any>) {
        if (event.event === "LogBracketUpdated") {
          isLogBracketUpdated = true;
          const newBracket = event?.args[0].teamsIds;
          const numberedEmittedArray = newBracket.map((x) => x.toNumber());
          const sender = event?.args[1];
          const poolId = event?.args[2];
          const tokenId = event?.args[3];
          const startUpdateFromIdx = event?.args[4];
          expect(numberedEmittedArray).to.eql(newUserBracket.teamsIds);
          expect(sender).to.equal(user3Address);
          expect(poolId).to.equal(tournamentsTestConstants.args.PoolId);
          expect(tokenId).to.equal(1);
          expect(startUpdateFromIdx).to.equal(0);
        }

        expect(isLogBracketUpdated).to.be.equal(true);

        const user3BalanceAfter = await user3Signer.getBalance();

        await expect(user3BalanceAfter).eq(user3BalanceBefore);
      }
    });

    it("Claim using meta tx should not charge user", async () => {
      const user3Signer = users.user3.signer;
      const user3Address = await user3Signer.getAddress();

      await erc20Mock
        .connect(users.user1.signer)
        .transfer(user3Address, nftUpdatePrice);

      await erc20Mock
        .connect(user3Signer)
        .approve(nfbDiamond.address, nftUpdatePrice);

      const poolMaxEntries = 500;

      await addPoolMeta(
        user3Signer,
        user3Address,
        forwarder,
        nfbDiamond,
        tournamentsTestConstants.args.TournamentId,
        erc20Mock.address,
        true,
        poolMaxEntries
      );

      // enter a pool 2 times (thus mint 2 Brackets)
      for (let i = 0; i < 2; i++) {
        await expect(
          enterPool(
            user3Signer,
            user3Address,
            forwarder,
            nfbDiamond,
            erc20Mock,
            tournamentsTestConstants.args.PoolId,
            WinningTokenBrackets[i],
            0,
            false
          )
        ).to.be.emit(
          nfbDiamond,
          tournamentsTestConstants.events.LogPoolEntered
        );
      }

      const user3BalanceBefore = await user3Signer.getBalance();

      await simulateRounds(
        nfbDiamond,
        tournamentsTestConstants.args.TournamentRoundsCount,
        WinningTokenBrackets.slice(0, 2)
      );

      await nfbDiamond.updateBracketScores(
        tournamentsTestConstants.args.PoolId,
        tournamentsTestConstants.args.FinalsScoreSum,
        tournamentsTestConstants.args.WinningTokenIds
      );
      // execute claim from behalf of the user
      await expect(
        claim(user3Signer, user3Address, forwarder, nfbDiamond, 1, 1)
      ).to.be.emit(nfbDiamond, "LogRewardClaimed");

      const user3BalanceAfter = await user3Signer.getBalance();

      await expect(user3BalanceAfter).eq(user3BalanceBefore);
    });

    it("Should simulate 2022 March Madness with all the winners WITH NO finals scores picked", async () => {
      const user3Signer = users.user3.signer;
      const user3Address = await user3Signer.getAddress();

      const expectedBasketBallSportsLeagueId = 2;
      await expect(nfbDiamond.addSportsLeague("NCAA", 0))
        .to.emit(nfbDiamond, "LogAddSportsLeague")
        .withArgs(
          expectedBasketBallSportsLeagueId,
          "NCAA",
          0,
          users.deployer.address
        );

      // for the format, we will be using the already defined in the `before`

      const blockNumber = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNumber);

      // Period allowed for pool creation
      const openFrom = block.timestamp - 60;
      const openTo = block.timestamp + 1 * 24 * ONE_HOUR;

      const tournamentName = "March Madness 2022";
      const expectedNewTournamentId = 2;
      const roundsCount = 6;

      await expect(
        nfbDiamond.addTournament(
          expectedBasketBallSportsLeagueId,
          1,
          tournamentName,
          openFrom,
          openTo,
          2022
        )
      )
        .to.emit(nfbDiamond, "LogAddTournament")
        .withArgs(
          expectedNewTournamentId,
          expectedBasketBallSportsLeagueId,
          tournamentName,
          1,
          2022,
          openFrom,
          openTo,
          users.deployer.address
        );

      expect(
        await nfbDiamond.setRounds(
          expectedNewTournamentId,
          roundsCount,
          tournamentsTestConstants.args.winnersPerRound
        )
      )
        .to.emit(nfbDiamond, "TournamentRoundsCountSet")
        .withArgs(expectedNewTournamentId, roundsCount);

      const roundStart = block.timestamp + 1 * ONE_HOUR;
      const roundEnd = roundStart + 1 * ONE_HOUR;

      const bracketLen = 63;

      await expect(
        nfbDiamond.setRoundBounds(
          expectedNewTournamentId,
          1,
          roundStart,
          roundEnd
        )
      )
        .to.emit(nfbDiamond, "LogSetRoundBounds")
        .withArgs(expectedNewTournamentId, 1, roundStart, roundEnd);

      await expect(
        nfbDiamond.setBracketLength(expectedNewTournamentId, bracketLen)
      )
        .to.emit(nfbDiamond, "BracketLengthSet")
        .withArgs(expectedNewTournamentId, bracketLen);

      const maximumPoints = 192;

      await expect(
        nfbDiamond.setMaximumPoints(expectedNewTournamentId, maximumPoints)
      )
        .to.emit(nfbDiamond, "MaximumPointsSet")
        .withArgs(expectedNewTournamentId, maximumPoints);

      // we will be using the already defined TOP 5 reward distribution

      await expect(
        nfbDiamond.setRoundIndexes(expectedNewTournamentId, roundIndexes)
      )
        .to.emit(nfbDiamond, "RoundIndexesSet")
        .withArgs(expectedNewTournamentId, roundIndexes);

      await expect(nfbDiamond.setTournamentStage(expectedNewTournamentId, 32))
        .to.emit(nfbDiamond, "TournamentStageSet")
        .withArgs(expectedNewTournamentId, 32);

      await expect(nfbDiamond.setSportSeason(expectedNewTournamentId, 2022))
        .to.emit(nfbDiamond, "LogTournamentSeasonUpdated")
        .withArgs(expectedNewTournamentId, 2022);

      const poolMaxEntries = 100;

      // Adding a free entry pool
      await addPoolMeta(
        user3Signer,
        user3Address,
        forwarder,
        nfbDiamond,
        expectedNewTournamentId,
        erc20Mock.address,
        false,
        poolMaxEntries
      );

      // mint 10 winners
      for (let i = 0; i < 10; i++) {
        await expect(
          enterPool(
            user3Signer,
            user3Address,
            forwarder,
            nfbDiamond,
            erc20Mock,
            tournamentsTestConstants.args.PoolId,
            MarchMadness2022TopWinnersBrackets[i],
            0,
            false
          )
        ).to.be.emit(
          nfbDiamond,
          tournamentsTestConstants.events.LogPoolEntered
        );
      }

      const totalBrackets = await nfbBracket.balanceOf(user3Address);

      await expect(totalBrackets).eq(10);

      const winnersTokenIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      for (let i = 1; i <= roundsCount; i++) {
        const currentTruthBracket = {
          teamsIds: oracleBracketTruthAllRounds[i - 1].teamsIds,
          finalsTeamOneScore: 0,
          finalsTeamTwoScore: 0,
        };

        expect(currentTruthBracket.teamsIds.length).eq(bracketLen);

        // Update bracket results after round 1 has finished
        await expect(
          nfbDiamond.updateBracketResults(
            expectedNewTournamentId,
            currentTruthBracket
          )
        ).to.emit(nfbDiamond, "LogBracketResultsUpdated");

        await nfbDiamond.emitBracketScores(
          expectedNewTournamentId,
          winnersTokenIds,
          MarchMadness2022TopWinnersBrackets
        );

        // End the current round
        const OVERTIME = ONE_HOUR * 2; // duration of 1 round
        await network.provider.send("evm_increaseTime", [OVERTIME]);
        await network.provider.send("evm_mine");

        const blockNumber = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNumber);

        const startNextRound = block.timestamp + 2 * ONE_HOUR;
        const endNextRound = startNextRound + 2 * ONE_HOUR;

        if (i + 1 <= roundsCount) {
          await nfbDiamond.setRoundBounds(
            expectedNewTournamentId,
            i + 1,
            startNextRound,
            endNextRound
          );
          await nfbDiamond.updateRound(expectedNewTournamentId);
        }

        if (i == roundsCount) {
          await network.provider.send("evm_increaseTime", [OVERTIME * 15]); // Simulate tournament has finished
          await network.provider.send("evm_mine");
        }
        // .withArgs(users.deployer.address, currentTruthBracket, 0, 0);
      }

      await expect(
        nfbDiamond.updateBracketScores(
          tournamentsTestConstants.args.PoolId,
          0,
          winnersTokenIds
        )
      )
        .to.emit(nfbDiamond, "LogBracketScoresUpdated")
        .withArgs(users.deployer.address);

      const contractTopWinners = await nfbDiamond.getTop(
        tournamentsTestConstants.args.PoolId
      );

      const contractTopWinnersNumbers = contractTopWinners.map((x) =>
        x.toNumber()
      );

      const contractEmittedScores: number[] = [];

      for (let i = 1; i <= 10; i++) {
        const currentTokenScoreId = await nfbDiamond.getNftScores(i);
        contractEmittedScores.push(currentTokenScoreId);
      }

      await expect(contractEmittedScores).eql(
        MarchMadness2022TopWinnersTokenIdScores
      );

      await expect(contractTopWinnersNumbers).eql(winnersTokenIds);
    });

    it("Should simulate 2022 March Madness with a winner bracket of total 192 points WITH NO finals scores picked", async () => {
      const user3Signer = users.user3.signer;
      const user3Address = await user3Signer.getAddress();

      const expectedBasketBallSportsLeagueId = 2;
      await expect(nfbDiamond.addSportsLeague("NCAA", 0))
        .to.emit(nfbDiamond, "LogAddSportsLeague")
        .withArgs(
          expectedBasketBallSportsLeagueId,
          "NCAA",
          0,
          users.deployer.address
        );

      // for the format, we will be using the already defined in the `before`

      const blockNumber = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNumber);

      // Period allowed for pool creation
      const openFrom = block.timestamp - 60;
      const openTo = block.timestamp + 1 * 24 * ONE_HOUR;

      const tournamentName = "March Madness 2022";
      const expectedNewTournamentId = 2;
      const roundsCount = 6;

      await expect(
        nfbDiamond.addTournament(
          expectedBasketBallSportsLeagueId,
          1,
          tournamentName,
          openFrom,
          openTo,
          2022
        )
      )
        .to.emit(nfbDiamond, "LogAddTournament")
        .withArgs(
          expectedNewTournamentId,
          expectedBasketBallSportsLeagueId,
          tournamentName,
          1,
          2022,
          openFrom,
          openTo,
          users.deployer.address
        );

      expect(
        await nfbDiamond.setRounds(
          expectedNewTournamentId,
          roundsCount,
          tournamentsTestConstants.args.winnersPerRound
        )
      )
        .to.emit(nfbDiamond, "TournamentRoundsCountSet")
        .withArgs(expectedNewTournamentId, roundsCount);

      const roundStart = block.timestamp + 1 * ONE_HOUR;
      const roundEnd = roundStart + 1 * ONE_HOUR;

      const bracketLen = 63;

      await expect(
        nfbDiamond.setRoundBounds(
          expectedNewTournamentId,
          1,
          roundStart,
          roundEnd
        )
      )
        .to.emit(nfbDiamond, "LogSetRoundBounds")
        .withArgs(expectedNewTournamentId, 1, roundStart, roundEnd);

      await expect(
        nfbDiamond.setBracketLength(expectedNewTournamentId, bracketLen)
      )
        .to.emit(nfbDiamond, "BracketLengthSet")
        .withArgs(expectedNewTournamentId, bracketLen);

      const maximumPoints = 192;

      await expect(
        nfbDiamond.setMaximumPoints(expectedNewTournamentId, maximumPoints)
      )
        .to.emit(nfbDiamond, "MaximumPointsSet")
        .withArgs(expectedNewTournamentId, maximumPoints);

      // we will be using the already defined TOP 5 reward distribution

      await expect(
        nfbDiamond.setRoundIndexes(expectedNewTournamentId, roundIndexes)
      )
        .to.emit(nfbDiamond, "RoundIndexesSet")
        .withArgs(expectedNewTournamentId, roundIndexes);

      await expect(nfbDiamond.setTournamentStage(expectedNewTournamentId, 32))
        .to.emit(nfbDiamond, "TournamentStageSet")
        .withArgs(expectedNewTournamentId, 32);

      await expect(nfbDiamond.setSportSeason(expectedNewTournamentId, 2022))
        .to.emit(nfbDiamond, "LogTournamentSeasonUpdated")
        .withArgs(expectedNewTournamentId, 2022);

      const poolMaxEntries = 100;

      // Adding a free entry pool
      await addPoolMeta(
        user3Signer,
        user3Address,
        forwarder,
        nfbDiamond,
        expectedNewTournamentId,
        erc20Mock.address,
        false,
        poolMaxEntries
      );

      // mint a winner bracket
      await expect(
        enterPool(
          user3Signer,
          user3Address,
          forwarder,
          nfbDiamond,
          erc20Mock,
          tournamentsTestConstants.args.PoolId,
          oracleBracketTruthAllRounds[5],
          0,
          false
        )
      ).to.be.emit(nfbDiamond, tournamentsTestConstants.events.LogPoolEntered);

      const totalBrackets = await nfbBracket.balanceOf(user3Address);

      await expect(totalBrackets).eq(1);

      const winnersTokenIds = [1];
      for (let i = 1; i <= roundsCount; i++) {
        const currentTruthBracket = {
          teamsIds: oracleBracketTruthAllRounds[i - 1].teamsIds,
          finalsTeamOneScore: 0,
          finalsTeamTwoScore: 0,
        };

        expect(currentTruthBracket.teamsIds.length).eq(bracketLen);

        // Update bracket results after round 1 has finished
        await expect(
          nfbDiamond.updateBracketResults(
            expectedNewTournamentId,
            currentTruthBracket
          )
        ).to.emit(nfbDiamond, "LogBracketResultsUpdated");

        await nfbDiamond.emitBracketScores(
          expectedNewTournamentId,
          winnersTokenIds,
          [oracleBracketTruthAllRounds[5]]
        );

        // End the current round
        const OVERTIME = ONE_HOUR * 2; // duration of 1 round
        await network.provider.send("evm_increaseTime", [OVERTIME]);
        await network.provider.send("evm_mine");

        const blockNumber = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNumber);

        const startNextRound = block.timestamp + 2 * ONE_HOUR;
        const endNextRound = startNextRound + 2 * ONE_HOUR;

        if (i + 1 <= roundsCount) {
          await nfbDiamond.setRoundBounds(
            expectedNewTournamentId,
            i + 1,
            startNextRound,
            endNextRound
          );
          await nfbDiamond.updateRound(expectedNewTournamentId);
        }

        if (i == roundsCount) {
          await network.provider.send("evm_increaseTime", [OVERTIME * 15]); // Simulate tournament has finished
          await network.provider.send("evm_mine");
        }
        // .withArgs(users.deployer.address, currentTruthBracket, 0, 0);
      }

      await expect(
        nfbDiamond.updateBracketScores(
          tournamentsTestConstants.args.PoolId,
          0,
          winnersTokenIds
        )
      )
        .to.emit(nfbDiamond, "LogBracketScoresUpdated")
        .withArgs(users.deployer.address);

      const contractTopWinners = await nfbDiamond.getTop(
        tournamentsTestConstants.args.PoolId
      );

      const contractTopWinnersNumbers = contractTopWinners.map((x) =>
        x.toNumber()
      );

      const contractEmittedScores: number[] = [];

      const currentTokenScoreId = await nfbDiamond.getNftScores(1);
      contractEmittedScores.push(currentTokenScoreId);

      await expect(contractEmittedScores).eql([192]);

      await expect(contractTopWinnersNumbers).eql(winnersTokenIds);
    });

    it("Should simulate 2022 March Madness with shuffled winners WITH NO finals scores picked", async () => {
      const user3Signer = users.user3.signer;
      const user3Address = await user3Signer.getAddress();

      const expectedBasketBallSportsLeagueId = 2;
      await expect(nfbDiamond.addSportsLeague("NCAA", 0))
        .to.emit(nfbDiamond, "LogAddSportsLeague")
        .withArgs(
          expectedBasketBallSportsLeagueId,
          "NCAA",
          0,
          users.deployer.address
        );

      // for the format, we will be using the already defined in the `before`

      const blockNumber = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNumber);

      // Period allowed for pool creation
      const openFrom = block.timestamp - 60;
      const openTo = block.timestamp + 1 * 24 * ONE_HOUR;

      const tournamentName = "March Madness 2022";
      const expectedNewTournamentId = 2;
      const roundsCount = 6;

      await expect(
        nfbDiamond.addTournament(
          expectedBasketBallSportsLeagueId,
          1,
          tournamentName,
          openFrom,
          openTo,
          2022
        )
      )
        .to.emit(nfbDiamond, "LogAddTournament")
        .withArgs(
          expectedNewTournamentId,
          expectedBasketBallSportsLeagueId,
          tournamentName,
          1,
          2022,
          openFrom,
          openTo,
          users.deployer.address
        );

      expect(
        await nfbDiamond.setRounds(
          expectedNewTournamentId,
          roundsCount,
          tournamentsTestConstants.args.winnersPerRound
        )
      )
        .to.emit(nfbDiamond, "TournamentRoundsCountSet")
        .withArgs(expectedNewTournamentId, roundsCount);

      const roundStart = block.timestamp + 1 * ONE_HOUR;
      const roundEnd = roundStart + 1 * ONE_HOUR;

      const bracketLen = 63;

      await expect(
        nfbDiamond.setRoundBounds(
          expectedNewTournamentId,
          1,
          roundStart,
          roundEnd
        )
      )
        .to.emit(nfbDiamond, "LogSetRoundBounds")
        .withArgs(expectedNewTournamentId, 1, roundStart, roundEnd);

      await expect(
        nfbDiamond.setBracketLength(expectedNewTournamentId, bracketLen)
      )
        .to.emit(nfbDiamond, "BracketLengthSet")
        .withArgs(expectedNewTournamentId, bracketLen);

      const maximumPoints = 192;

      await expect(
        nfbDiamond.setMaximumPoints(expectedNewTournamentId, maximumPoints)
      )
        .to.emit(nfbDiamond, "MaximumPointsSet")
        .withArgs(expectedNewTournamentId, maximumPoints);

      // we will be using the already defined TOP 5 reward distribution

      await expect(
        nfbDiamond.setRoundIndexes(expectedNewTournamentId, roundIndexes)
      )
        .to.emit(nfbDiamond, "RoundIndexesSet")
        .withArgs(expectedNewTournamentId, roundIndexes);

      await expect(nfbDiamond.setTournamentStage(expectedNewTournamentId, 32))
        .to.emit(nfbDiamond, "TournamentStageSet")
        .withArgs(expectedNewTournamentId, 32);

      await expect(nfbDiamond.setSportSeason(expectedNewTournamentId, 2022))
        .to.emit(nfbDiamond, "LogTournamentSeasonUpdated")
        .withArgs(expectedNewTournamentId, 2022);

      const poolMaxEntries = 100;

      // Adding a free entry pool
      await addPoolMeta(
        user3Signer,
        user3Address,
        forwarder,
        nfbDiamond,
        expectedNewTournamentId,
        erc20Mock.address,
        false,
        poolMaxEntries
      );

      const shuffle = ([...arr]) => {
        let m = arr.length;
        while (m) {
          const i = Math.floor(Math.random() * m--);
          [arr[m], arr[i]] = [arr[i], arr[m]];
        }
        return arr;
      };

      const shuffledWinnersBrackets = shuffle(
        MarchMadness2022TopWinnersBrackets.slice(0, 5)
      );

      // shuffle & mint 5 winners
      for (let i = 0; i < 5; i++) {
        await expect(
          enterPool(
            user3Signer,
            user3Address,
            forwarder,
            nfbDiamond,
            erc20Mock,
            tournamentsTestConstants.args.PoolId,
            shuffledWinnersBrackets[i],
            0,
            false
          )
        ).to.be.emit(
          nfbDiamond,
          tournamentsTestConstants.events.LogPoolEntered
        );
      }

      const totalBrackets = await nfbBracket.balanceOf(user3Address);

      await expect(totalBrackets).eq(5);

      const winnersTokenIds = [1, 2, 3, 4, 5];
      for (let i = 1; i <= roundsCount; i++) {
        const currentTruthBracket = {
          teamsIds: oracleBracketTruthAllRounds[i - 1].teamsIds,
          finalsTeamOneScore: 0,
          finalsTeamTwoScore: 0,
        };

        expect(currentTruthBracket.teamsIds.length).eq(bracketLen);

        // Update bracket results after round 1 has finished
        await expect(
          nfbDiamond.updateBracketResults(
            expectedNewTournamentId,
            currentTruthBracket
          )
        ).to.emit(nfbDiamond, "LogBracketResultsUpdated");

        await nfbDiamond.emitBracketScores(
          expectedNewTournamentId,
          winnersTokenIds,
          shuffledWinnersBrackets
        );

        // End the current round
        const OVERTIME = ONE_HOUR * 2; // duration of 1 round
        await network.provider.send("evm_increaseTime", [OVERTIME]);
        await network.provider.send("evm_mine");

        const blockNumber = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNumber);

        const startNextRound = block.timestamp + 2 * ONE_HOUR;
        const endNextRound = startNextRound + 2 * ONE_HOUR;

        if (i + 1 <= roundsCount) {
          await nfbDiamond.setRoundBounds(
            expectedNewTournamentId,
            i + 1,
            startNextRound,
            endNextRound
          );
          await nfbDiamond.updateRound(expectedNewTournamentId);
        }

        if (i == roundsCount) {
          await network.provider.send("evm_increaseTime", [OVERTIME * 15]); // Simulate tournament has finished
          await network.provider.send("evm_mine");
        }
        // .withArgs(users.deployer.address, currentTruthBracket, 0, 0);
      }

      await expect(
        nfbDiamond.updateBracketScores(
          tournamentsTestConstants.args.PoolId,
          0,
          winnersTokenIds
        )
      )
        .to.emit(nfbDiamond, "LogBracketScoresUpdated")
        .withArgs(users.deployer.address);

      const contractTopWinners = await nfbDiamond.getTop(
        tournamentsTestConstants.args.PoolId
      );

      const contractTopWinnersNumbers = contractTopWinners.map((x) =>
        x.toNumber()
      );

      const contractEmittedScores: number[] = [];

      for (let i = 0; i < 5; i++) {
        const currentTokenScoreId = await nfbDiamond.getNftScores(
          contractTopWinnersNumbers[i]
        );
        contractEmittedScores.push(currentTokenScoreId);
      }

      await expect(contractEmittedScores).eql(
        MarchMadness2022TopWinnersTokenIdScores.slice(0, 5)
      );
    });

    it("Should simulate 2022 March Madness with all the winners WITH equal finals scores picked", async () => {
      const user3Signer = users.user3.signer;
      const user3Address = await user3Signer.getAddress();

      const expectedBasketBallSportsLeagueId = 2;
      await expect(nfbDiamond.addSportsLeague("NCAA", 0))
        .to.emit(nfbDiamond, "LogAddSportsLeague")
        .withArgs(
          expectedBasketBallSportsLeagueId,
          "NCAA",
          0,
          users.deployer.address
        );

      // for the format, we will be using the already defined in the `before`

      const blockNumber = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNumber);

      // Period allowed for pool creation
      const openFrom = block.timestamp - 60;
      const openTo = block.timestamp + 1 * 24 * ONE_HOUR;

      const tournamentName = "March Madness 2022";
      const expectedNewTournamentId = 2;
      const roundsCount = 6;

      await expect(
        nfbDiamond.addTournament(
          expectedBasketBallSportsLeagueId,
          1,
          tournamentName,
          openFrom,
          openTo,
          2022
        )
      )
        .to.emit(nfbDiamond, "LogAddTournament")
        .withArgs(
          expectedNewTournamentId,
          expectedBasketBallSportsLeagueId,
          tournamentName,
          1,
          2022,
          openFrom,
          openTo,
          users.deployer.address
        );

      expect(
        await nfbDiamond.setRounds(
          expectedNewTournamentId,
          roundsCount,
          tournamentsTestConstants.args.winnersPerRound
        )
      )
        .to.emit(nfbDiamond, "TournamentRoundsCountSet")
        .withArgs(expectedNewTournamentId, roundsCount);

      const roundStart = block.timestamp + 1 * ONE_HOUR;
      const roundEnd = roundStart + 1 * ONE_HOUR;

      const bracketLen = 63;

      await expect(
        nfbDiamond.setRoundBounds(
          expectedNewTournamentId,
          1,
          roundStart,
          roundEnd
        )
      )
        .to.emit(nfbDiamond, "LogSetRoundBounds")
        .withArgs(expectedNewTournamentId, 1, roundStart, roundEnd);

      await expect(
        nfbDiamond.setBracketLength(expectedNewTournamentId, bracketLen)
      )
        .to.emit(nfbDiamond, "BracketLengthSet")
        .withArgs(expectedNewTournamentId, bracketLen);

      const maximumPoints = 192;

      await expect(
        nfbDiamond.setMaximumPoints(expectedNewTournamentId, maximumPoints)
      )
        .to.emit(nfbDiamond, "MaximumPointsSet")
        .withArgs(expectedNewTournamentId, maximumPoints);

      // we will be using the already defined TOP 5 reward distribution

      await expect(
        nfbDiamond.setRoundIndexes(expectedNewTournamentId, roundIndexes)
      )
        .to.emit(nfbDiamond, "RoundIndexesSet")
        .withArgs(expectedNewTournamentId, roundIndexes);

      await expect(nfbDiamond.setTournamentStage(expectedNewTournamentId, 32))
        .to.emit(nfbDiamond, "TournamentStageSet")
        .withArgs(expectedNewTournamentId, 32);

      await expect(nfbDiamond.setSportSeason(expectedNewTournamentId, 2022))
        .to.emit(nfbDiamond, "LogTournamentSeasonUpdated")
        .withArgs(expectedNewTournamentId, 2022);

      const poolMaxEntries = 100;

      // Adding a free entry pool
      await addPoolMeta(
        user3Signer,
        user3Address,
        forwarder,
        nfbDiamond,
        expectedNewTournamentId,
        erc20Mock.address,
        false,
        poolMaxEntries
      );

      // mint 10 winners
      for (let i = 0; i < 10; i++) {
        await expect(
          enterPool(
            user3Signer,
            user3Address,
            forwarder,
            nfbDiamond,
            erc20Mock,
            tournamentsTestConstants.args.PoolId,
            MarchMadness2022TopWinnersBracketsFinalsScores[i],
            0,
            false
          )
        ).to.be.emit(
          nfbDiamond,
          tournamentsTestConstants.events.LogPoolEntered
        );
      }

      const totalBrackets = await nfbBracket.balanceOf(user3Address);

      await expect(totalBrackets).eq(10);

      const winnersTokenIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      for (let i = 1; i <= roundsCount; i++) {
        const currentTruthBracket = oracleBracketTruthAllRounds[i - 1];

        expect(currentTruthBracket.teamsIds.length).eq(bracketLen);

        // Update bracket results after round 1 has finished
        await expect(
          nfbDiamond.updateBracketResults(
            expectedNewTournamentId,
            currentTruthBracket
          )
        ).to.emit(nfbDiamond, "LogBracketResultsUpdated");

        await nfbDiamond.emitBracketScores(
          expectedNewTournamentId,
          winnersTokenIds,
          MarchMadness2022TopWinnersBracketsFinalsScores
        );

        // End the current round
        const OVERTIME = ONE_HOUR * 2; // duration of 1 round
        await network.provider.send("evm_increaseTime", [OVERTIME]);
        await network.provider.send("evm_mine");

        const blockNumber = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNumber);

        const startNextRound = block.timestamp + 2 * ONE_HOUR;
        const endNextRound = startNextRound + 2 * ONE_HOUR;

        if (i + 1 <= roundsCount) {
          await nfbDiamond.setRoundBounds(
            expectedNewTournamentId,
            i + 1,
            startNextRound,
            endNextRound
          );
          await nfbDiamond.updateRound(expectedNewTournamentId);
        }

        if (i == roundsCount) {
          await network.provider.send("evm_increaseTime", [OVERTIME * 15]); // Simulate tournament has finished
          await network.provider.send("evm_mine");
        }
        // .withArgs(users.deployer.address, currentTruthBracket, 0, 0);
      }

      const actualFinalsSum = 200;

      await expect(
        nfbDiamond.updateBracketScores(
          tournamentsTestConstants.args.PoolId,
          actualFinalsSum,
          winnersTokenIds
        )
      )
        .to.emit(nfbDiamond, "LogBracketScoresUpdated")
        .withArgs(users.deployer.address);

      const contractTopWinners = await nfbDiamond.getTop(
        tournamentsTestConstants.args.PoolId
      );

      const contractTopWinnersNumbers = contractTopWinners.map((x) =>
        x.toNumber()
      );

      const contractEmittedScores: number[] = [];

      for (let i = 1; i <= 10; i++) {
        const currentTokenScoreId = await nfbDiamond.getNftScores(i);
        contractEmittedScores.push(currentTokenScoreId);
      }

      await expect(contractEmittedScores).eql(
        MarchMadness2022TopWinnersTokenIdScores
      );

      await expect(contractTopWinnersNumbers).eql(winnersTokenIds);
    });

    it("Should simulate 2022 March Madness with all the winners WITH different finals scores picked", async () => {
      const user3Signer = users.user3.signer;
      const user3Address = await user3Signer.getAddress();

      const expectedBasketBallSportsLeagueId = 2;
      await expect(nfbDiamond.addSportsLeague("NCAA", 0))
        .to.emit(nfbDiamond, "LogAddSportsLeague")
        .withArgs(
          expectedBasketBallSportsLeagueId,
          "NCAA",
          0,
          users.deployer.address
        );

      // for the format, we will be using the already defined in the `before`

      const blockNumber = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNumber);

      // Period allowed for pool creation
      const openFrom = block.timestamp - 60;
      const openTo = block.timestamp + 1 * 24 * ONE_HOUR;

      const tournamentName = "March Madness 2022";
      const expectedNewTournamentId = 2;
      const roundsCount = 6;

      await expect(
        nfbDiamond.addTournament(
          expectedBasketBallSportsLeagueId,
          1,
          tournamentName,
          openFrom,
          openTo,
          2022
        )
      )
        .to.emit(nfbDiamond, "LogAddTournament")
        .withArgs(
          expectedNewTournamentId,
          expectedBasketBallSportsLeagueId,
          tournamentName,
          1,
          2022,
          openFrom,
          openTo,
          users.deployer.address
        );

      expect(
        await nfbDiamond.setRounds(
          expectedNewTournamentId,
          roundsCount,
          tournamentsTestConstants.args.winnersPerRound
        )
      )
        .to.emit(nfbDiamond, "TournamentRoundsCountSet")
        .withArgs(expectedNewTournamentId, roundsCount);

      const roundStart = block.timestamp + 1 * ONE_HOUR;
      const roundEnd = roundStart + 1 * ONE_HOUR;

      const bracketLen = 63;

      await expect(
        nfbDiamond.setRoundBounds(
          expectedNewTournamentId,
          1,
          roundStart,
          roundEnd
        )
      )
        .to.emit(nfbDiamond, "LogSetRoundBounds")
        .withArgs(expectedNewTournamentId, 1, roundStart, roundEnd);

      await expect(
        nfbDiamond.setBracketLength(expectedNewTournamentId, bracketLen)
      )
        .to.emit(nfbDiamond, "BracketLengthSet")
        .withArgs(expectedNewTournamentId, bracketLen);

      const maximumPoints = 192;

      await expect(
        nfbDiamond.setMaximumPoints(expectedNewTournamentId, maximumPoints)
      )
        .to.emit(nfbDiamond, "MaximumPointsSet")
        .withArgs(expectedNewTournamentId, maximumPoints);

      // we will be using the already defined TOP 5 reward distribution

      await expect(
        nfbDiamond.setRoundIndexes(expectedNewTournamentId, roundIndexes)
      )
        .to.emit(nfbDiamond, "RoundIndexesSet")
        .withArgs(expectedNewTournamentId, roundIndexes);

      await expect(nfbDiamond.setTournamentStage(expectedNewTournamentId, 32))
        .to.emit(nfbDiamond, "TournamentStageSet")
        .withArgs(expectedNewTournamentId, 32);

      await expect(nfbDiamond.setSportSeason(expectedNewTournamentId, 2022))
        .to.emit(nfbDiamond, "LogTournamentSeasonUpdated")
        .withArgs(expectedNewTournamentId, 2022);

      const poolMaxEntries = 100;

      // Adding a free entry pool
      await addPoolMeta(
        user3Signer,
        user3Address,
        forwarder,
        nfbDiamond,
        expectedNewTournamentId,
        erc20Mock.address,
        false,
        poolMaxEntries
      );

      const differentFinalsScoresBrackets =
        MarchMadness2022TopWinnersBracketsFinalsScores;
      // let modifiedBracketsWithSums = new Array<object>();
      const actualFinalsSum = 215;
      // mint 10 winners
      for (let i = 0; i < 10; i++) {
        if (i === 4) {
          // make actual sum = 210
          differentFinalsScoresBrackets[i].finalsTeamOneScore = 108;
          differentFinalsScoresBrackets[i].finalsTeamTwoScore = 102;
        }
        if (i === 5) {
          // make actual sum = 212
          differentFinalsScoresBrackets[i].finalsTeamOneScore = 109;
          differentFinalsScoresBrackets[i].finalsTeamTwoScore = 103;
        }
        if (i === 6) {
          // make actual sum = 215
          differentFinalsScoresBrackets[i].finalsTeamOneScore = 110;
          differentFinalsScoresBrackets[i].finalsTeamTwoScore = 105;
        }
        if (i === 7) {
          // make actual sum = 214
          differentFinalsScoresBrackets[i].finalsTeamOneScore = 109;
          differentFinalsScoresBrackets[i].finalsTeamTwoScore = 105;
        }
        await expect(
          enterPool(
            user3Signer,
            user3Address,
            forwarder,
            nfbDiamond,
            erc20Mock,
            tournamentsTestConstants.args.PoolId,
            differentFinalsScoresBrackets[i],
            0,
            false
          )
        ).to.be.emit(
          nfbDiamond,
          tournamentsTestConstants.events.LogPoolEntered
        );
      }

      const totalBrackets = await nfbBracket.balanceOf(user3Address);

      await expect(totalBrackets).eq(10);
      await expect(differentFinalsScoresBrackets.length).eq(10);

      const tokenIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      for (let i = 1; i <= roundsCount; i++) {
        const currentTruthBracket = oracleBracketTruthAllRounds[i - 1];

        expect(currentTruthBracket.teamsIds.length).eq(bracketLen);

        // if we are updating results for the last round,
        // we should know the true actual sum score
        if (i == 6) {
          currentTruthBracket.finalsTeamOneScore = 110;
          currentTruthBracket.finalsTeamOneScore = 105;
          // so a total of 215 (effectively swapping winner 6 with winner 5 because winner 6 is closer to 215)
        }

        // Update bracket results after round 1 has finished
        await expect(
          nfbDiamond.updateBracketResults(
            expectedNewTournamentId,
            currentTruthBracket
          )
        ).to.emit(nfbDiamond, "LogBracketResultsUpdated");

        await nfbDiamond.emitBracketScores(
          expectedNewTournamentId,
          tokenIds,
          differentFinalsScoresBrackets
        );

        // End the current round
        const OVERTIME = ONE_HOUR * 2; // duration of 1 round
        await network.provider.send("evm_increaseTime", [OVERTIME]);
        await network.provider.send("evm_mine");

        const blockNumber = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNumber);

        const startNextRound = block.timestamp + 2 * ONE_HOUR;
        const endNextRound = startNextRound + 2 * ONE_HOUR;

        if (i + 1 <= roundsCount) {
          await nfbDiamond.setRoundBounds(
            expectedNewTournamentId,
            i + 1,
            startNextRound,
            endNextRound
          );
          await nfbDiamond.updateRound(expectedNewTournamentId);
        }

        if (i == roundsCount) {
          await network.provider.send("evm_increaseTime", [OVERTIME * 15]); // Simulate tournament has finished
          await network.provider.send("evm_mine");
        }
        // .withArgs(users.deployer.address, currentTruthBracket, 0, 0);
      }

      await expect(
        nfbDiamond.updateBracketScores(
          tournamentsTestConstants.args.PoolId,
          actualFinalsSum,
          tokenIds
        )
      )
        .to.emit(nfbDiamond, "LogBracketScoresUpdated")
        .withArgs(users.deployer.address);

      const contractTopWinners = await nfbDiamond.getTop(
        tournamentsTestConstants.args.PoolId
      );

      const contractTopWinnersNumbers = contractTopWinners.map((x) =>
        x.toNumber()
      );

      const contractEmittedScores: number[] = [];

      for (let i = 1; i <= 10; i++) {
        const currentTokenScoreId = await nfbDiamond.getNftScores(i);
        contractEmittedScores.push(currentTokenScoreId);
      }

      await expect(contractEmittedScores).eql(
        MarchMadness2022TopWinnersTokenIdScores
      );

      // we are swapping winner 5 with winner 6 since their scores are equal
      // however winner token id 6 is closer to the actual finals sum
      const expectedWinnerIds = [1, 2, 3, 4, 6, 5, 7, 8, 9, 10];

      await expect(contractTopWinnersNumbers).eql(expectedWinnerIds);
    });

    it("Should revert if tournament first round already started", async () => {
      await getInAdvance();

      addPoolArgs.poolCurrencyAddress = erc20Mock.address;

      const poolMaxEntries = 500;

      const blockNumber = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNumber);

      await expect(
        addPool(
          nfbDiamond,
          tournamentsTestConstants.args.TournamentId,
          erc20Mock.address,
          true,
          poolMaxEntries
        )
      ).to.revertedWithCustomError(
        tournamentsFacet,
        "TournamentsFacet__TournamentClosedForPoolCreation"
      );
    });

    it("Should revert if type is StakeToPlay and user puts an entry fee", async () => {
      addPoolArgs.poolCurrencyAddress = erc20Mock.address;
      const poolMaxEntries = 500;

      await expect(
        addPool(
          nfbDiamond,
          tournamentsTestConstants.args.TournamentId,
          erc20Mock.address,
          undefined,
          poolMaxEntries,
          entryFee,
          2,
          1000
        )
      ).to.be.revertedWithCustomError(
        tournamentsFacet,
        tournamentsTestConstants.errors.StakeToPlayShouldNotHaveEntryFee
      );
    });

    it("Should revert if prize model type is StakeToPlay and StakeToPlayAmount is 0", async () => {
      const poolMaxEntries = 500;
      await expect(
        addPool(
          nfbDiamond,
          tournamentsTestConstants.args.TournamentId,
          erc20Mock.address,
          undefined,
          poolMaxEntries,
          0,
          2,
          0
        )
      ).to.be.revertedWithCustomError(
        tournamentsFacet,
        tournamentsTestConstants.errors.StakeToPlayShouldHaveAmount
      );
    });

    it("Should revert if reward distribution id does not exist", async () => {
      const poolMaxEntries = 500;
      await expect(
        addPool(
          nfbDiamond,
          tournamentsTestConstants.args.TournamentId,
          erc20Mock.address,
          undefined,
          poolMaxEntries,
          undefined,
          undefined,
          0,
          nonExistingRewardDistributionId
        )
      ).to.be.revertedWithCustomError(
        tournamentsFacet,
        tournamentsTestConstants.errors.RewardDistributionNotFound
      );
    });

    it("Should revert EnterPool if tokenUri not set", async () => {
      const user3Signer = users.user3.signer;
      const user3Address = await user3Signer.getAddress();
      await addPool(
        user3Signer,
        user3Address,
        forwarder,
        nfbDiamond,
        tournamentsTestConstants.args.TournamentId,
        erc20Mock.address,
        true
      );

      const { request, signature } = await signMetaTxRequest(
        user3Signer.provider,
        forwarder,
        {
          from: user3Address,
          to: nfbDiamond.address,
          data: nfbDiamond.interface.encodeFunctionData("enterPool", [
            1,
            0,
            oldUserBracket,
            "",
            false,
            zeroAddress,
          ]),
        }
      );

      await expect(forwarder.execute(request, signature)).to.be.reverted;
      // await expect(
      //   enterPool(
      //     user3Signer,
      //     user3Address,
      //     forwarder,
      //     nfbDiamond,
      //     erc20Mock,
      //     tournamentsTestConstants.args.PoolId,
      //     oldUserBracket,
      //     0,
      //     false,
      //     EMPTY_STRING
      //   )
      // ).to.be.revertedWith("NFBR: Only with TokenUri");
    });

    it("Should revert EnterPool if poolSeasonId is different than tournamentId", async () => {
      await addPool(nfbDiamond, erc20Mock.address);
      const newSeason = 2025;
      await nfbDiamond.setSportSeason(
        tournamentsTestConstants.args.TournamentId,
        newSeason
      );
      await expect(enterPool(nfbDiamond, 1)).to.be.revertedWithCustomError(
        tournamentsFacet,
        tournamentsTestConstants.errors.CantEnterPoolFromAnotherSeason
      );
      ethers.provider.send("evm_revert", [snapshotId]);
    });

    it("Should revert EnterPool if the pool has reached maxEntries limit (it's full) ", async () => {
      // Add Pool with 1 max entry
      await expect(
        addPool(
          nfbDiamond,
          erc20Mock.address,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          1
        )
      )
        .to.be.emit(nfbDiamond, tournamentsTestConstants.events.LogAddPool)
        .withArgs(1, users.deployer.address);
      // let 1 user enter
      await expect(enterPool(nfbDiamond.connect(users.user1.signer), 1)).to.not
        .be.reverted;
      await expect(
        enterPool(nfbDiamond.connect(users.user2.signer), 1)
      ).to.be.revertedWithCustomError(
        tournamentsFacet,
        tournamentsTestConstants.errors.PoolAlreadyFull
      );
      ethers.provider.send("evm_revert", [snapshotId]);
    });

    it("Should not EnterPool if tournament has already started", async () => {
      await addPool(nfbDiamond, erc20Mock.address); // addPool

      await getInAdvance();

      await expect(
        enterPool(nfbDiamond.connect(users.user2.signer))
      ).to.be.revertedWithCustomError(
        tournamentsFacet,
        tournamentsTestConstants.errors.TournamentAlreadyStarted
      );
      ethers.provider.send("evm_revert", [snapshotId]);
    });

    // TODO: When does a pool becomes inActive ?
    // it("Should revert if pool is not active", async () => {
    //   await addPool(nfbDiamond, erc20Mock.address);
    //   await expect(
    //     enterPool(nfbDiamond, 1, undefined, undefined, EMPTY_STRING)
    //   ).to.be.revertedWith("NFBR: Only with TokenUri");
    // });

    it("Should enter free entry pool and emit", async () => {
      const { nfbDiamond } = await loadFixture(setupPoolFixture);
      await addPool(nfbDiamond, erc20Mock.address);
      await expect(enterPool(nfbDiamond.connect(users.user1.signer)))
        .to.emit(nfbDiamond, tournamentsTestConstants.events.LogPoolEntered)
        .withArgs(tournamentsTestConstants.args.PoolId, 1, users.user1.address);
      ethers.provider.send("evm_revert", [snapshotId]);
    });

    // TODO: We should talk about the revert with custom error here because its probably not needed
    it("Should not enter paid entry pool without providing fee", async () => {
      // No approved spending for user2
      await addPoolWithEntryFee(nfbDiamond, erc20Mock.address); // addPoolWithEntryFee

      const entryFee = ethers.BigNumber.from(100000000000000);

      const user1balance = await erc20Mock.balanceOf(users.user1.address);

      await erc20Mock
        .connect(users.user2.signer)
        .approve(nfbDiamond.address, entryFee);

      await expect(enterPool(nfbDiamond.connect(users.user2.signer))).to.be
        .reverted;
      ethers.provider.send("evm_revert", [snapshotId]);
    });

    it("Should NOT ENTER TOKEN GATED pool if user doesn't have enough access tokens", async () => {
      const { nfbDiamond } = await loadFixture(setupPoolFixture);
      await addPoolWithAccessToken(
        nfbDiamond,
        erc20Mock.address,
        erc20Mock.address
      ); // addPoolWithAccessToken - required 200 tokens to enter

      let user2ERC20Balance = await erc20Mock.balanceOf(users.user2.address);
      expect(user2ERC20Balance).eq(0);

      await erc20Mock.transfer(
        users.user2.address,
        100 // provide only 100 tokens
      );
      user2ERC20Balance = await erc20Mock.balanceOf(users.user2.address);
      expect(user2ERC20Balance).eq(100);

      await expect(
        enterPool(nfbDiamond.connect(users.user2.signer))
      ).to.be.revertedWithCustomError(
        tournamentsFacet,
        tournamentsTestConstants.errors.NotEnoughAmountTokenGatedAccess
      );
      ethers.provider.send("evm_revert", [snapshotId]);
    });

    it("Should not be able to enter a non-editable-bracket-pool with an editable bracket", async () => {
      await addPool(nfbDiamond, erc20Mock.address, true); // pool 1 - allow editable brackets
      await addPool(nfbDiamond, erc20Mock.address, false); // pool 2 - don't allow editable brackets

      await expect(
        enterPool(nfbDiamond.connect(users.user1.signer), 1, undefined, true)
      ).to.emit(nfbDiamond, tournamentsTestConstants.events.LogPoolEntered);

      await expect(
        enterPool(nfbDiamond.connect(users.user1.signer), 2, 1, true)
      ).to.be.revertedWithCustomError(
        tournamentsFacet,
        tournamentsTestConstants.errors.PoolDoesntAllowEditableBracket
      );
      ethers.provider.send("evm_revert", [snapshotId]);
    });
  });

  context("Delegate.cash", () => {
    it("Should ENTER pool and emit DelegateSuccessful and LogPoolEntered", async () => {
      const accessTokenMinAmount = 2;
      await expect(
        addPoolTokenGated(
          nfbDiamond,
          erc20Mock.address,
          erc20Mock.address,
          accessTokenMinAmount
        )
      );

      await erc20Mock.transfer(users.user2.address, 2);

      const hotWallet = users.user1.address; // delegate - the wallet which interacts with the diamond
      const hotWalletSigner = users.user1.signer;
      const coldWallet = users.user2.address; // calls delegationRegistry to delegate hotWallet
      const coldWalletSigner = users.user2.signer;

      // cold wallet (user2) delegates to hot wallet (user1)
      await delegationRegistryMock
        .connect(coldWalletSigner)
        .delegateForContract(hotWallet, erc20Mock.address, true); // delegate for our ERC20 token contract

      // diamond should emit DelegateSuccessful and LogPoolEntered events
      await expect(
        enterPoolTokenGated(nfbDiamond.connect(hotWalletSigner), coldWallet, 1)
      )
        .to.emit(nfbDiamond, tournamentsTestConstants.events.DelegateSuccessful)
        .to.emit(nfbDiamond, tournamentsTestConstants.events.LogPoolEntered);
      ethers.provider.send("evm_revert", [snapshotId]);
    });

    it("Should NOT ENTER POOL and should be reverted with NotEnoughAmountTokenGatedAccess", async () => {
      const accessTokenMinAmount = 2; // 2 tokens required to enter
      await expect(
        addPoolTokenGated(
          nfbDiamond,
          erc20Mock.address,
          erc20Mock.address,
          accessTokenMinAmount
        )
      );

      await erc20Mock.transfer(users.user2.address, 1); // transfer only 1 token

      const hotWallet = users.user1.address; // delegate - the wallet which interacts with the diamond
      const hotWalletSigner = users.user1.signer;
      const coldWallet = users.user2.address; // calls delegationRegistry to delegate hotWallet
      const coldWalletSigner = users.user2.signer;

      // cold wallet (user2) delegates to hot wallet (user1)
      await delegationRegistryMock
        .connect(coldWalletSigner)
        .delegateForContract(hotWallet, erc20Mock.address, true); // delegate for our ERC20 token contract

      // diamond should emit DelegateSuccessful and LogPoolEntered events
      await expect(
        enterPoolTokenGated(nfbDiamond.connect(hotWalletSigner), coldWallet, 1)
      ).to.be.revertedWithCustomError(
        tournamentsFacet,
        tournamentsTestConstants.errors.NotEnoughAmountTokenGatedAccess
      );
      ethers.provider.send("evm_revert", [snapshotId]);
    });

    it("Should NOT ENTER POOL and should revert with InvalidDelegateVaultPairing", async () => {
      const accessTokenMinAmount = 2;
      await expect(
        addPoolTokenGated(
          nfbDiamond,
          erc20Mock.address,
          erc20Mock.address,
          accessTokenMinAmount
        )
      );

      await erc20Mock.transfer(users.user2.address, 2);

      const hotWallet = users.user1.address; // delegate - the wallet which interacts with the diamond
      const hotWalletSigner = users.user1.signer;
      const coldWallet = users.user2.address; // calls delegationRegistry to delegate hotWallet
      const coldWalletSigner = users.user2.signer;

      // hot wallet wasn't delegated yet and fails
      await expect(
        enterPoolTokenGated(nfbDiamond.connect(hotWalletSigner), coldWallet, 1) // caldWallet is the user who owns the tokens but hasn't delegated to hot wallet yet
      ).to.be.revertedWithCustomError(
        tournamentsFacet,
        tournamentsTestConstants.errors.InvalidDelegateVaultPairing
      );
      ethers.provider.send("evm_revert", [snapshotId]);
    });
  });
});

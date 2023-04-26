import hre, { ethers, network } from "hardhat";
import { expect } from "chai";
import {
  BigNumber,
  Signer,
  ContractReceipt,
  ContractTransaction,
  Event,
} from "ethers";
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
  TOP100_TIERED_REWARD_RANGES,
  TOP100_TIERED_REWARD_PERCENTAGES,
  TOP10_TIERED_REWARD_PERCENTAGES,
  TOP10_TIERED_REWARD_RANGES,
  TOP1_TIERED_REWARD_PERCENTAGES,
  TOP1_TIERED_REWARD_RANGES,
} from "./helpers/constants";
import Users from "./helpers/users";
import {
  getTournamentParams,
  setRoundsBoundsAndAdvance,
  addPool,
  enterPool,
  addPoolWithEntryFee,
  addPoolWith2Entries,
  addPoolWithAccessToken,
  addPoolTokenGated,
  enterPoolTokenGated,
  getInAdvance,
  simulateRounds,
  updateBracket,
  claim,
  addPoolWithStake,
  generateBracket,
  addPoolCustomRoyalty,
  addPoolWithCustomRewardDistributionId,
} from "./helpers/helpers";
import { init } from "./helpers/initContracts";
import { loadFixture } from "ethereum-waffle";
import { signMetaTxRequest } from "../scripts/meta/signer.js";
import exp from "constants";
import { LogAddPool } from '../subgraph/generated/schema';

describe("NFBRewardPoolFacet tests", () => {
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
  const nonExistingRewardDistributionId = 4;

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

    // console.log("Round start", roundStart); // 1677967533

    await nfbDiamond.setBracketLength(
      tournamentsTestConstants.args.TournamentId,
      bracketLength
    );

    await nfbDiamond.setMaximumPoints(
      tournamentsTestConstants.args.TournamentId,
      bracketMaximumPoints
    );

    await nfbDiamond.addRewardDistribution(
      "Top 5",
      TOP5_TIERED_REWARD_PERCENTAGES,
      TOP5_TIERED_REWARD_RANGES,
      false
    );

    await nfbDiamond.addRewardDistribution(
      "Top 10",
      TOP10_TIERED_REWARD_PERCENTAGES,
      TOP10_TIERED_REWARD_RANGES,
      false
    );

    await nfbDiamond.addRewardDistribution(
      "Top 100",
      TOP100_TIERED_REWARD_PERCENTAGES,
      TOP100_TIERED_REWARD_RANGES,
      false
    );

    await nfbDiamond.addRewardDistribution(
      "All or Nothing",
      TOP1_TIERED_REWARD_PERCENTAGES,
      TOP1_TIERED_REWARD_RANGES,
      true
    );

    await nfbDiamond.setRoundIndexes(
      tournamentsTestConstants.args.TournamentId,
      roundIndexes
    );

    await nfbDiamond.setTournamentStage(
      tournamentsTestConstants.args.TournamentId,
      tournamentStage
    );

    addPoolArgs = tournamentsTestConstants.args.addPoolArgs;

    await erc20Mock
      .connect(users.user1.signer)
      .transfer(users.user4.address, 100000000);

    await erc20Mock
      .connect(users.user1.signer)
      .transfer(users.user5.address, 100000000);
  });

  beforeEach(async () => {
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  context("for Entering pool", () => {
    it("should enter pool and have funds in the pool fund", async function () {
      await addPoolWithEntryFee(nfbDiamond, erc20Mock.address);

      const totalRewardsByPoolBefore = await nfbDiamond.getTotalRewards(
        tournamentsTestConstants.args.PoolId
      );

      // console.log('totalRewardsByPoolBefore', totalRewardsByPoolBefore);

      await erc20Mock
        .connect(users.user4.signer)
        .approve(
          nfbDiamond.address,
          tournamentsTestConstants.args.addPoolArgs.entryFee
        );

      await expect(
        nfbDiamond
          .connect(users.user4.signer)
          .enterPool(
            tournamentsTestConstants.args.PoolId,
            0,
            newUserBracket,
            mockIpfsUri,
            false,
            zeroAddress
          )
      )
        .to.emit(nfbDiamond, "LogPoolEntered")
        .withArgs(tournamentsTestConstants.args.PoolId, 1, users.user4.address);

      const totalRewardsByPoolAfter = await nfbDiamond.getTotalRewards(
        tournamentsTestConstants.args.PoolId
      );

      // console.log('totalRewardsByPoolAfter', totalRewardsByPoolAfter);

      expect(totalRewardsByPoolBefore).to.equal(0);
      expect(totalRewardsByPoolAfter).to.equal(
        tournamentsTestConstants.args.addPoolArgs.entryFee
      );
    });

    it("should enter pool and have stakes for 2 users in the diamond address", async function () {
      await addPoolWithStake(nfbDiamond, erc20Mock.address);

      const totalStakesBefore = await nfbDiamond.getStakePoolStakesAmount(
        tournamentsTestConstants.args.PoolId
      );

      const diamondStakesAmountBefore = await erc20Mock.balanceOf(
        nfbDiamond.address
      );

      // console.log('totalStakesBefore', totalStakesBefore);
      // console.log('diamondStakesAmountBefore', diamondStakesAmountBefore);

      // approves
      await erc20Mock
        .connect(users.user4.signer)
        .approve(
          nfbDiamond.address,
          tournamentsTestConstants.args.addPoolArgs.stakeToPlayAmount
        );

      await erc20Mock
        .connect(users.user5.signer)
        .approve(
          nfbDiamond.address,
          tournamentsTestConstants.args.addPoolArgs.stakeToPlayAmount
        );

      // enter pool
      await expect(
        nfbDiamond
          .connect(users.user4.signer)
          .enterPool(
            tournamentsTestConstants.args.PoolId,
            0,
            newUserBracket,
            mockIpfsUri,
            false,
            zeroAddress
          )
      )
        .to.emit(nfbDiamond, "LogPoolEntered")
        .withArgs(tournamentsTestConstants.args.PoolId, 1, users.user4.address);

      await expect(
        nfbDiamond
          .connect(users.user5.signer)
          .enterPool(
            tournamentsTestConstants.args.PoolId,
            0,
            newUserBracket,
            mockIpfsUri,
            false,
            zeroAddress
          )
      )
        .to.emit(nfbDiamond, "LogPoolEntered")
        .withArgs(tournamentsTestConstants.args.PoolId, 2, users.user5.address);

      const totalStakesAfter = await nfbDiamond.getStakePoolStakesAmount(
        tournamentsTestConstants.args.PoolId
      );

      const diamondStakesAmountAfter = await erc20Mock.balanceOf(
        nfbDiamond.address
      );

      // console.log('totalStakesAfter', totalStakesAfter);
      // console.log('diamondStakesAmountAfter', diamondStakesAmountAfter);

      expect(totalStakesBefore).to.equal(0);
      expect(totalStakesAfter).to.equal(
        tournamentsTestConstants.args.addPoolArgs.stakeToPlayAmount.mul(2)
      ); // 2 users joined
      expect(diamondStakesAmountAfter).to.equal(
        tournamentsTestConstants.args.addPoolArgs.stakeToPlayAmount.mul(2)
      ); // 2 users joined
    });
  });

  context("for calculating reward", () => {
    it("should calculate reward during tournament (for vizualization) with 10% royalty", async function () {
      const royaltyAmount = BigNumber.from(1000); // 1000 is 10% in basis points
      await addPoolCustomRoyalty(nfbDiamond, erc20Mock.address, royaltyAmount);

      const totalRewardsByPoolBefore = await nfbDiamond.getTotalRewards(
        tournamentsTestConstants.args.PoolId
      );

      // console.log('totalRewardsByPoolBefore', totalRewardsByPoolBefore);

      await erc20Mock
        .connect(users.user4.signer)
        .approve(
          nfbDiamond.address,
          tournamentsTestConstants.args.addPoolArgs.entryFee
        );

      await expect(
        nfbDiamond
          .connect(users.user4.signer)
          .enterPool(
            tournamentsTestConstants.args.PoolId,
            0,
            newUserBracket,
            mockIpfsUri,
            false,
            zeroAddress
          )
      ).to.emit(nfbDiamond, "LogPoolEntered");

      const TEST_REWARD_RANGES = TOP100_TIERED_REWARD_RANGES;
      const TEST_REWARD_PERCENTAGES = TOP100_TIERED_REWARD_PERCENTAGES;

      const numberOfPositionsToTest =
        TEST_REWARD_RANGES[TEST_REWARD_RANGES.length - 1] + 10;

      const calculatedRoyalty =
        tournamentsTestConstants.args.addPoolArgs.entryFee
          .mul(royaltyAmount)
          .div(10000); // 10% royalty
      const poolTotalRewardsMinusRoyalty =
        tournamentsTestConstants.args.addPoolArgs.entryFee.sub(
          calculatedRoyalty
        );

      for (let position = 1; position <= numberOfPositionsToTest; position++) {
        // console.log("position", position);
        let reward: any = 0;
        for (let r = 0; r < TEST_REWARD_RANGES.length - 1; r++) {
          if (
            position >= TEST_REWARD_RANGES[r] &&
            position < TEST_REWARD_RANGES[r + 1]
          ) {
            const winnersCountInRange =
              TEST_REWARD_RANGES[r + 1] - TEST_REWARD_RANGES[r];
            const rewardForAllInCurrentRange = ethers.BigNumber.from(
              poolTotalRewardsMinusRoyalty
            )
              .mul(TEST_REWARD_PERCENTAGES[r])
              .div(10000); // percentages are in Basis points (bps) - 100% = 10000 bps // 5% = 500 bps, so that's why the divider is 10000
            const rewardForOneInCurrentRange =
              rewardForAllInCurrentRange.div(winnersCountInRange);
            reward = rewardForOneInCurrentRange;
            break;
          }
        }

        const calculatedReward = await nfbDiamond.calcReward(
          tournamentsTestConstants.args.PoolId,
          position
        );
        const EPS = 1000; // Admissible difference in Wei
        // console.log(reward, calculatedReward);
        expect(reward).to.be.closeTo(calculatedReward, EPS);
      }
    });

    it("should calculate reward during tournament (for vizualization) NO ROYALTY", async function () {
      const royaltyAmount = BigNumber.from(0); // 1000 is 10% in basis points
      await addPoolCustomRoyalty(nfbDiamond, erc20Mock.address, royaltyAmount);

      const totalRewardsByPoolBefore = await nfbDiamond.getTotalRewards(
        tournamentsTestConstants.args.PoolId
      );

      // console.log('totalRewardsByPoolBefore', totalRewardsByPoolBefore);

      await erc20Mock
        .connect(users.user4.signer)
        .approve(
          nfbDiamond.address,
          tournamentsTestConstants.args.addPoolArgs.entryFee
        );

      await expect(
        nfbDiamond
          .connect(users.user4.signer)
          .enterPool(
            tournamentsTestConstants.args.PoolId,
            0,
            newUserBracket,
            mockIpfsUri,
            false,
            zeroAddress
          )
      ).to.emit(nfbDiamond, "LogPoolEntered");

      const TEST_REWARD_RANGES = TOP100_TIERED_REWARD_RANGES; // replace here with TOP5, TOP10, etc.
      const TEST_REWARD_PERCENTAGES = TOP100_TIERED_REWARD_PERCENTAGES; // replace here with TOP5, TOP10, etc.

      const numberOfPositionsToTest =
        TEST_REWARD_RANGES[TEST_REWARD_RANGES.length - 1] + 10; // test 10 more cases on top of the existing last winner position

      const calculatedRoyalty =
        tournamentsTestConstants.args.addPoolArgs.entryFee
          .mul(royaltyAmount)
          .div(10000); // 10% royalty
      const poolTotalRewardsMinusRoyalty =
        tournamentsTestConstants.args.addPoolArgs.entryFee.sub(
          calculatedRoyalty
        );

      for (let position = 1; position <= numberOfPositionsToTest; position++) {
        // console.log("position", position);
        let reward: any = 0;
        for (let r = 0; r < TEST_REWARD_RANGES.length - 1; r++) {
          if (
            position >= TEST_REWARD_RANGES[r] &&
            position < TEST_REWARD_RANGES[r + 1]
          ) {
            const winnersCountInRange =
              TEST_REWARD_RANGES[r + 1] - TEST_REWARD_RANGES[r];
            const rewardForAllInCurrentRange = ethers.BigNumber.from(
              poolTotalRewardsMinusRoyalty
            )
              .mul(TEST_REWARD_PERCENTAGES[r])
              .div(10000); // percentages are in Basis points (bps) - 100% = 10000 bps // 5% = 500 bps, so that's why the divider is 10000
            const rewardForOneInCurrentRange =
              rewardForAllInCurrentRange.div(winnersCountInRange);
            reward = rewardForOneInCurrentRange;
            break;
          }
        }

        const calculatedReward = await nfbDiamond.calcReward(
          tournamentsTestConstants.args.PoolId,
          position
        );
        const EPS = 1000; // Admissible difference in Wei
        // console.log(reward, calculatedReward);
        expect(reward).to.be.closeTo(calculatedReward, EPS);
      }
    });
  });

  context("for claim", () => {
    it("should claim the right amount if the user's bracket is winning TOP 5", async function () {
      // users for testing
      const user1Singer = users.user4.signer;
      const user1Address = users.user4.address;
      const user2Singer = users.user5.signer;
      const user2Address = users.user5.address;

      await nfbDiamond.addPool({
        name: tournamentsTestConstants.args.PoolName,
        tournamentId: 1,
        maxEntries: 5,
        entryFee: tournamentsTestConstants.args.addPoolArgs.entryFee,
        poolCurrencyAddress: erc20Mock.address,
        accessTokenAddress: zeroAddress,
        accessTokenMinAmount: 0,
        prizeModelType: 0,
        stakeToPlayAmount: 0,
        prizeDistributionType: 0, // Standard
        rewardDistributionId: 1, // 1 - Top5, 2 - Top10, 3 - Top100
        royaltyType: 0,
        royaltyAmount: 0,
        sponsoredPrizeAmount: 0,
        isFeatured: false,
        allowEditableBrackets: true,
      });

      /* await addPoolWithCustomRewardDistributionId(
        nfbDiamond,
        erc20Mock.address,
        1
      ); // 1 - Top5, 2 - Top10, 3 - Top100); */
      const TEST_REWARD_PERCENTAGES = TOP5_TIERED_REWARD_PERCENTAGES;

      // log
      const totalRewardsByPoolBefore = await nfbDiamond.getTotalRewards(
        tournamentsTestConstants.args.PoolId
      );
      // console.log('totalRewardsByPoolBefore', totalRewardsByPoolBefore);

      const user1FundsStart = await erc20Mock.balanceOf(user1Address);
      const user2FundsStart = await erc20Mock.balanceOf(user2Address);
      // console.log('user1FundsStart', user1FundsStart);
      // console.log('user2FundsStart', user2FundsStart);
      // enter pool twice
      await erc20Mock.connect(user1Singer).approve(nfbDiamond.address, 100);

      await expect(
        nfbDiamond
          .connect(user1Singer)
          .enterPool(
            tournamentsTestConstants.args.PoolId,
            0,
            WinningTokenBrackets[0],
            mockIpfsUri,
            false,
            zeroAddress
          )
      ).to.emit(nfbDiamond, "LogPoolEntered");

      await erc20Mock
        .connect(user2Singer)
        .approve(
          nfbDiamond.address,
          tournamentsTestConstants.args.addPoolArgs.entryFee
        );

      await expect(
        nfbDiamond
          .connect(user2Singer)
          .enterPool(
            tournamentsTestConstants.args.PoolId,
            0,
            WinningTokenBrackets[1],
            mockIpfsUri,
            false,
            zeroAddress
          )
      ).to.emit(nfbDiamond, "LogPoolEntered");

      const user1FundsBefore = await erc20Mock.balanceOf(user1Address);
      const user2FundsBefore = await erc20Mock.balanceOf(user2Address);
      // console.log('user1FundsBefore', user1FundsBefore.toString());
      // console.log('user2FundsBefore', user2FundsBefore.toString());
      // log
      const totalRewardsByPoolAfter = await nfbDiamond.getTotalRewards(
        tournamentsTestConstants.args.PoolId
      );
      // console.log('totalRewardsByPoolAfter', totalRewardsByPoolAfter);

      // update scores, move through the end of the tournament
      await simulateRounds(
        nfbDiamond,
        tournamentsTestConstants.args.TournamentRoundsCount,
        [WinningTokenBrackets[0], WinningTokenBrackets[1]]
      );

      await nfbDiamond.updateBracketScores(
        tournamentsTestConstants.args.PoolId,
        tournamentsTestConstants.args.FinalsScoreSum,
        tournamentsTestConstants.args.WinningTokenIds
      );

      await expect(
        nfbDiamond
          .connect(user1Singer)
          .claim(tournamentsTestConstants.args.PoolId, 1)
      ).to.emit(nfbDiamond, "LogRewardClaimed");

      await expect(
        nfbDiamond
          .connect(user2Singer)
          .claim(tournamentsTestConstants.args.PoolId, 2)
      ).to.emit(nfbDiamond, "LogRewardClaimed");

      const user1FundsAfter = await erc20Mock.balanceOf(user1Address);
      const user2FundsAfter = await erc20Mock.balanceOf(user2Address);
      // console.log('user1FundsAfter', user1FundsAfter);
      // console.log('user2FundsAfter', user2FundsAfter);

      const expectedUser1Earnings =
        tournamentsTestConstants.args.addPoolArgs.entryFee
          .mul(2) // 2 brackets minted
          .mul(TEST_REWARD_PERCENTAGES[0]) // first place percentage
          .div(10000); // percentages are in Basis points (bps) - 100% = 10000 bps

      const expectedUser2Earnings =
        tournamentsTestConstants.args.addPoolArgs.entryFee
          .mul(2) // 2 brackets minted
          .mul(TEST_REWARD_PERCENTAGES[1]) // second place percentage
          .div(10000); // percentages are in Basis points (bps) - 100% = 10000 bps

      // console.log("user1 funds: ", user1FundsAfter.toString())
      // console.log("expected user1 funds: ", expectedUser1Earnings.toString())
      // console.log("user2 funds: ", user2FundsAfter.toString())
      // console.log("expected user2 funds: ", user2FundsAfter.toString())

      expect(user1FundsAfter).to.be.equal(
        expectedUser1Earnings.add(user1FundsBefore)
      );
      expect(user2FundsAfter).to.be.equal(
        expectedUser2Earnings.add(user2FundsBefore)
      );
    });
  });

  // context("for withdrawFundsLeft", () => {
  //   it("should withdrawFundsLeft 180 days after the tournament has finished ", async function () {
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
  //         false,
  //         zeroAddress
  //       );

  //     const ownersFundsBefore = await erc20Mock.balanceOf(
  //       users.deployer.address
  //     );
  //     const nfbPoolFundsBefore = await erc20Mock.balanceOf(
  //       nfbDiamond.address // TODO: this was set as nfbRewardPoolAddress before
  //     );

  //     await setRoundsBoundsAndAdvance(
  //       nfbDiamond,
  //       tournamentsTestConstants.args.TournamentFormatId
  //     ); // Increase time with 15 days

  //     const OVERTIME = ONE_HOUR * 24 * 180; // Increase time with 180 days
  //     await network.provider.send("evm_increaseTime", [OVERTIME]); // Simulate tournament has finished
  //     await network.provider.send("evm_mine");

  //     const rewardPoolFunds = ethers.BigNumber.from(price).div(5).mul(4);

  //     await expect(nfbDiamond.withdrawFundsLeft(users.user1.address))
  //       .to.emit(nfbDiamond, "LogWithdrawFundsLeft")
  //       .withArgs(users.user1.address, rewardPoolFunds);

  //     const ownersFundsAfter = await erc20Mock.balanceOf(users.user1.address);
  //     const nfbPoolFundsAfter = await erc20Mock.balanceOf(nfbDiamond.address);

  //     expect(ownersFundsAfter).to.be.gt(ownersFundsBefore);
  //     expect(nfbPoolFundsBefore).to.equal(rewardPoolFunds);
  //     expect(nfbPoolFundsAfter).to.equal(0);
  //   });

  //   it("must fail if another address is calling pullFundsOut", async function () {
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
  //         false,
  //         zeroAddress
  //       );

  //     await setRoundsBoundsAndAdvance(
  //       nfbDiamond,
  //       tournamentsTestConstants.args.TournamentFormatId
  //     ); // Increase time with 15 days

  //     const OVERTIME = ONE_HOUR * 24 * 179; // Increase time with 179 days while 180 are needed for funds to be allowed for withdrawing
  //     await network.provider.send("evm_increaseTime", [OVERTIME]); // Simulate tournament has finished

  //     await expect(
  //       nfbDiamond
  //         .connect(users.user2.signer)
  //         .pullFundsOut(tournamentsTestConstants.args.PoolId)
  //     ).to.be.revertedWith("Must be contract owner");
  //   });
  // });
});

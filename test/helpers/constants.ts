import { ethers } from "ethers";
import { DataTypes } from "../../typechain/contracts/IDiamond";

export const nftUpdatePrice: string = (20 * 10 ** 18).toString();

export const dgenTokenAddress = "0xdBb5Da27FFcFeBea8799a5832D4607714fc6aBa8";

export const testAddress = "0x380Fa2d97357e2bEf991c63CEC20a280b8CA6EE3";

export const zeroAddress: string = "0x0000000000000000000000000000000000000000";

export const ONE_MIN = 60;

export const ONE_HOUR: number = ONE_MIN * 60;

export const FORTY_MINS_IN_MS: number = 2400000;

export const testTokenId = 1;

export const ROUND_ONE = 1;

export const teamIdsArray: any = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
  23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41,
  42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
  61, 62, 63,
];

export const bracketStruct: any = {
  teamsIds: teamIdsArray,
  finalsTeamOneScore: 100,
  finalsTeamTwoScore: 98,
};

export const tournamentStage = 32;

export const mockIpfsUri = "QmRFT3Q19u6gZhafbgiwWdT57MN8tbVAiJJbyfkdAVo4SA";

export const bracketLength = 63;

export const bracketMaximumPoints = 192;

export const roundIndexes = [0, 32, 48, 56, 60, 62];

export const roundWinners = [32, 16, 8, 4, 2, 1];

export const maxPoints = 192;

export const EMPTY_STRING = "";

const winningBracketIds = [
  //                                                         1st round
  15, 6, 1, 31, 2, 55, 59, 33, 14, 48, 16, 23, 17, 18, 3, 42, 25, 26, 36, 63,
  45, 53, 40, 52, 10, 27, 32, 46, 7, 51, 44, 12,
  //                                                         2nd round
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  //                                                         3rd round
  0, 0, 0, 0, 0, 0, 0, 0,
  //                                                         4th round
  0, 0, 0, 0,
  //                                                         5th round
  0, 0,
  //                                                         6th round
  0,
];

const oldUserBracketIds = [
  //                                                         1st round
  15, 6, 1, 31, 2, 55, 59, 33, 14, 48, 16, 23, 17, 18, 3, 42, 25, 26, 36, 63,
  45, 53, 40, 52, 10, 27, 32, 46, 7, 51, 44, 12,
  //                                                         2nd round
  15, 1, 2, 59, 14, 16, 17, 3, 25, 36, 45, 40, 10, 32, 7, 44,
  //                                                         3rd round
  15, 2, 14, 17, 25, 45, 10, 7,
  //                                                         4th round
  2, 14, 25, 10,
  //                                                         5th round
  2, 25,
  //                                                         6th round
  2,
];

const newUserBracketIds = [
  //                                                         1st round
  15,
  6,
  1,
  31,
  2,
  55,
  59,
  33,
  14,
  48,
  16,
  23,
  17,
  18,
  3,
  42,
  25,
  26,
  36,
  63,
  45,
  53,
  40,
  52,
  10,
  27,
  32,
  46,
  7,
  51,
  44,
  12,
  //!                                                        2nd round
  6,
  1,
  2,
  59,
  14,
  16,
  17,
  3,
  25,
  36,
  45,
  40,
  10,
  32,
  7,
  44, //
  //!                                                        3rd round
  1,
  2,
  14,
  17,
  25,
  45,
  10,
  7,
  //                                                         4th round
  2,
  14,
  25,
  10,
  //                                                         5th round
  2,
  25,
  //                                                         6th round
  2,
];

export const testBrackets = [
  [
    //* first round
    102, 209, 252, 113, 30, 107, 103, 6, 334, 105, 61, 180, 246, 106, 245, 91,
    108, 96, 58, 141, 111, 276, 271, 320, 95, 269, 250, 29, 253, 296, 92, 275,
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
  ],
  [
    //* first round
    102, 209, 252, 113, 30, 107, 103, 6, 334, 105, 61, 180, 246, 106, 245, 91,
    108, 96, 58, 141, 111, 276, 271, 320, 95, 269, 250, 29, 253, 296, 92, 275,
    //* second
    209, 252, 30, 6, 334, 61, 246, 245, 108, 58, 276, 320, 95, 29, 253, 275,
    //* third
    252, 6, 334, 246, 108, 276, 95, 253,
    //* fourth
    6, 334, 108, 253,
    //* fifth
    334, 253,
    //* sixth
    334,
  ],
  [
    //* first round
    102, 209, 252, 113, 30, 107, 103, 6, 334, 105, 61, 180, 246, 106, 245, 91,
    108, 96, 58, 141, 111, 276, 271, 320, 95, 269, 250, 29, 253, 296, 92, 275,
    //* second
    209, 252, 30, 6, 660, 61, 500, 245, 108, 58, 276, 320, 95, 29, 253, 275,
    //* third
    252, 6, 660, 500, 108, 276, 95, 253,
    //* fourth
    6, 660, 108, 253,
    //* fifth
    660, 108,
    //* sixth
    108,
  ],
  [
    //* first round
    401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415,
    416, 417, 418, 419, 420, 421, 422, 423, 424, 425, 426, 427, 428, 429, 430,
    //* second round
    431, 432, 401, 403, 405, 407, 409, 411, 413, 415, 417, 419, 421, 423, 425,
    427, 429, 431,
    //* third round
    401, 405, 409, 413, 417, 421, 425, 429,
    //* forth round
    401, 409, 417, 425,
    //* 5th round
    401, 471,
    //* 6th round
    108,
  ],
  [
    //* first round
    102, 209, 252, 113, 30, 107, 103, 6, 334, 105, 61, 180, 246, 106, 245, 91,
    108, 96, 58, 141, 111, 276, 271, 320, 95, 269, 250, 29, 253, 296, 92, 275,
    //* second
    102, 113, 107, 103, 105, 180, 106, 91, 96, 141, 111, 271, 269, 250, 296, 92,
    //* third
    113, 103, 105, 106, 96, 111, 269, 296,
    //* 4th
    103, 105, 96, 296,
    //* 5th
    105, 96,
    //* 6th
    96,
  ],
  [
    //* first round
    102, 209, 252, 113, 30, 107, 103, 6, 334, 105, 61, 180, 246, 106, 245, 91,
    108, 96, 58, 141, 111, 276, 271, 320, 95, 269, 250, 29, 253, 296, 92, 275,
    //* second
    209, 252, 30, 6, 334, 61, 246, 245, 108, 58, 276, 320, 95, 29, 253, 275,
    //* third
    209, 30, 61, 245, 58, 320, 29, 275,
    //* forth
    30, 61, 58, 275,
    //* fifth
    61, 58,
    //* 6th
    58,
  ],
  [
    //* first round
    102, 209, 252, 113, 30, 107, 103, 6, 334, 105, 61, 180, 246, 106, 245, 91,
    108, 96, 58, 141, 111, 276, 271, 320, 95, 269, 250, 29, 253, 296, 92, 275,
    //* second
    209, 252, 30, 6, 334, 61, 246, 245, 108, 58, 276, 320, 95, 29, 253, 275,
    //* third
    252, 6, 334, 246, 108, 276, 95, 253,
    //* forth
    252, 246, 276, 95,
    //* fifth
    246, 276,
    //* sixth
    276,
  ],
  [
    //* first round
    102, 209, 252, 113, 30, 107, 103, 6, 334, 105, 61, 180, 246, 106, 245, 91,
    108, 96, 58, 141, 111, 276, 271, 320, 95, 269, 250, 29, 253, 296, 92, 275,
    //* second
    209, 252, 30, 6, 334, 61, 246, 245, 108, 58, 276, 320, 95, 29, 253, 275,
    //* third
    252, 6, 334, 246, 108, 276, 95, 253,
    //* fourth
    6, 334, 108, 253,
    // * fifth
    6, 253,
    //* sixth
    253,
  ],
  [
    // first
    102, 209, 252, 113, 30, 107, 103, 6, 334, 105, 61, 180, 246, 106, 245, 91,
    400, 96, 58, 141, 111, 276, 271, 320, 95, 269, 250, 29, 253, 296, 92, 275,
    // second
    102, 252, 30, 6, 334, 61, 246, 245, 400, 58, 276, 320, 95, 29, 253, 275,
    // third
    252, 6, 334, 246, 400, 276, 95, 253,
    // forth
    6, 334, 400, 253,
    // fifth
    334, 400,
    // sixth
    400,
  ],
  [
    // first
    102, 209, 252, 113, 30, 107, 103, 6, 334, 105, 61, 180, 246, 106, 245, 91,
    400, 96, 58, 141, 111, 276, 271, 320, 95, 269, 250, 29, 253, 296, 92, 275,
    // second
    102, 252, 30, 6, 334, 61, 246, 245, 400, 58, 276, 320, 95, 29, 253, 275,
    // third
    252, 6, 334, 246, 400, 276, 95, 253,
    // forth
    6, 334, 400, 253,
    // fifth
    334, 400,
    // sixth
    334,
  ],
  [
    // first
    102, 209, 252, 113, 30, 107, 103, 6, 334, 105, 61, 180, 246, 106, 245, 91,
    400, 96, 58, 141, 111, 276, 271, 320, 95, 269, 250, 29, 253, 296, 92, 275,
    // second
    209, 252, 30, 6, 334, 61, 246, 245, 400, 58, 276, 320, 95, 29, 253, 275,
    // third
    252, 6, 334, 246, 400, 276, 95, 253,
    // forth
    6, 334, 400, 253,
    // fifth
    334, 400,
    // sixth
    400,
  ],
  [
    // first
    102, 209, 252, 113, 30, 107, 103, 6, 334, 105, 61, 180, 246, 106, 245, 91,
    400, 96, 58, 141, 111, 276, 271, 320, 95, 269, 250, 29, 253, 296, 92, 275,
    // second
    102, 113, 30, 6, 334, 61, 246, 245, 400, 58, 276, 320, 95, 29, 253, 275,
    // third
    113, 6, 334, 246, 400, 276, 95, 253,
    // forth
    6, 334, 400, 253,
    // fifth
    334, 400,
    // sixth
    400,
  ],
  [
    // first
    102, 209, 252, 113, 30, 107, 103, 6, 334, 105, 61, 180, 246, 106, 245, 91,
    400, 96, 58, 141, 111, 276, 271, 320, 95, 269, 250, 29, 253, 296, 92, 275,
    // second
    209, 252, 30, 6, 334, 61, 246, 245, 400, 58, 276, 320, 95, 29, 253, 275,
    // third
    252, 6, 334, 246, 400, 276, 95, 253,
    // forth
    6, 334, 400, 253,
    // fifth
    334, 400,
    // sixth
    400,
  ],
  [
    // first
    102, 209, 252, 113, 30, 107, 103, 6, 334, 105, 61, 180, 246, 106, 245, 91,
    400, 96, 58, 141, 111, 276, 271, 320, 95, 269, 250, 29, 253, 296, 92, 275,
    // second
    102, 113, 30, 6, 334, 61, 246, 245, 400, 58, 276, 320, 95, 29, 253, 275,
    // third
    113, 6, 334, 246, 400, 276, 95, 253,
    // forth
    6, 334, 400, 253,
    // fifth
    334, 400,
    // sixth
    400,
  ],
  [
    //* first round
    401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415,
    416, 417, 418, 419, 420, 421, 422, 423, 424, 425, 426, 427, 428, 429, 430,
    431, 432,
    //* second round
    401, 403, 405, 407, 409, 411, 413, 415, 417, 419, 421, 423, 425, 427, 429,
    431,
    //* third round
    401, 405, 409, 413, 417, 421, 425, 429,
    //* forth round
    401, 409, 417, 425,
    //* 5th round
    401, 471,
    //* 6th round
    0,
  ],
];

export const WinningTokenBrackets = [
  {
    teamsIds: teamIdsArray,
    finalsTeamOneScore: 100,
    finalsTeamTwoScore: 50,
  },
  {
    teamsIds: testBrackets[1],
    finalsTeamOneScore: 110,
    finalsTeamTwoScore: 50,
  },
  {
    teamsIds: testBrackets[2],
    finalsTeamOneScore: 110,
    finalsTeamTwoScore: 60,
  },
  {
    teamsIds: testBrackets[3],
    finalsTeamOneScore: 110,
    finalsTeamTwoScore: 120,
  },
  {
    teamsIds: testBrackets[4],
    finalsTeamOneScore: 110,
    finalsTeamTwoScore: 70,
  },
  {
    teamsIds: testBrackets[5],
    finalsTeamOneScore: 110,
    finalsTeamTwoScore: 80,
  },
  {
    teamsIds: testBrackets[6],
    finalsTeamOneScore: 110,
    finalsTeamTwoScore: 75,
  },
  {
    teamsIds: testBrackets[7],
    finalsTeamOneScore: 110,
    finalsTeamTwoScore: 75,
  },
  {
    teamsIds: testBrackets[8],
    finalsTeamOneScore: 110,
    finalsTeamTwoScore: 75,
  },
  {
    teamsIds: testBrackets[9],
    finalsTeamOneScore: 110,
    finalsTeamTwoScore: 75,
  },
  {
    teamsIds: testBrackets[10],
    finalsTeamOneScore: 110,
    finalsTeamTwoScore: 75,
  },
  {
    teamsIds: testBrackets[11],
    finalsTeamOneScore: 110,
    finalsTeamTwoScore: 75,
  },
  {
    teamsIds: testBrackets[12],
    finalsTeamOneScore: 110,
    finalsTeamTwoScore: 75,
  },
  {
    teamsIds: testBrackets[13],
    finalsTeamOneScore: 110,
    finalsTeamTwoScore: 75,
  },
  {
    teamsIds: testBrackets[14],
    finalsTeamOneScore: 110,
    finalsTeamTwoScore: 75,
  },
];

export const WinningBracket: DataTypes.BracketStruct = {
  teamsIds: winningBracketIds,
  finalsTeamOneScore: 100,
  finalsTeamTwoScore: 101,
};

export const newUserBracket: DataTypes.BracketStruct = {
  teamsIds: newUserBracketIds,
  finalsTeamOneScore: 100,
  finalsTeamTwoScore: 50,
};

export const TOP1_TIERED_REWARD_RANGES = [1, 2];

export const TOP1_TIERED_REWARD_PERCENTAGES = [10000, 0];

export const TOP5_TIERED_REWARD_RANGES = [1, 2, 3, 4, 5, 6];

export const TOP5_TIERED_REWARD_PERCENTAGES = [3700, 2500, 1500, 1200, 1100, 0];

export const TOP10_TIERED_REWARD_RANGES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export const TOP10_TIERED_REWARD_PERCENTAGES = [
  2900, 1700, 1200, 1000, 800, 690, 590, 490, 350, 280, 0,
];

export const TOP100_TIERED_REWARD_RANGES = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 16,

  21, 26, 31, 36, 41, 51, 61, 76, 101,
];

export const TOP100_TIERED_REWARD_PERCENTAGES = [
  2150, 1300, 740, 640, 540, 440, 320, 190, 160, 130, 600, 450, 275, 225, 190,
  170, 300, 270, 360, 550, 0,
];

export const times = {
  ONE_MIN: 60,
  ONE_HOUR: 60 * 60,
  ONE_DAY: 60 * 60 * 24,
  ONE_WEEK: 60 * 60 * 24 * 7,
};

export const defaults = {
  SOFT_STOP: times.ONE_HOUR,
  HARD_STOP: times.ONE_DAY,
  HALF_TOKEN: ethers.utils.parseEther("0.5").toString(),
  ONE_TOKEN: ethers.utils.parseEther("1").toString(),
  TWO_TOKENS: ethers.utils.parseEther("2").toString(),
  THREE_TOKENS: ethers.utils.parseEther("3").toString(),
  SEASON: 1,
  DIVISION: 1,
  AUCTION_ID: 1,
  SWAP_ID: 1,
  TOKEN_ID: 1, // refers to PlayerV2Token (Gen2) // starts from 1
  CARD_IMAGE_ID: 100, // refers to NomoNFT (Gen1). 100 On purpose, as it can be minted from whichever we want to start
  USERS_COUNT: 12,
  ROSTER_SIZE: 20,
  TOTAL_ROUNDS: 20,
  TOKENS_TO_MINT: ethers.utils.parseEther("20").toString(),
  REQUESTED_TOKEN: 2, // refers PlayerV2Token (Gen2)
  PROPOSED_TOKEN: 1, // refers to PlayerV2Token (Gen2)
  TOKENS_TO_MINT_BULK: ethers.utils.parseEther("1000").toString(),
};

export const newBracketToUpdate = {
  teamsIds: testBrackets[2],
  finalsTeamOneScore: 110,
  finalsTeamTwoScore: 50,
};

export const oldUserBracket = {
  teamsIds: oldUserBracketIds,
  finalsTeamOneScore: 100,
  finalsTeamTwoScore: 50,
};

export const tournamentsTestConstants = {
  events: {
    LogAddSportsLeague: "LogAddSportsLeague",
    LogDisableSportsLeague: "LogDisableSportsLeague",
    LogAddTournamentFormat: "LogAddTournamentFormat",
    LogDisableTournamentFormat: "LogDisableTournamentFormat",
    LogAddTournament: "LogAddTournament",
    LogAddPool: "LogAddPool",
    LogPoolEntered: "LogPoolEntered",
    DelegateSuccessful: "DelegateSuccessful",
    TrustedForwarderSet: "TrustedForwarderSet",
  },
  args: {
    SportsLeagueName: "NFL",
    TournamentFormatName: "Playoff Brackets",
    TournamentType: 0, // Brackets
    TournamentName: "NFL23 Tournament",
    PoolName: "First pool",
    TournamentId: 1,
    TournamentRoundsCount: 6,
    TournamentFormatId: 1,
    SportsLeagueIdFootball: 1,
    Sport: 1, // Football
    PoolId: 1,
    FinalsScoreSum: 100,
    WinningTokenIds: [1, 2],
    openFrom: Math.round(Date.now() / 1000) - 60,
    openTo: Math.round(Date.now() / 1000) + 24 * ONE_HOUR,
    TournamentSeason: 1,
    winnersPerRound: [32, 16, 8, 4, 2, 1],
    maxWinnersCount: 20,
    addPoolArgs: {
      name: "Last Man Standing",
      tournamentId: ethers.BigNumber.from(1),
      maxEntries: ethers.BigNumber.from(10),
      entryFee: ethers.BigNumber.from(100),
      poolCurrencyAddress: zeroAddress, // will be initialized in the tests when a contract is deployed
      accessTokenAddress: zeroAddress, // will be initialized in the tests when a contract is deployed
      accessTokenMinAmount: 0, // 10 decimals
      prizeModelType: 0,
      stakeToPlayAmount: ethers.BigNumber.from(10000),
      prizeDistributionType: 1, // WinnerTakesAll
      rewardDistributionId: 1,
      royaltyType: 0, // Percentage
      royaltyAmount: ethers.BigNumber.from(50),
      sponsoredPrizeAmount: ethers.BigNumber.from(1000), // TODO: remove (pools can be not funded at the beginning)
      isFeatured: true,
      allowEditableBrackets: true,
    },
    updateBracketArgs: {
      _poolId: 1,
      tokenId: 1,
      tokenUri: mockIpfsUri,
      oldBracket: oldUserBracket,
      newBracket: oldUserBracket,
    },
  },
  errors: {
    TournamentClosedForPoolCreation:
      "TournamentsFacet__TournamentClosedForPoolCreation",
    TournamentAlreadyStarted: "TournamentsFacet__TournamentAlreadyStarted",
    PoolAlreadyFull: "TournamentsFacet__PoolAlreadyFull",
    NotEnoughAmountTokenGatedAccess:
      "TournamentsFacet__NotEnoughAmountTokenGatedAccess",
    PoolDoesntAllowEditableBracket:
      "TournamentsFacet__PoolDoesntAllowEditableBrackets",
    ERC20InsufficientAllowance: "ERC20: insufficient allowance",
    InvalidBracketLength: "TournamentsFacet__InvalidBracketLength",
    InvalidDelegateVaultPairing:
      "TournamentsFacet__InvalidDelegateVaultPairing",
    SportsLeagueNotActive: "TournamentsFacet__SportsLeagueNotActive",
    FormatNotActive: "TournamentsFacet__TournamentFormatNotActive",
    TournamentNotActive: "TournamentsFacet__TournamentNotActive",
    StakeToPlayShouldNotHaveEntryFee:
      "TournamentsFacet__StakeToPlayShouldntHaveEntryFee",
    StakeToPlayShouldHaveAmount:
      "TournamentsFacet__StakeToPlayShouldHaveAmount",
    RewardDistributionNotFound: "TournamentsFacet__RewardDistributionNotFound",
    CantEnterPoolFromAnotherSeason:
      "TournamentsFacet__CantEnterPoolFromAnotherSeason",
    TransferEntryFeeFail: "TournamentsFacet__TransferEntryFeeFail",
  },
};

export enum PrizeModelType {
  PercentageOfEntryFees,
  SponsoredPrize,
  StakeToPlay,
}

export enum PrizeDistributionType {
  Standard,
  WinnerTakesAll,
}

export enum RoyaltyType {
  Percentage,
}

export enum Sport {
  Basketball,
  Football,
}

export enum TournamentType {
  Brackets,
  RoundRobin,
  Combined,
}

/* Start of 2022 Mock Data */

// Oracle bracket results array to be updated after round 1
export const oracleBracketTruthIdsRound1 = [
  106, 61, 52, 63, 110, 96, 23, 279, 334, 7, 344, 276, 5001, 111, 97, 26, 247,
  114, 6, 102, 95, 277, 98, 58, 108, 21, 335, 253, 109, 94, 240, 169, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0,
];

// --/-- after round 2
export const oracleBracketTruthIdsRound2 = [
  106, 61, 52, 63, 110, 96, 23, 279, 334, 7, 344, 276, 5001, 111, 97, 26, 247,
  114, 6, 102, 95, 277, 98, 58, 108, 21, 335, 253, 109, 94, 240, 169, 106, 63,
  110, 23, 334, 276, 111, 26, 247, 6, 95, 58, 21, 253, 94, 169, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

// --/-- after round 3
export const oracleBracketTruthIdsRound3 = [
  106, 61, 52, 63, 110, 96, 23, 279, 334, 7, 344, 276, 5001, 111, 97, 26, 247,
  114, 6, 102, 95, 277, 98, 58, 108, 21, 335, 253, 109, 94, 240, 169, 106, 63,
  110, 23, 334, 276, 111, 26, 247, 6, 95, 58, 21, 253, 94, 169, 106, 23, 276,
  26, 6, 58, 21, 169, 0, 0, 0, 0, 0, 0, 0,
];

// --/-- after round 4
export const oracleBracketTruthIdsRound4 = [
  106, 61, 52, 63, 110, 96, 23, 279, 334, 7, 344, 276, 5001, 111, 97, 26, 247,
  114, 6, 102, 95, 277, 98, 58, 108, 21, 335, 253, 109, 94, 240, 169, 106, 63,
  110, 23, 334, 276, 111, 26, 247, 6, 95, 58, 21, 253, 94, 169, 106, 23, 276,
  26, 6, 58, 21, 169, 106, 26, 58, 21, 0, 0, 0,
];

// --/-- after round 5
export const oracleBracketTruthIdsRound5 = [
  106, 61, 52, 63, 110, 96, 23, 279, 334, 7, 344, 276, 5001, 111, 97, 26, 247,
  114, 6, 102, 95, 277, 98, 58, 108, 21, 335, 253, 109, 94, 240, 169, 106, 63,
  110, 23, 334, 276, 111, 26, 247, 6, 95, 58, 21, 253, 94, 169, 106, 23, 276,
  26, 6, 58, 21, 169, 106, 26, 58, 21, 21, 106, 0,
];

// --/-- after round 6
export const oracleBracketTruthIdsRound6 = [
  106, 61, 52, 63, 110, 96, 23, 279, 334, 7, 344, 276, 5001, 111, 97, 26, 247,
  114, 6, 102, 95, 277, 98, 58, 108, 21, 335, 253, 109, 94, 240, 169, 106, 63,
  110, 23, 334, 276, 111, 26, 247, 6, 95, 58, 21, 253, 94, 169, 106, 23, 276,
  26, 6, 58, 21, 169, 106, 26, 58, 21, 21, 106, 106,
];

export const oracleBracketTruthAllRounds = [
  {
    teamsIds: oracleBracketTruthIdsRound1,
    finalsTeamOneScore: 0,
    finalsTeamTwoScore: 0,
  },
  {
    teamsIds: oracleBracketTruthIdsRound2,
    finalsTeamOneScore: 0,
    finalsTeamTwoScore: 0,
  },
  {
    teamsIds: oracleBracketTruthIdsRound3,
    finalsTeamOneScore: 0,
    finalsTeamTwoScore: 0,
  },
  {
    teamsIds: oracleBracketTruthIdsRound4,
    finalsTeamOneScore: 0,
    finalsTeamTwoScore: 0,
  },
  {
    teamsIds: oracleBracketTruthIdsRound5,
    finalsTeamOneScore: 0,
    finalsTeamTwoScore: 0,
  },
  {
    teamsIds: oracleBracketTruthIdsRound6,
    finalsTeamOneScore: 100,
    finalsTeamTwoScore: 101,
  },
];

export const MarchMadness2022TopWinnersTokenIds = [
  109, 77, 191, 297, 138, 208, 128, 145, 267, 188,
];

export const MarchMadness2022TopWinnersTokenIdScores = [
  119, 111, 110, 108, 104, 104, 103, 103, 102, 101,
];

// Brackets with 0 finals scores
export const MarchMadness2022TopWinnersBrackets = [
  // tokenId = 109
  {
    teamsIds: [
      106, 212, 52, 63, 269, 96, 246, 238, 334, 215, 3, 276, 5001, 111, 97, 26,
      247, 114, 6, 281, 95, 277, 209, 58, 108, 21, 5004, 253, 109, 94, 338, 268,
      106, 63, 96, 246, 334, 276, 111, 26, 247, 6, 277, 58, 108, 253, 94, 268,
      106, 96, 334, 26, 247, 58, 108, 268, 106, 334, 58, 108, 108, 106, 106,
    ],
    finalsTeamOneScore: 0,
    finalsTeamTwoScore: 0,
  },
  // tokenId = 77
  {
    teamsIds: [
      106, 212, 91, 63, 269, 96, 246, 279, 334, 7, 344, 276, 275, 111, 97, 26,
      247, 114, 134, 102, 217, 277, 98, 58, 108, 21, 335, 253, 31, 94, 240, 268,
      106, 91, 96, 279, 334, 276, 111, 26, 247, 102, 277, 58, 108, 335, 94, 268,
      106, 279, 334, 26, 247, 277, 108, 268, 106, 26, 247, 108, 26, 106, 106,
    ],
    finalsTeamOneScore: 0,
    finalsTeamTwoScore: 0,
  },
  // tokenId = 191
  {
    teamsIds: [
      106, 212, 52, 314, 269, 96, 23, 279, 334, 7, 3, 15, 275, 111, 49, 26, 247,
      114, 6, 281, 217, 277, 98, 58, 108, 65, 335, 253, 31, 94, 240, 268, 106,
      314, 269, 279, 334, 3, 275, 26, 247, 6, 217, 58, 108, 253, 31, 268, 106,
      279, 334, 26, 247, 58, 253, 268, 106, 334, 58, 268, 334, 106, 106,
    ],
    finalsTeamOneScore: 0,
    finalsTeamTwoScore: 0,
  },
  // tokenId = 297
  {
    teamsIds: [
      106, 212, 91, 63, 110, 96, 246, 279, 334, 7, 3, 276, 275, 111, 49, 26,
      247, 60, 134, 102, 217, 277, 209, 58, 108, 65, 5004, 253, 109, 94, 338,
      268, 106, 91, 96, 246, 334, 3, 111, 26, 247, 102, 217, 58, 108, 253, 109,
      268, 106, 96, 334, 26, 247, 58, 253, 268, 106, 334, 58, 253, 253, 106,
      106,
    ],
    finalsTeamOneScore: 0,
    finalsTeamTwoScore: 0,
  },
  // tokenId = 138
  {
    teamsIds: [
      106, 61, 52, 314, 269, 261, 246, 279, 334, 215, 3, 276, 5001, 74, 97, 26,
      247, 60, 134, 102, 217, 277, 209, 58, 108, 21, 5004, 253, 31, 94, 240,
      268, 106, 314, 269, 246, 334, 276, 5001, 26, 247, 102, 277, 58, 108, 253,
      31, 268, 106, 269, 334, 26, 102, 277, 253, 268, 106, 26, 102, 268, 268,
      106, 106,
    ],
    finalsTeamOneScore: 0,
    finalsTeamTwoScore: 0,
  },
  // tokenId = 208
  {
    teamsIds: [
      106, 212, 91, 314, 269, 261, 246, 279, 334, 215, 3, 15, 5001, 111, 49, 26,
      247, 114, 134, 281, 95, 277, 98, 58, 108, 21, 5004, 253, 31, 94, 338, 268,
      106, 91, 261, 279, 334, 15, 111, 26, 247, 134, 277, 58, 21, 253, 31, 268,
      106, 279, 334, 26, 247, 277, 253, 268, 106, 26, 277, 268, 268, 106, 106,
    ],
    finalsTeamOneScore: 0,
    finalsTeamTwoScore: 0,
  },
  // tokenId = 128
  {
    teamsIds: [
      106, 212, 91, 63, 269, 96, 23, 279, 334, 215, 3, 15, 5001, 111, 97, 26,
      247, 114, 134, 281, 95, 277, 98, 58, 108, 21, 5004, 253, 31, 94, 240, 268,
      106, 91, 96, 279, 334, 3, 111, 26, 247, 281, 95, 58, 108, 5004, 31, 268,
      106, 279, 334, 26, 247, 58, 108, 268, 106, 334, 247, 268, 334, 106, 106,
    ],
    finalsTeamOneScore: 0,
    finalsTeamTwoScore: 0,
  },
  // tokenId = 145
  {
    teamsIds: [
      106, 212, 52, 63, 269, 261, 246, 279, 334, 7, 344, 15, 5001, 111, 49, 26,
      247, 114, 6, 281, 95, 277, 98, 58, 108, 21, 335, 253, 31, 158, 338, 268,
      106, 52, 269, 246, 334, 15, 5001, 26, 247, 6, 277, 58, 21, 335, 31, 338,
      106, 246, 334, 5001, 247, 58, 21, 31, 106, 334, 58, 21, 21, 106, 21,
    ],
    finalsTeamOneScore: 0,
    finalsTeamTwoScore: 0,
  },
  // tokenId = 267
  {
    teamsIds: [
      106, 212, 91, 63, 269, 96, 246, 279, 334, 215, 3, 276, 275, 111, 97, 26,
      247, 60, 6, 102, 217, 277, 98, 58, 108, 21, 335, 253, 109, 94, 240, 268,
      106, 63, 269, 279, 215, 3, 111, 26, 247, 102, 277, 58, 108, 253, 94, 268,
      106, 279, 215, 26, 247, 277, 253, 268, 106, 215, 247, 268, 268, 106, 106,
    ],
    finalsTeamOneScore: 0,
    finalsTeamTwoScore: 0,
  },
  // tokenId = 188
  {
    teamsIds: [
      106, 212, 91, 63, 269, 261, 246, 279, 334, 7, 344, 276, 5001, 111, 49, 26,
      247, 114, 6, 281, 217, 277, 209, 58, 108, 65, 335, 253, 31, 94, 338, 268,
      106, 91, 269, 279, 334, 276, 111, 26, 247, 6, 277, 209, 108, 253, 94, 268,
      106, 279, 334, 26, 247, 277, 253, 268, 106, 334, 247, 268, 268, 106, 106,
    ],
    finalsTeamOneScore: 0,
    finalsTeamTwoScore: 0,
  },
];

// Brackets with non-zero finals scores
export const MarchMadness2022TopWinnersBracketsFinalsScores = [
  // tokenId = 109
  {
    teamsIds: [
      106, 212, 52, 63, 269, 96, 246, 238, 334, 215, 3, 276, 5001, 111, 97, 26,
      247, 114, 6, 281, 95, 277, 209, 58, 108, 21, 5004, 253, 109, 94, 338, 268,
      106, 63, 96, 246, 334, 276, 111, 26, 247, 6, 277, 58, 108, 253, 94, 268,
      106, 96, 334, 26, 247, 58, 108, 268, 106, 334, 58, 108, 108, 106, 106,
    ],
    finalsTeamOneScore: 100,
    finalsTeamTwoScore: 100,
  },
  // tokenId = 77
  {
    teamsIds: [
      106, 212, 91, 63, 269, 96, 246, 279, 334, 7, 344, 276, 275, 111, 97, 26,
      247, 114, 134, 102, 217, 277, 98, 58, 108, 21, 335, 253, 31, 94, 240, 268,
      106, 91, 96, 279, 334, 276, 111, 26, 247, 102, 277, 58, 108, 335, 94, 268,
      106, 279, 334, 26, 247, 277, 108, 268, 106, 26, 247, 108, 26, 106, 106,
    ],
    finalsTeamOneScore: 100,
    finalsTeamTwoScore: 100,
  },
  // tokenId = 191
  {
    teamsIds: [
      106, 212, 52, 314, 269, 96, 23, 279, 334, 7, 3, 15, 275, 111, 49, 26, 247,
      114, 6, 281, 217, 277, 98, 58, 108, 65, 335, 253, 31, 94, 240, 268, 106,
      314, 269, 279, 334, 3, 275, 26, 247, 6, 217, 58, 108, 253, 31, 268, 106,
      279, 334, 26, 247, 58, 253, 268, 106, 334, 58, 268, 334, 106, 106,
    ],
    finalsTeamOneScore: 100,
    finalsTeamTwoScore: 100,
  },
  // tokenId = 297
  {
    teamsIds: [
      106, 212, 91, 63, 110, 96, 246, 279, 334, 7, 3, 276, 275, 111, 49, 26,
      247, 60, 134, 102, 217, 277, 209, 58, 108, 65, 5004, 253, 109, 94, 338,
      268, 106, 91, 96, 246, 334, 3, 111, 26, 247, 102, 217, 58, 108, 253, 109,
      268, 106, 96, 334, 26, 247, 58, 253, 268, 106, 334, 58, 253, 253, 106,
      106,
    ],
    finalsTeamOneScore: 100,
    finalsTeamTwoScore: 100,
  },
  // tokenId = 138
  {
    teamsIds: [
      106, 61, 52, 314, 269, 261, 246, 279, 334, 215, 3, 276, 5001, 74, 97, 26,
      247, 60, 134, 102, 217, 277, 209, 58, 108, 21, 5004, 253, 31, 94, 240,
      268, 106, 314, 269, 246, 334, 276, 5001, 26, 247, 102, 277, 58, 108, 253,
      31, 268, 106, 269, 334, 26, 102, 277, 253, 268, 106, 26, 102, 268, 268,
      106, 106,
    ],
    finalsTeamOneScore: 100,
    finalsTeamTwoScore: 100,
  },
  // tokenId = 208
  {
    teamsIds: [
      106, 212, 91, 314, 269, 261, 246, 279, 334, 215, 3, 15, 5001, 111, 49, 26,
      247, 114, 134, 281, 95, 277, 98, 58, 108, 21, 5004, 253, 31, 94, 338, 268,
      106, 91, 261, 279, 334, 15, 111, 26, 247, 134, 277, 58, 21, 253, 31, 268,
      106, 279, 334, 26, 247, 277, 253, 268, 106, 26, 277, 268, 268, 106, 106,
    ],
    finalsTeamOneScore: 100,
    finalsTeamTwoScore: 100,
  },
  // tokenId = 128
  {
    teamsIds: [
      106, 212, 91, 63, 269, 96, 23, 279, 334, 215, 3, 15, 5001, 111, 97, 26,
      247, 114, 134, 281, 95, 277, 98, 58, 108, 21, 5004, 253, 31, 94, 240, 268,
      106, 91, 96, 279, 334, 3, 111, 26, 247, 281, 95, 58, 108, 5004, 31, 268,
      106, 279, 334, 26, 247, 58, 108, 268, 106, 334, 247, 268, 334, 106, 106,
    ],
    finalsTeamOneScore: 100,
    finalsTeamTwoScore: 100,
  },
  // tokenId = 145
  {
    teamsIds: [
      106, 212, 52, 63, 269, 261, 246, 279, 334, 7, 344, 15, 5001, 111, 49, 26,
      247, 114, 6, 281, 95, 277, 98, 58, 108, 21, 335, 253, 31, 158, 338, 268,
      106, 52, 269, 246, 334, 15, 5001, 26, 247, 6, 277, 58, 21, 335, 31, 338,
      106, 246, 334, 5001, 247, 58, 21, 31, 106, 334, 58, 21, 21, 106, 21,
    ],
    finalsTeamOneScore: 100,
    finalsTeamTwoScore: 100,
  },
  // tokenId = 267
  {
    teamsIds: [
      106, 212, 91, 63, 269, 96, 246, 279, 334, 215, 3, 276, 275, 111, 97, 26,
      247, 60, 6, 102, 217, 277, 98, 58, 108, 21, 335, 253, 109, 94, 240, 268,
      106, 63, 269, 279, 215, 3, 111, 26, 247, 102, 277, 58, 108, 253, 94, 268,
      106, 279, 215, 26, 247, 277, 253, 268, 106, 215, 247, 268, 268, 106, 106,
    ],
    finalsTeamOneScore: 100,
    finalsTeamTwoScore: 100,
  },
  // tokenId = 188
  {
    teamsIds: [
      106, 212, 91, 63, 269, 261, 246, 279, 334, 7, 344, 276, 5001, 111, 49, 26,
      247, 114, 6, 281, 217, 277, 209, 58, 108, 65, 335, 253, 31, 94, 338, 268,
      106, 91, 269, 279, 334, 276, 111, 26, 247, 6, 277, 209, 108, 253, 94, 268,
      106, 279, 334, 26, 247, 277, 253, 268, 106, 334, 247, 268, 268, 106, 106,
    ],
    finalsTeamOneScore: 100,
    finalsTeamTwoScore: 100,
  },
];

/* End of 2022 Mock Data */

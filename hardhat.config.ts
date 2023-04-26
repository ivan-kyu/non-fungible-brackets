import * as dotenv from "dotenv";
import { HardhatUserConfig, task } from "hardhat/config";
import { FORTY_MINS_IN_MS } from "./test/helpers/constants";
import "@nomiclabs/hardhat-etherscan";
import "@nomicfoundation/hardhat-toolbox";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-contract-sizer";

dotenv.config();

const lazyImport = async (module: any) => {
  return await import(module);
};

task("deploy-contracts", "Deploys contracts").setAction(async () => {
  const { deployContracts } = await lazyImport("./scripts/deploy");
  await deployContracts();
});

task("verify-contracts", "Verifies contracts").setAction(async () => {
  const { verifyContracts } = await lazyImport("./scripts/verify");
  await verifyContracts();
});

task("verify-diamond", "Verifies diamond").setAction(async () => {
  const { verifyDiamond } = await lazyImport("./scripts/verifyDiamond");
  await verifyDiamond();
});

task("setupTournament", "sets up a tournament")
  .addParam("format", "Tournament format name")
  .addParam("type", "Tournament type")
  .addParam("sportsleague", "Sports League Name")
  .addParam("sport", "sport number - 0, 1, ...")
  .setAction(async (taskArgs) => {
    console.log(taskArgs);
    const setupTournament = require("./scripts/setupTournament");
    await setupTournament(
      taskArgs.format,
      taskArgs.type,
      taskArgs.sportsleague,
      taskArgs.sport
    );
  });

task("addTournament", "adds a tournament")
  .addParam("league", "LeagueId")
  .addParam("format", "formatId")
  .addParam("name", "Tournament Name")
  .addParam("season", "season number")
  .setAction(async (taskArgs) => {
    console.log(taskArgs);
    const addTournament = require("./scripts/addTournament");
    await addTournament(
      taskArgs.league,
      taskArgs.format,
      taskArgs.name,
      taskArgs.season
    );
  });

task("updateRound", "Updates the round of a tournament")
  .addParam("diamond", "Diamond Address")
  .addParam("tournamentid", "id of the tournament")
  .setAction(async (taskArgs) => {
    console.log(taskArgs);
    const updateRound = require("./scripts/updateRound");
    await updateRound(taskArgs.diamond, taskArgs.tournamentid);
  });

task("initializeTournament", "initializes a tournament")
  .addParam("tournamentid", "TournamentId")
  .addParam("rounds", "Rounds Count")
  .addParam("bracketlen", "Length of the bracket array")
  .addParam("stage", "TournamentStage")
  .addParam("maxpoints", "Bracket Maximum Points")
  .addParam("sportseason", "Tournament sport season")
  .setAction(async (taskArgs) => {
    console.log(taskArgs);
    const initialize = require("./scripts/initializeTournament");
    await initialize(
      taskArgs.tournamentid,
      taskArgs.rounds,
      taskArgs.bracketlen,
      taskArgs.maxpoints,
      taskArgs.stage,
      taskArgs.sportseason
    );
  });

task("signAddPool", "Sign and execute an addPool meta tx via Defender Relayer")
  .addParam("poolcurrencyerc20address", "Pool Currency ERC20 Address")
  .addParam("tournamentid", "Tournament ID")
  .setAction(async (taskArgs) => {
    console.log(taskArgs);
    const signAddPool = await require("./scripts/meta/signAddPool");
    await signAddPool(
      taskArgs.poolcurrencyerc20address,
      taskArgs.tournamentid
    );
  });

task("signEnterPool", "Sign and execute an EnterPool meta tx via Defender Relayer")
  .addParam("poolid", "Pool Id")
  .addParam("tokenid", "Token Id")
  .addParam("iseditable", "Is Editable Bracket")
  .setAction(async (taskArgs) => {
    console.log(taskArgs);
    const signEnterPool = await require("./scripts/meta/signEnterPool");
    await signEnterPool(
      taskArgs.poolid,
      taskArgs.tokenid,
      taskArgs.iseditable
    );
  });

task("signUpdateBracket", "Sign and execute an UpdateBracket meta tx via Defender Relayer")
  .addParam("poolid", "Pool Id")
  .addParam("tokenid", "Token Id")
  .setAction(async (taskArgs) => {
    console.log(taskArgs);
    const signUpdateBracket = await require("./scripts/meta/signUpdateBracket");
    await signUpdateBracket(
      taskArgs.poolid,
      taskArgs.tokenid
    );
  });

  task("signClaim", "Sign and execute a claim meta tx via Defender Relayer")
  .addParam("poolid", "Pool Id")
  .addParam("tokenid", "Token Id")
  .setAction(async (taskArgs) => {
    console.log(taskArgs);
    const signClaim = await require("./scripts/meta/signClaim");
    await signClaim(taskArgs.poolid, taskArgs.tokenid);
  });

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "hardhat",
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  networks: {
    coverage: {
      url: "http://localhost:8545",
    },
    hardhat: {},
    local: {
      url: "http://127.0.0.1:8545",
    },
    // Mumbai Testnet
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      chainId: 80001,
      accounts: [`0x${process.env.OWNER}`],
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 1.5,
    },
    // Matic Mainnet
    mainnet: {
      url: "https://rpc-mainnet.maticvigil.com/",
      chainId: 137,
      accounts: [`0x${process.env.OWNER}`],
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 1.5,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  mocha: {
    timeout: FORTY_MINS_IN_MS,
  },
  typechain: {
    outDir: "typechain",
  },
};

export default config;

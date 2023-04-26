import { ethers } from "hardhat";
import { IDiamond } from "../typechain";
import * as dotenv from "dotenv";
import { tournamentsTestConstants } from "../test/helpers/constants";
import { assert } from "chai";
dotenv.config();

async function addTournament(
  leagueId: number,
  formatId: number,
  tournamentName: string,
  season: number
) {
  const provider = new ethers.providers.AlchemyProvider(
    "maticmum",
    process.env.ALCHEMY_KEY
  );

  const wallet = new ethers.Wallet(process.env.OWNER!, provider);

  assert(
    process.env.DIAMOND_CONTRACT !== undefined,
    "DIAMOND_CONTRACT is not set"
  );
  const diamondAddress = process.env.DIAMOND_CONTRACT!;

  const nfbDiamond = (await ethers.getContractAt(
    "IDiamond",
    diamondAddress,
    wallet
  )) as IDiamond;

  console.log("Adding a tournament ...");

  const ONE_MIN = 60;

  const ONE_HOUR = ONE_MIN * 60;

  const openFrom = Math.round(Date.now() / 1000);
  const openTo = openFrom + ONE_HOUR;

  const addTournamentTx = await nfbDiamond.addTournament(
    leagueId,
    formatId,
    tournamentName,
    openFrom,
    openTo,
    season,
    { gasLimit: 300000 }
  );

  await addTournamentTx.wait();

  console.log(`Tournament added!\n`);
}

module.exports = addTournament;

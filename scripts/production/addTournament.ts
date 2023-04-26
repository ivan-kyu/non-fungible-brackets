import { ethers } from "hardhat";
import { IDiamond } from "../typechain";
import * as dotenv from "dotenv";
import { assert } from "chai";
dotenv.config();

async function addTournament(
  leagueId: number,
  formatId: number,
  tournamentName: string,
  season: number
) {
  const provider = new ethers.providers.InfuraProvider("matic");

  let wallet = new ethers.Wallet(process.env.OWNER!);
  wallet = wallet.connect(provider);

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

  const openFrom = process.env.OPEN_FROM!;
  const openTo = process.env.OPEN_TO!;

  assert(openFrom !== undefined, "OPEN_FROM is not set");
  assert(openTo !== undefined, "OPEN_TO is not set");

  const addTournamentTx = await nfbDiamond.addTournament(
    leagueId,
    formatId,
    tournamentName,
    openFrom,
    openTo,
    season,
    { gasPrice: 140000000000 }
  );

  await addTournamentTx.wait();

  console.log(`Tournament added!\n`);
}

module.exports = addTournament;
